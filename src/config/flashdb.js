// ============================================================================
// INTERSTELLAR PACKAGES — FlashDB (Read-Only Catalogue Cache)  V5
// src/config/flashdb.js
//
// Provides fast, synchronous reads against the local SQLite flash DB.
// Used by the application layer for all browsing/catalogue queries.
// Postgres is still used for writes: carts, purchases, auth, sessions.
//
// V5 additions:
//   - palette JSON parsing on album reads
//   - layout_type for template mode selection
//   - getLinerNotes() for extended essay content
//   - getAlbumFull / getArtistFull return parsed palettes + liner notes
//
// Usage:
//   import flash from '../config/flashdb.js';
//
//   const artist = flash.getArtistFull(1);        // artist + albums w/ palettes
//   const album  = flash.getAlbumFullByCatalogue('00040101');  // full payload
//   const notes  = flash.getLinerNotes(22);        // essay sections
//   const ready  = flash.isReady();                // false if flash.db missing
// ============================================================================

import Database from 'better-sqlite3';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FLASH_DB_PATH = join(__dirname, '../../data/flash.db');

let db = null;

function getDB() {
  if (db) return db;

  if (!existsSync(FLASH_DB_PATH)) {
    console.warn(`⚠️  FlashDB not found at ${FLASH_DB_PATH}`);
    console.warn('   Run: node scripts/flash-sync.js');
    console.warn('   Falling back to null — routes must handle gracefully');
    return null;
  }

  db = new Database(FLASH_DB_PATH, { readonly: true });
  db.pragma('journal_mode');

  const meta = db.prepare('SELECT * FROM flash_meta').all();
  const syncedAt = meta.find(m => m.key === 'synced_at');
  const v5 = meta.find(m => m.key === 'v5_schema');
  console.log(`⚡ FlashDB loaded (synced: ${syncedAt?.value || 'unknown'}, v5: ${v5?.value || 'false'})`);

  return db;
}

// ── Palette helper ──────────────────────────────────────────────
// palette is stored as JSON text in SQLite, parse it into an object

function parsePalette(paletteStr) {
  if (!paletteStr) return {};
  try {
    return JSON.parse(paletteStr);
  } catch {
    return {};
  }
}

// ── Artists ──────────────────────────────────────────────────────

function getAllArtists() {
  const d = getDB();
  if (!d) return [];
  return d.prepare(`
    SELECT a.*,
           (SELECT COUNT(*) FROM albums al WHERE al.artist_id = a.id) as album_count
    FROM artists a
    ORDER BY a.name
  `).all();
}

function getArtist(id) {
  const d = getDB();
  if (!d) return null;
  return d.prepare('SELECT * FROM artists WHERE id = ?').get(id);
}

function getArtistFull(artistId) {
  const artist = getArtist(artistId);
  if (!artist) return null;

  const d = getDB();
  const albums = d.prepare(`
    SELECT a.*, ar.name as artist_name,
           (SELECT COUNT(*) FROM songs s WHERE s.album_id = a.id) as song_count
    FROM albums a
    JOIN artists ar ON a.artist_id = ar.id
    WHERE a.artist_id = ?
    ORDER BY a.release_date DESC
  `).all(artistId);

  const albumsWithPalette = albums.map(a => ({
    ...a,
    palette: parsePalette(a.palette)
  }));

  return { ...artist, albums: albumsWithPalette };
}

// ── Albums ───────────────────────────────────────────────────────

function getAllAlbums() {
  const d = getDB();
  if (!d) return [];
  return d.prepare(`
    SELECT a.*, ar.name as artist_name
    FROM albums a
    JOIN artists ar ON a.artist_id = ar.id
    ORDER BY a.release_date DESC
  `).all();
}

function getAlbumsByArtist(artistId) {
  const d = getDB();
  if (!d) return [];
  return d.prepare(`
    SELECT a.*, ar.name as artist_name
    FROM albums a
    JOIN artists ar ON a.artist_id = ar.id
    WHERE a.artist_id = ?
    ORDER BY a.release_date DESC
  `).all(artistId);
}

function getAlbum(id) {
  const d = getDB();
  if (!d) return null;
  return d.prepare(`
    SELECT a.*, ar.name as artist_name, ar.description as artist_description
    FROM albums a
    JOIN artists ar ON a.artist_id = ar.id
    WHERE a.id = ?
  `).get(id);
}

function getAlbumByCatalogue(catalogue) {
  const d = getDB();
  if (!d) return null;
  return d.prepare(`
    SELECT a.*, ar.name as artist_name, ar.description as artist_description
    FROM albums a
    JOIN artists ar ON a.artist_id = ar.id
    WHERE a.catalogue = ?
  `).get(catalogue);
}

function getAlbumFull(albumId) {
  const album = getAlbum(albumId);
  if (!album) return null;

  const songs = getSongsByAlbum(albumId);
  const product = getProductByCatalogue(album.catalogue);
  const linerNotes = getLinerNotes(albumId);

  return {
    ...album,
    palette: parsePalette(album.palette),
    songs,
    product,
    linerNotes
  };
}

function getAlbumFullByCatalogue(catalogue) {
  const album = getAlbumByCatalogue(catalogue);
  if (!album) return null;

  const songs = getSongsByAlbum(album.id);
  const product = getProductByCatalogue(album.catalogue);
  const linerNotes = getLinerNotes(album.id);

  return {
    ...album,
    palette: parsePalette(album.palette),
    songs,
    product,
    linerNotes
  };
}

// ── Songs ────────────────────────────────────────────────────────

function getSongsByAlbum(albumId) {
  const d = getDB();
  if (!d) return [];
  return d.prepare(`
    SELECT s.*, a.name as album_name, ar.name as artist_name
    FROM songs s
    JOIN albums a ON s.album_id = a.id
    JOIN artists ar ON a.artist_id = ar.id
    WHERE s.album_id = ?
    ORDER BY s.track_id
  `).all(albumId);
}

function getSong(id) {
  const d = getDB();
  if (!d) return null;
  return d.prepare(`
    SELECT s.*, a.name as album_name, a.catalogue, ar.name as artist_name
    FROM songs s
    JOIN albums a ON s.album_id = a.id
    JOIN artists ar ON a.artist_id = ar.id
    WHERE s.id = ?
  `).get(id);
}

function getAllSongs() {
  const d = getDB();
  if (!d) return [];
  return d.prepare(`
    SELECT s.*, a.name as album_name, ar.name as artist_name
    FROM songs s
    JOIN albums a ON s.album_id = a.id
    JOIN artists ar ON a.artist_id = ar.id
    ORDER BY ar.name, a.release_date DESC, s.track_id
  `).all();
}

// ── Products ─────────────────────────────────────────────────────

function getActiveProducts() {
  const d = getDB();
  if (!d) return [];
  return d.prepare('SELECT * FROM products WHERE active = 1 ORDER BY id').all();
}

function getProductByCatalogue(catId) {
  const d = getDB();
  if (!d) return null;
  return d.prepare('SELECT * FROM products WHERE cat_id = ? AND active = 1').get(catId);
}

// ── Liner Notes ──────────────────────────────────────────────────

function getLinerNotes(albumId) {
  const d = getDB();
  if (!d) return [];
  try {
    return d.prepare(`
      SELECT * FROM liner_notes
      WHERE album_id = ?
      ORDER BY sort_order
    `).all(albumId);
  } catch {
    // table might not exist in older flash DBs
    return [];
  }
}

// ── Meta ─────────────────────────────────────────────────────────

function getFlashMeta() {
  const d = getDB();
  if (!d) return null;
  const rows = d.prepare('SELECT * FROM flash_meta').all();
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

function isReady() {
  return getDB() !== null;
}

// ── Export ────────────────────────────────────────────────────────

const flash = {
  // Artists
  getAllArtists,
  getArtist,
  getArtistFull,
  // Albums
  getAllAlbums,
  getAlbumsByArtist,
  getAlbum,
  getAlbumByCatalogue,
  getAlbumFull,
  getAlbumFullByCatalogue,
  // Songs
  getAllSongs,
  getSongsByAlbum,
  getSong,
  // Products
  getActiveProducts,
  getProductByCatalogue,
  // Liner Notes
  getLinerNotes,
  // Meta
  getFlashMeta,
  isReady
};

export default flash;