// ============================================================================
// src/routes/api/playlists.js — V1.0 (Interstellar Packages)
//
// Playlist API routes.
//
// PUBLIC (flash reads — no Postgres stress):
//   GET /api/playlists/public          → curated + public playlists
//   GET /api/playlists/:id             → single playlist with songs
//
// AUTHENTICATED (Postgres writes):
//   GET /api/playlists/mine            → current user's playlists
//   POST /api/playlists                → create playlist
//   PATCH /api/playlists/:id           → update metadata
//   DELETE /api/playlists/:id          → delete playlist
//   POST /api/playlists/:id/songs      → add song to playlist
//   DELETE /api/playlists/:id/songs/:songId → remove song
//
// Two-tier principle: browse from flash (SQLite), write to Postgres.
// Flash sync picks up public playlists on next sync cycle.
// ============================================================================

import express from 'express';
import flash from '../../config/flashdb.js';
import PlaylistModel from '../../models/Playlist.js';

const router = express.Router();


// ── Auth middleware (inline, same pattern as cart) ────────────────
function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, message: 'Login required' });
  }
  next();
}


// ══════════════════════════════════════════════════════════════
// PUBLIC ROUTES — lightweight reads
// ══════════════════════════════════════════════════════════════

// GET /api/playlists/public — curated + community playlists
// Tries flash first, falls back to Postgres
router.get('/public', async (req, res, next) => {
  try {
    // Flash layer read (if playlists are synced)
    if (flash.isReady() && typeof flash.getPublicPlaylists === 'function') {
      const cached = flash.getPublicPlaylists();
      if (cached && cached.length > 0) {
        return res.json({ success: true, data: cached, source: 'flash' });
      }
    }

    // Fallback: Postgres
    const playlists = await PlaylistModel.getPublic();
    res.json({ success: true, data: playlists, source: 'postgres' });
  } catch (error) {
    next(error);
  }
});


// GET /api/playlists/:id — single playlist with songs (public or owned)
router.get('/:id', async (req, res, next) => {
  try {
    const playlistId = parseInt(req.params.id);
    if (isNaN(playlistId)) {
      return res.status(400).json({ success: false, message: 'Invalid playlist ID' });
    }

    const playlist = await PlaylistModel.getFull(playlistId);
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }

    // Access check: public playlists anyone can see; private only owner
    const userId = req.session?.userId;
    if (!playlist.is_public && playlist.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Private playlist' });
    }

    res.json({ success: true, data: playlist });
  } catch (error) {
    next(error);
  }
});


// ══════════════════════════════════════════════════════════════
// AUTHENTICATED ROUTES — Postgres writes
// ══════════════════════════════════════════════════════════════

// GET /api/playlists/mine — current user's playlists
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const playlists = await PlaylistModel.getByUser(req.session.userId);
    res.json({ success: true, data: playlists });
  } catch (error) {
    next(error);
  }
});


// POST /api/playlists — create a new playlist
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { name, description, is_public } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Playlist name is required' });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Playlist name too long (max 100 chars)' });
    }

    // Rate limit: max 50 playlists per user
    const existing = await PlaylistModel.getByUser(req.session.userId);
    if (existing.length >= 50) {
      return res.status(429).json({ success: false, message: 'Maximum 50 playlists reached' });
    }

    const playlist = await PlaylistModel.create(
      req.session.userId,
      name,
      description || null,
      !!is_public
    );

    res.status(201).json({ success: true, data: playlist });
  } catch (error) {
    next(error);
  }
});


// PATCH /api/playlists/:id — update playlist metadata
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const playlistId = parseInt(req.params.id);
    if (isNaN(playlistId)) {
      return res.status(400).json({ success: false, message: 'Invalid playlist ID' });
    }

    const { name, description, is_public } = req.body;
    const updated = await PlaylistModel.update(playlistId, req.session.userId, {
      name, description, is_public
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Playlist not found or not yours' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});


// DELETE /api/playlists/:id — delete playlist
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const playlistId = parseInt(req.params.id);
    if (isNaN(playlistId)) {
      return res.status(400).json({ success: false, message: 'Invalid playlist ID' });
    }

    const deleted = await PlaylistModel.delete(playlistId, req.session.userId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Playlist not found or not yours' });
    }

    res.json({ success: true, message: 'Playlist deleted' });
  } catch (error) {
    next(error);
  }
});


// ══════════════════════════════════════════════════════════════
// SONG MANAGEMENT — add/remove songs from playlists
// ══════════════════════════════════════════════════════════════

// POST /api/playlists/:id/songs — add song to playlist
router.post('/:id/songs', requireAuth, async (req, res, next) => {
  try {
    const playlistId = parseInt(req.params.id);
    const { songId } = req.body;

    if (isNaN(playlistId) || !songId) {
      return res.status(400).json({ success: false, message: 'Playlist ID and songId required' });
    }

    const result = await PlaylistModel.addSong(playlistId, parseInt(songId), req.session.userId);

    if (!result) {
      return res.status(403).json({ success: false, message: 'Not your playlist' });
    }
    if (result.duplicate) {
      return res.status(409).json({ success: false, message: 'Song already in playlist' });
    }

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});


// DELETE /api/playlists/:id/songs/:songId — remove song from playlist
router.delete('/:id/songs/:songId', requireAuth, async (req, res, next) => {
  try {
    const playlistId = parseInt(req.params.id);
    const songId = parseInt(req.params.songId);

    if (isNaN(playlistId) || isNaN(songId)) {
      return res.status(400).json({ success: false, message: 'Invalid IDs' });
    }

    const removed = await PlaylistModel.removeSong(playlistId, songId, req.session.userId);
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Song not found in playlist or not your playlist' });
    }

    res.json({ success: true, message: 'Song removed' });
  } catch (error) {
    next(error);
  }
});


export default router;