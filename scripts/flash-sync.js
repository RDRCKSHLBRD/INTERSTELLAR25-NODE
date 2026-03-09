// ============================================================================
// INTERSTELLAR PACKAGES — SQLite Flash Sync  (V5)
// scripts/flash-sync.js
//
// Dumps catalogue data from PostgreSQL into a local SQLite file for
// fast, zero-latency reads on the application layer.
//
// V5 additions:
//   - palette (JSONB → TEXT) per album for CSS custom properties
//   - layout_type per album (compact | standard | essay)
//   - liner_notes table for extended per-track/per-album essays
//
// Usage:
//   node scripts/flash-sync.js              # full sync
//   node scripts/flash-sync.js --verify     # verify existing flash DB
//   node scripts/flash-sync.js --dry-run    # preview, don't write
//   node scripts/flash-sync.js --counts     # just show Postgres counts
//
// Output: data/flash.db (read-only at runtime)
// Run manually whenever the catalogue changes in Postgres.
// ============================================================================

import { query, testConnection } from '../src/config/database.js';
import Database from 'better-sqlite3';
import { mkdirSync, existsSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FLASH_DB_PATH = join(__dirname, '..', 'data', 'flash.db');

// ── SQLite Schema ───────────────────────────────────────────────
// Mirrors Postgres catalogue tables. Read-only, no user/transaction data.

const SCHEMA = `
  DROP TABLE IF EXISTS liner_notes;
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
    palette         TEXT,
    layout_type     TEXT DEFAULT 'standard',
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
    stripe_price_id   TEXT,
    active            INTEGER DEFAULT 1,
    song_id           TEXT,
    created_at        TEXT,
    updated_at        TEXT
  );

  CREATE TABLE liner_notes (
    id          INTEGER PRIMARY KEY,
    album_id    INTEGER NOT NULL REFERENCES albums(id),
    section     TEXT NOT NULL,
    source      TEXT,
    body        TEXT NOT NULL,
    sort_order  INTEGER DEFAULT 0,
    created_at  TEXT,
    updated_at  TEXT
  );

  CREATE TABLE flash_meta (
    key   TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE INDEX idx_albums_artist     ON albums(artist_id);
  CREATE INDEX idx_albums_catalogue  ON albums(catalogue);
  CREATE INDEX idx_albums_layout     ON albums(layout_type);
  CREATE INDEX idx_songs_album       ON songs(album_id);
  CREATE INDEX idx_songs_artist      ON songs(artist_id);
  CREATE INDEX idx_products_cat      ON products(cat_id);
  CREATE INDEX idx_products_active   ON products(active);
  CREATE INDEX idx_liner_notes_album ON liner_notes(album_id);
  CREATE INDEX idx_liner_notes_sort  ON liner_notes(album_id, sort_order);
`;

// ── Table sync queries ──────────────────────────────────────────
// Each: [tableName, v5Query, fallbackQuery]
// fallbackQuery used when V5 migration hasn't run yet

const SYNC_TABLES = [
  ['artists',
    'SELECT id, name, description, created_at, updated_at FROM artists ORDER BY id',
    null],

  ['albums',
    `SELECT id, catalogue, name, cover_url, production_date, release_date,
            artist_id, credit, description, tracks,
            palette::text as palette, layout_type,
            created_at, updated_at
     FROM albums ORDER BY id`,
    `SELECT id, catalogue, name, cover_url, production_date, release_date,
            artist_id, credit, description, tracks,
            NULL as palette, 'standard' as layout_type,
            created_at, updated_at
     FROM albums ORDER BY id`],

  ['songs',
    `SELECT id, name, audio_url, duration, artist_id, album_id, track_id,
            created_at, updated_at
     FROM songs ORDER BY album_id, track_id`,
    null],

  ['products',
    `SELECT id, cat_id, price, name, catalogue_id, description,
            stripe_product_id, stripe_price_id, active, song_id,
            created_at, updated_at
     FROM products ORDER BY id`,
    null],

  ['liner_notes',
    `SELECT id, album_id, section, source, body, sort_order,
            created_at, updated_at
     FROM liner_notes ORDER BY album_id, sort_order`,
    null],
];

// ── Sync Functions ──────────────────────────────────────────────

async function syncTable(db, tableName, pgQuery) {
  let result;
  try {
    result = await query(pgQuery);
  } catch (err) {
    if (err.message.includes('does not exist') || err.message.includes('column')) {
      console.log(`  ⚠️  ${tableName}: skipped (table/column not in Postgres yet)`);
      return 0;
    }
    throw err;
  }

  const rows = result.rows;

  if (rows.length === 0) {
    console.log(`  ── ${tableName}: 0 rows`);
    return 0;
  }

  const cols = Object.keys(rows[0]);
  const placeholders = cols.map(() => '?').join(', ');
  const insertSQL = `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders})`;

  const insert = db.prepare(insertSQL);
  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run(...cols.map(c => {
        const val = item[c];
        if (val === null || val === undefined) return null;
        if (typeof val === 'boolean') return val ? 1 : 0;
        if (val instanceof Date) return val.toISOString();
        if (typeof val === 'object') return JSON.stringify(val);
        return val;
      }));
    }
  });

  insertMany(rows);
  console.log(`  ✅ ${tableName}: ${rows.length} rows`);
  return rows.length;
}

async function checkV5Schema() {
  try {
    await query('SELECT palette, layout_type FROM albums LIMIT 1');
    return true;
  } catch {
    return false;
  }
}

async function getTableCounts() {
  const counts = {};
  const tables = ['artists', 'albums', 'songs', 'products', 'liner_notes'];

  for (const table of tables) {
    try {
      const r = await query(`SELECT COUNT(*) as count FROM ${table}`);
      counts[table] = parseInt(r.rows[0].count);
    } catch {
      counts[table] = null;
    }
  }
  return counts;
}

// ── Main sync ───────────────────────────────────────────────────

async function runSync(dryRun = false) {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  INTERSTELLAR — SQLite Flash Sync  V5                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  // 1. Connect
  console.log('📡 Connecting to PostgreSQL...');
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot connect to PostgreSQL. Is Cloud SQL proxy running?');
    process.exit(1);
  }
  console.log('  ✅ Connected');
  console.log('');

  // 2. Report Postgres state
  const counts = await getTableCounts();
  const hasV5 = await checkV5Schema();

  console.log('📊 Postgres catalogue:');
  for (const [table, count] of Object.entries(counts)) {
    const val = count === null ? '(missing)' : count;
    console.log(`   ${table.padEnd(14)} ${val}`);
  }
  console.log('');
  console.log(`   V5 schema:    ${hasV5 ? '✅ present' : '⚠️  not yet — run migration 009'}`);
  console.log('');

  if (dryRun) {
    console.log('🔍 DRY RUN — no changes written');
    console.log(`   Would write to: ${FLASH_DB_PATH}`);
    return;
  }

  // 3. Ensure data directory
  const dataDir = dirname(FLASH_DB_PATH);
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
    console.log(`📁 Created ${dataDir}`);
  }

  // 4. Create fresh SQLite
  console.log(`💾 Writing → ${FLASH_DB_PATH}`);
  const db = new Database(FLASH_DB_PATH);

  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = OFF');

  db.exec(SCHEMA);
  console.log('   Schema created');
  console.log('');

  // 5. Sync tables
  console.log('📥 Syncing...');

  let totalRows = 0;
  for (const [tableName, v5Query, fallbackQuery] of SYNC_TABLES) {
    const q = hasV5 ? v5Query : (fallbackQuery || v5Query);
    totalRows += await syncTable(db, tableName, q);
  }

  console.log('');
  console.log(`   Total: ${totalRows} rows`);
  console.log('');

  // 6. Metadata
  const meta = db.prepare('INSERT INTO flash_meta (key, value) VALUES (?, ?)');
  meta.run('synced_at', new Date().toISOString());
  meta.run('source', 'PostgreSQL');
  meta.run('v5_schema', hasV5 ? 'true' : 'false');
  for (const [table, count] of Object.entries(counts)) {
    if (count !== null) {
      meta.run(`${table}_count`, String(count));
    }
  }

  // 7. Optimize
  db.pragma('journal_mode = DELETE');
  db.pragma('synchronous = FULL');
  db.close();

  const kb = (statSync(FLASH_DB_PATH).size / 1024).toFixed(1);

  console.log('✅ Flash sync complete');
  console.log(`   ${FLASH_DB_PATH} (${kb} KB)`);
}

// ── Verify ──────────────────────────────────────────────────────

async function verifyFlash() {
  console.log('🔍 Verifying flash DB...');
  console.log('');

  if (!existsSync(FLASH_DB_PATH)) {
    console.error(`❌ Not found: ${FLASH_DB_PATH}`);
    console.log('   Run: node scripts/flash-sync.js');
    process.exit(1);
  }

  const kb = (statSync(FLASH_DB_PATH).size / 1024).toFixed(1);
  console.log(`📁 ${FLASH_DB_PATH} (${kb} KB)`);
  console.log('');

  const db = new Database(FLASH_DB_PATH, { readonly: true });

  // Meta
  const metaRows = db.prepare('SELECT * FROM flash_meta').all();
  console.log('📋 Metadata:');
  for (const row of metaRows) {
    console.log(`   ${row.key}: ${row.value}`);
  }
  console.log('');

  // Counts
  const tables = ['artists', 'albums', 'songs', 'products', 'liner_notes'];
  console.log('📊 Row counts:');
  for (const t of tables) {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${t}`).get();
      console.log(`   ${t.padEnd(14)} ${count.count}`);
    } catch {
      console.log(`   ${t.padEnd(14)} (missing)`);
    }
  }
  console.log('');

  // Albums detail
  const albums = db.prepare(`
    SELECT a.id, a.name, a.catalogue, a.layout_type, a.palette,
           ar.name as artist_name,
           (SELECT COUNT(*) FROM songs s WHERE s.album_id = a.id) as song_count
    FROM albums a
    JOIN artists ar ON a.artist_id = ar.id
    ORDER BY a.id
  `).all();

  console.log(`📀 Albums (${albums.length}):`);
  for (const a of albums) {
    const pal = a.palette ? '🎨' : '  ';
    const layout = (a.layout_type || 'standard').padEnd(8);
    console.log(`   ${pal} [${a.catalogue}] ${a.name} — ${layout} — ${a.song_count} trk`);
  }
  console.log('');

  // Liner notes
  try {
    const noteCount = db.prepare('SELECT COUNT(*) as count FROM liner_notes').get();
    if (noteCount.count > 0) {
      const noteSummary = db.prepare(`
        SELECT ln.album_id, a.name as album_name, COUNT(*) as sections
        FROM liner_notes ln
        JOIN albums a ON ln.album_id = a.id
        GROUP BY ln.album_id
      `).all();
      console.log(`📝 Liner notes (${noteCount.count} sections):`);
      for (const n of noteSummary) {
        console.log(`   ${n.album_name}: ${n.sections} sections`);
      }
    } else {
      console.log('📝 Liner notes: empty');
    }
  } catch {
    console.log('📝 Liner notes: table missing');
  }

  db.close();
  console.log('');
  console.log('✅ Verified');
}

// ── Counts only ─────────────────────────────────────────────────

async function showCounts() {
  console.log('📡 Connecting...');
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot connect');
    process.exit(1);
  }

  const counts = await getTableCounts();
  const hasV5 = await checkV5Schema();

  console.log('');
  console.log('📊 Postgres:');
  for (const [table, count] of Object.entries(counts)) {
    const val = count === null ? '(missing)' : count;
    console.log(`   ${table.padEnd(14)} ${val}`);
  }
  console.log(`   V5 schema:    ${hasV5 ? '✅' : '⚠️  missing'}`);
}

// ── CLI ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--verify')) {
  verifyFlash();
} else if (args.includes('--counts')) {
  showCounts().then(() => process.exit(0)).catch(err => {
    console.error('❌', err.message);
    process.exit(1);
  });
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