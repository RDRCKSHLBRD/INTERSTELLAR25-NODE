/* 003_song_products.sql – song-level products • 2025-06-09 */

BEGIN;

-- 1 ▸ Add song_id column (safe if it’s already there)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS song_id VARCHAR(10);

-- 2 ▸ Add FK only once
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'products_song_id_fkey'
       AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_song_id_fkey
      FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3 ▸ Unique index for safety
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_song_id
  ON products(song_id)
  WHERE song_id IS NOT NULL;

-- 4 ▸ Insert one product per song (price hard-coded at 1.29)
INSERT INTO products
        (cat_id, price, name, catalogue_id, description, song_id)
SELECT  s.id,               -- cat_id = song code “0203”
        1.29   AS price,    -- <-- adjust if you want a different default
        s.name,
        a.catalogue,
        'Digital download of ' || s.name,
        s.id
FROM    songs   s
JOIN    albums  a ON a.id = s.album_id
LEFT    JOIN products p ON p.song_id = s.id
WHERE   p.id IS NULL;       -- only if missing

COMMIT;
