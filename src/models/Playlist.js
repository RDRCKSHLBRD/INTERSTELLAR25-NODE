// ============================================================================
// src/models/Playlist.js — V1.0 (Interstellar Packages)
//
// Playlist data model. Postgres for all writes + user playlist reads.
// Flash layer (SQLite) handles public/curated playlist reads — no DB stress
// for casual browsing. Only authenticated actions touch Postgres.
//
// Two playlist types:
//   - "curated"  → Roderick's editorial playlists (public, flash-cached)
//   - "user"     → Created by logged-in users (Postgres only)
//
// Session playlists (anonymous "queue") stored in localStorage client-side
// — never touches the database. Only saved if user logs in and confirms.
//
// RODUX principle: JS builds data, CSS renders. Model is pure data.
// ============================================================================

import { query, transaction } from '../config/database.js';

const PlaylistModel = {

  // ══════════════════════════════════════════════════════════════
  // CREATE
  // ══════════════════════════════════════════════════════════════

  /**
   * Create a new playlist for an authenticated user.
   * @param {number} userId
   * @param {string} name
   * @param {string} [description]
   * @param {boolean} [isPublic=false]
   * @returns {object} The created playlist row
   */
  async create(userId, name, description = null, isPublic = false) {
    const result = await query(
      `INSERT INTO playlists (user_id, name, description, is_public, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [userId, name.trim(), description?.trim() || null, isPublic]
    );
    return result.rows[0];
  },


  // ══════════════════════════════════════════════════════════════
  // READ
  // ══════════════════════════════════════════════════════════════

  /**
   * Get all playlists for a user (their own playlists).
   * Includes song count per playlist.
   */
  async getByUser(userId) {
    const result = await query(
      `SELECT p.*,
              COUNT(ps.song_id)::int AS song_count
       FROM playlists p
       LEFT JOIN playlist_songs ps ON ps.playlist_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.updated_at DESC`,
      [userId]
    );
    return result.rows;
  },

  /**
   * Get all public playlists (curated + user-shared).
   * Used as Postgres fallback if flash isn't synced yet.
   * Lightweight: no song details, just counts.
   */
  async getPublic() {
    const result = await query(
      `SELECT p.id, p.name, p.description, p.is_public, p.created_at, p.updated_at,
              u.user_name AS creator_name,
              COUNT(ps.song_id)::int AS song_count
       FROM playlists p
       LEFT JOIN users u ON u.id = p.user_id
       LEFT JOIN playlist_songs ps ON ps.playlist_id = p.id
       WHERE p.is_public = true
       GROUP BY p.id, u.user_name
       ORDER BY p.updated_at DESC
       LIMIT 50`
    );
    return result.rows;
  },

  /**
   * Get a single playlist with its songs (full payload).
   * Songs include album name, artist name, duration, cover URL.
   */
  async getFull(playlistId) {
    const playlistResult = await query(
      `SELECT p.*, u.user_name AS creator_name
       FROM playlists p
       LEFT JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [playlistId]
    );

    if (playlistResult.rows.length === 0) return null;

    const playlist = playlistResult.rows[0];

    const songsResult = await query(
      `SELECT ps.position, ps.added_at,
              s.id AS song_id, s.name AS song_name, s.duration, s.audio_url, s.track_id,
              a.id AS album_id, a.name AS album_name, a.catalogue, a.cover_url,
              ar.name AS artist_name
       FROM playlist_songs ps
       JOIN songs s ON s.id = ps.song_id
       JOIN albums a ON a.id = s.album_id
       JOIN artists ar ON ar.id = a.artist_id
       WHERE ps.playlist_id = $1
       ORDER BY ps.position ASC, ps.added_at ASC`,
      [playlistId]
    );

    playlist.songs = songsResult.rows;
    playlist.song_count = songsResult.rows.length;
    return playlist;
  },


  // ══════════════════════════════════════════════════════════════
  // UPDATE
  // ══════════════════════════════════════════════════════════════

  /**
   * Update playlist metadata (name, description, visibility).
   * Only the owner can update.
   */
  async update(playlistId, userId, fields) {
    const sets = [];
    const vals = [];
    let idx = 1;

    if (fields.name !== undefined) {
      sets.push(`name = $${idx++}`);
      vals.push(fields.name.trim());
    }
    if (fields.description !== undefined) {
      sets.push(`description = $${idx++}`);
      vals.push(fields.description?.trim() || null);
    }
    if (fields.is_public !== undefined) {
      sets.push(`is_public = $${idx++}`);
      vals.push(!!fields.is_public);
    }

    if (sets.length === 0) return null;

    sets.push(`updated_at = NOW()`);
    vals.push(playlistId, userId);

    const result = await query(
      `UPDATE playlists SET ${sets.join(', ')}
       WHERE id = $${idx++} AND user_id = $${idx}
       RETURNING *`,
      vals
    );
    return result.rows[0] || null;
  },


  // ══════════════════════════════════════════════════════════════
  // DELETE
  // ══════════════════════════════════════════════════════════════

  /**
   * Delete a playlist and all its song associations.
   * Only the owner can delete.
   */
  async delete(playlistId, userId) {
    return transaction(async (client) => {
      // Remove song associations first
      await client.query(
        'DELETE FROM playlist_songs WHERE playlist_id = $1',
        [playlistId]
      );
      // Remove playlist (owner check)
      const result = await client.query(
        'DELETE FROM playlists WHERE id = $1 AND user_id = $2 RETURNING id',
        [playlistId, userId]
      );
      return result.rowCount > 0;
    });
  },


  // ══════════════════════════════════════════════════════════════
  // SONG MANAGEMENT
  // ══════════════════════════════════════════════════════════════

  /**
   * Add a song to a playlist. Auto-assigns position at the end.
   * Returns the playlist_songs row.
   */
  async addSong(playlistId, songId, userId) {
    // Verify ownership
    const owner = await query(
      'SELECT id FROM playlists WHERE id = $1 AND user_id = $2',
      [playlistId, userId]
    );
    if (owner.rows.length === 0) return null;

    // Get next position
    const posResult = await query(
      'SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM playlist_songs WHERE playlist_id = $1',
      [playlistId]
    );
    const position = posResult.rows[0].next_pos;

    // Check for duplicate
    const exists = await query(
      'SELECT 1 FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
      [playlistId, songId]
    );
    if (exists.rows.length > 0) {
      return { duplicate: true };
    }

    const result = await query(
      `INSERT INTO playlist_songs (playlist_id, song_id, position, added_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [playlistId, songId, position]
    );

    // Touch updated_at on parent playlist
    await query(
      'UPDATE playlists SET updated_at = NOW() WHERE id = $1',
      [playlistId]
    );

    return result.rows[0];
  },

  /**
   * Remove a song from a playlist.
   */
  async removeSong(playlistId, songId, userId) {
    // Verify ownership
    const owner = await query(
      'SELECT id FROM playlists WHERE id = $1 AND user_id = $2',
      [playlistId, userId]
    );
    if (owner.rows.length === 0) return false;

    const result = await query(
      'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
      [playlistId, songId]
    );

    if (result.rowCount > 0) {
      await query(
        'UPDATE playlists SET updated_at = NOW() WHERE id = $1',
        [playlistId]
      );
    }

    return result.rowCount > 0;
  },

  /**
   * Reorder songs in a playlist. Receives array of songIds in new order.
   */
  async reorderSongs(playlistId, songIds, userId) {
    // Verify ownership
    const owner = await query(
      'SELECT id FROM playlists WHERE id = $1 AND user_id = $2',
      [playlistId, userId]
    );
    if (owner.rows.length === 0) return false;

    return transaction(async (client) => {
      for (let i = 0; i < songIds.length; i++) {
        await client.query(
          'UPDATE playlist_songs SET position = $1 WHERE playlist_id = $2 AND song_id = $3',
          [i + 1, playlistId, songIds[i]]
        );
      }
      await client.query(
        'UPDATE playlists SET updated_at = NOW() WHERE id = $1',
        [playlistId]
      );
      return true;
    });
  },


  // ══════════════════════════════════════════════════════════════
  // OWNERSHIP CHECK (utility)
  // ══════════════════════════════════════════════════════════════

  async isOwner(playlistId, userId) {
    const result = await query(
      'SELECT id FROM playlists WHERE id = $1 AND user_id = $2',
      [playlistId, userId]
    );
    return result.rows.length > 0;
  }
};

export default PlaylistModel;