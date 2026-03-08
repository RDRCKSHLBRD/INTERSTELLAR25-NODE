// ============================================================================
// INTERSTELLAR PACKAGES — SQLite Flash Sync
// scripts/flash-sync.js
//
// Dumps catalogue data (artists, albums, songs, products) from PostgreSQL
// into a local SQLite file for fast, zero-latency reads on the application
// layer. This is the "Flash update APP" from the system diagram.
//
// Usage:
//   node scripts/flash-sync.js              # full sync
//   node scripts/flash-sync.js --verify     # verify existing flash DB
//   node scripts/flash-sync.js --dry-run    # show what would sync, don't write
//
// The output file (data/flash.db) is read-only at runtime.
// Run this script whenever the catalogue changes in Postgres.
// ============================================================================

import { query, testConnection } from '../src/config/database.js';
import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FLASH_DB_PATH = join(__dirname, '..', 'data', 'flash.db');

// ── SQLite Schema ───────────────────────────────────────────────
// Mirrors the Postgres catalogue tables, but read-only and flat.
// No user data, no carts, no purchases, no sessions.
// This is ONLY the public-facing catalogue for browsing.

const SCHEMA = `
  -- Drop existing tables for clean rebuild
  DROP TABLE IF EXISTS products;
  DROP TABLE IF EXISTS songs;
  DROP TABLE IF EXISTS albums;
  DROP TABLE IF EXISTS artists;
  DROP TABLE IF EXISTS flash_meta;

  CREATE TABLE artists (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    created_at  TEXT,
    updated_at  TEXT
  );

  CREATE TABLE albums (
    id              INTEGER PRIMARY KEY,
    catalogue       TEXT UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    cover_url       TEXT,
    production_date TEXT,
    release_date    TEXT,
    artist_id       INTEGER NOT NULL REFERENCES artists(id),
    credit          TEXT,
    description     TEXT,
    tracks          INTEGER DEFAULT 0,
    created_at      TEXT,
    updated_at      TEXT
  );

  CREATE TABLE songs (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    audio_url  TEXT,
    duration   TEXT,
    artist_id  INTEGER NOT NULL REFERENCES artists(id),
    album_id   INTEGER NOT NULL REFERENCES albums(id),
    track_id   INTEGER,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE products (
    id                INTEGER PRIMARY KEY,
    cat_id            TEXT,
    price             REAL,
    name              TEXT,
    catalogue_id      TEXT,
    description       TEXT,
    stripe_product_id TEXT,
    active            INTEGER DEFAULT 1,
    product_type      TEXT DEFAULT 'album',
    song_id           INTEGER,
    created_at        TEXT,
    updated_at        TEXT
  );

  -- Metadata: when was this flash DB built, from what source
  CREATE TABLE flash_meta (
    key   TEXT PRIMARY KEY,
    value TEXT
  );

  -- Indexes for the queries the app actually runs
  CREATE INDEX idx_albums_artist    ON albums(artist_id);
  CREATE INDEX idx_albums_catalogue ON albums(catalogue);
  CREATE INDEX idx_songs_album      ON songs(album_id);
  CREATE INDEX idx_songs_artist     ON songs(artist_id);
  CREATE INDEX idx_products_cat     ON products(cat_id);
  CREATE INDEX idx_products_active  ON products(active);
`;

// ── Sync Functions ──────────────────────────────────────────────

async function syncTable(db, tableName, pgQuery) {
  const result = await query(pgQuery);
  const rows = result.rows;

  if (rows.length === 0) {
    console.log(`  ⚠️  ${tableName}: 0 rows (empty in Postgres)`);
    return 0;
  }

  // Build INSERT from the column names in the first row
  const cols = Object.keys(rows[0]);
  const placeholders = cols.map(() => '?').join(', ');
  const insertSQL = `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders})`;

  const insert = db.prepare(insertSQL);
  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run(...cols.map(c => {
        const val = item[c];
        // SQLite: convert booleans to integers, dates to ISO strings
        if (typeof val === 'boolean') return val ? 1 : 0;
        if (val instanceof Date) return val.toISOString();
        return val;
      }));
    }
  });

  insertMany(rows);
  console.log(`  ✅ ${tableName}: ${rows.length} rows`);
  return rows.length;
}

async function runSync(dryRun = false) {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  INTERSTELLAR — SQLite Flash Sync                      ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  // 1. Test Postgres connection
  console.log('📡 Connecting to PostgreSQL...');
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot connect to PostgreSQL. Check your .env');
    process.exit(1);
  }
  console.log('  ✅ Connected');
  console.log('');

  // 2. Count what we'd sync
  const counts = {};
  for (const table of ['artists', 'albums', 'songs', 'products']) {
    const r = await query(`SELECT COUNT(*) as count FROM ${table}`);
    counts[table] = parseInt(r.rows[0].count);
  }

  console.log('📊 Postgres catalogue:');
  console.log(`  Artists:  ${counts.artists}`);
  console.log(`  Albums:   ${counts.albums}`);
  console.log(`  Songs:    ${counts.songs}`);
  console.log(`  Products: ${counts.products}`);
  console.log('');

  if (dryRun) {
    console.log('🔍 DRY RUN — no changes written');
    console.log(`  Would write to: ${FLASH_DB_PATH}`);
    return;
  }

  // 3. Ensure data directory exists
  const dataDir = dirname(FLASH_DB_PATH);
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
    console.log(`📁 Created ${dataDir}`);
  }

  // 4. Create fresh SQLite DB (overwrites existing)
  console.log(`💾 Writing flash DB → ${FLASH_DB_PATH}`);
  const db = new Database(FLASH_DB_PATH);

  // Performance settings for bulk write
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = OFF');

  // 5. Create schema
  db.exec(SCHEMA);
  console.log('  ✅ Schema created');
  console.log('');

  // 6. Sync each table
  console.log('📥 Syncing catalogue data...');

  await syncTable(db, 'artists',
    'SELECT id, name, description, created_at, updated_at FROM artists ORDER BY id'
  );

  await syncTable(db, 'albums',
    `SELECT id, catalogue, name, cover_url, production_date, release_date,
            artist_id, credit, description, tracks, created_at, updated_at
     FROM albums ORDER BY id`
  );

  await syncTable(db, 'songs',
    `SELECT id, name, audio_url, duration, artist_id, album_id, track_id,
            created_at, updated_at
     FROM songs ORDER BY album_id, track_id`
  );

  await syncTable(db, 'products',
    `SELECT id, cat_id, price, name, catalogue_id, description,
            stripe_product_id, active, product_type, song_id,
            created_at, updated_at
     FROM products ORDER BY id`
  );

  // 7. Write metadata
  const meta = db.prepare('INSERT INTO flash_meta (key, value) VALUES (?, ?)');
  meta.run('synced_at', new Date().toISOString());
  meta.run('source', 'PostgreSQL');
  meta.run('artists_count', String(counts.artists));
  meta.run('albums_count', String(counts.albums));
  meta.run('songs_count', String(counts.songs));
  meta.run('products_count', String(counts.products));

  // 8. Switch to read-optimized settings
  db.pragma('journal_mode = DELETE');
  db.pragma('synchronous = FULL');

  db.close();

  console.log('');
  console.log('✅ Flash sync complete');
  console.log(`   ${FLASH_DB_PATH} ready for application reads`);
}

async function verifyFlash() {
  console.log('🔍 Verifying flash DB...');
  console.log('');

  if (!existsSync(FLASH_DB_PATH)) {
    console.error(`❌ Flash DB not found at ${FLASH_DB_PATH}`);
    console.log('   Run: node scripts/flash-sync.js');
    process.exit(1);
  }

  const db = new Database(FLASH_DB_PATH, { readonly: true });

  // Meta
  const metaRows = db.prepare('SELECT * FROM flash_meta').all();
  console.log('📋 Flash DB metadata:');
  for (const row of metaRows) {
    console.log(`   ${row.key}: ${row.value}`);
  }
  console.log('');

  // Counts
  const tables = ['artists', 'albums', 'songs', 'products'];
  console.log('📊 Row counts:');
  for (const t of tables) {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${t}`).get();
    console.log(`   ${t}: ${count.count}`);
  }
  console.log('');

  // Sample: first 3 albums with song counts
  const albums = db.prepare(`
    SELECT a.id, a.name, a.catalogue, ar.name as artist_name,
           (SELECT COUNT(*) FROM songs s WHERE s.album_id = a.id) as song_count
    FROM albums a
    JOIN artists ar ON a.artist_id = ar.id
    ORDER BY a.id
    LIMIT 5
  `).all();

  console.log('📀 Sample albums:');
  for (const a of albums) {
    console.log(`   [${a.catalogue}] ${a.name} — ${a.artist_name} (${a.song_count} tracks)`);
  }

  db.close();
  console.log('');
  console.log('✅ Flash DB looks good');
}

// ── CLI ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--verify')) {
  verifyFlash();
} else if (args.includes('--dry-run')) {
  runSync(true).then(() => process.exit(0)).catch(err => {
    console.error('❌', err.message);
    process.exit(1);
  });
} else {
  runSync(false).then(() => process.exit(0)).catch(err => {
    console.error('❌', err.message);
    process.exit(1);
  });
}