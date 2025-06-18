-- migrations/databaseSetup.sql
-- Complete database setup file (Render-ready)

------------------------------------------------------------
-- Step 1  ▸  Core schema
------------------------------------------------------------
\i migrations/001_initial_schema.sql

------------------------------------------------------------
-- Step 2  ▸  Seed reference data
------------------------------------------------------------
\i migrations/artists.sql
\i migrations/albums.sql

------------------------------------------------------------
-- Step 3  ▸  Seed songs (three parts)
------------------------------------------------------------
\i migrations/songs.sql
\i migrations/songs_part2.sql
\i migrations/songs_part3.sql

------------------------------------------------------------
-- Step 4  ▸  Seed album-level products
------------------------------------------------------------
\i migrations/products.sql         -- (24 album products)

------------------------------------------------------------
-- Step 5  ▸  Extend schema for song products
------------------------------------------------------------

-- 5A. Add song_id column + FK (safe if re-run)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS song_id VARCHAR(10);

ALTER TABLE products
  ADD CONSTRAINT IF NOT EXISTS products_song_id_fkey
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE;

-- 5B. Prevent duplicate song products
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_song_id
  ON products(song_id)
  WHERE song_id IS NOT NULL;

-- 5C. Insert one product per song (skip if present)
INSERT INTO products
        (cat_id, price, name, catalogue_id, description, song_id)
SELECT  s.id,
        1.29,                          -- default track price
        s.name,
        a.catalogue,
        'Digital download of ' || s.name,
        s.id
FROM    songs   s
JOIN    albums  a ON a.id = s.album_id
LEFT    JOIN products p ON p.song_id = s.id
WHERE   p.id IS NULL;


------------------------------------------------------------
-- Step 6  ▸  Verification queries
------------------------------------------------------------
SELECT 'Database setup complete!'  AS status;

SELECT COUNT(*) AS artist_count   FROM artists;
SELECT COUNT(*) AS album_count    FROM albums;
SELECT COUNT(*) AS song_count     FROM songs;
SELECT COUNT(*) AS product_count  FROM products;

-- Sample verification – first album
SELECT 
    a.name              AS album_name,
    COUNT(s.id)         AS song_count,
    p.price             AS album_price
FROM albums a
LEFT JOIN songs    s ON a.id = s.album_id
LEFT JOIN products p ON a.catalogue = p.catalogue_id
WHERE a.id = 1
GROUP BY a.name, p.price;

-- Check for missing “Robot's Dream” track (album 15)
SELECT 
    id, name, album_id, track_id 
FROM songs 
WHERE album_id = 15 
ORDER BY track_id;

SELECT 'Setup verification complete!' AS status;




------------------------------------------------------------
-- Step 7  ▸  Add purchase metadata (email, name, metadata)
------------------------------------------------------------
\i migrations/004_add_purchase_metadata.sql
