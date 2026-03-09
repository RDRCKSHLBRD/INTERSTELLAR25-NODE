-- ============================================================================
-- Migration 009: Album Palette + Liner Notes
-- INTERSTELLAR PACKAGES V5
--
-- Adds per-album colour palette (JSONB) to albums table
-- Creates liner_notes table for extended per-track/per-album essay content
-- These power the V5 artist grid (palette → CSS custom properties)
-- and the liner notes EJS template (extended text content)
-- ============================================================================

-- 1. Add palette column to albums
--    Stores per-album colour scheme extracted from Illustrator SVGs
--    Schema: { "bg": "#620b1f", "text": "#ffc0d7", "accent": "#e2547c",
--              "catalogue": "#93163c", "trackTitle": "#fe264f" }
ALTER TABLE albums ADD COLUMN IF NOT EXISTS palette JSONB DEFAULT '{}';

-- 2. Add layout_type to albums
--    Controls which template mode renders the liner notes
--    'compact'  = narrow, short description (Amsterdam Concert)
--    'standard' = art left, single panel right (Charlotta)
--    'essay'    = wide scroll, per-track/per-album essays (Apocrypha, Ambient Gardens)
ALTER TABLE albums ADD COLUMN IF NOT EXISTS layout_type TEXT DEFAULT 'standard';

-- 3. Liner notes table — extended text content per album
--    For 'standard' albums: one row with section='description'
--    For 'essay' albums: one row per track/section with ordering
CREATE TABLE IF NOT EXISTS liner_notes (
  id          SERIAL PRIMARY KEY,
  album_id    INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  section     TEXT NOT NULL,           -- 'description', track name, or section title
  source      TEXT,                    -- e.g. 'Stars // Outer Corners' (track // source album)
  body        TEXT NOT NULL,           -- the actual essay/description text
  sort_order  INTEGER DEFAULT 0,       -- display ordering within the album
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_liner_notes_album ON liner_notes(album_id);
CREATE INDEX IF NOT EXISTS idx_liner_notes_sort  ON liner_notes(album_id, sort_order);

-- 4. Seed palette data from SVG extraction
--    (Only for the 5 albums we've analysed so far — more will come)

-- Charlotta (album 1, catalogue 00040101)
UPDATE albums SET
  palette = '{"bg":"#620b1f","text":"#ffc0d7","accent":"#e2547c","catalogue":"#93163c","trackTitle":"#fe264f"}',
  layout_type = 'standard'
WHERE catalogue = '00040101';

-- Amsterdam Concert (album 14, catalogue 01040114)
UPDATE albums SET
  palette = '{"bg":"#0077d1","text":"#aed1fa","accent":"#00bea0","catalogue":"#00a9c8","trackTitle":"#94ffff"}',
  layout_type = 'compact'
WHERE catalogue = '01040114';

-- Apocrypha (album 22, catalogue 01040122)
UPDATE albums SET
  palette = '{"bg":"#303536","text":"#c5cfdb","accent":"#89abc8","catalogue":"#5f7786","trackTitle":"#b8b29c"}',
  layout_type = 'essay'
WHERE catalogue = '01040122';

-- Ambient Garden One (album 8, catalogue 01040108)
UPDATE albums SET
  palette = '{"bg":"#082233","text":"#9cd1ef","accent":"#98bbcf","catalogue":"#2f5681","trackTitle":"#cbdff4"}',
  layout_type = 'essay'
WHERE catalogue = '01040108';

-- Ambient Garden Two (album 23, catalogue 01040123)
UPDATE albums SET
  palette = '{"bg":"#082430","text":"#cfeaf8","accent":"#48bacd","catalogue":"#006374","trackTitle":"#7fe8da"}',
  layout_type = 'essay'
WHERE catalogue = '01040123';