-- migrations/databaseSetup.sql
-- Complete database setup file that runs everything in the right order
-- This file can be used for Render deployment or manual setup

-- Step 1: Create the schema
\i migrations/001_initial_schema.sql

-- Step 2: Insert artists
\i migrations/artists.sql

-- Step 3: Insert albums
\i migrations/albums.sql

-- Step 4: Insert songs (all parts)
\i migrations/songs.sql
\i migrations/songs_part2.sql
\i migrations/songs_part3.sql

-- Step 5: Insert products
\i migrations/products.sql

-- Step 6: Verification queries
SELECT 'Database setup complete!' as status;
SELECT COUNT(*) as artist_count FROM artists;
SELECT COUNT(*) as album_count FROM albums;
SELECT COUNT(*) as song_count FROM songs;
SELECT COUNT(*) as product_count FROM products;

-- Sample verification - check first album
SELECT 
    a.name as album_name,
    COUNT(s.id) as song_count,
    p.price as album_price
FROM albums a
LEFT JOIN songs s ON a.id = s.album_id
LEFT JOIN products p ON a.catalogue = p.catalogue_id
WHERE a.id = 1
GROUP BY a.name, p.price;

-- Check for missing Robot's Dream
SELECT 
    id, name, album_id, track_id 
FROM songs 
WHERE album_id = 15 
ORDER BY track_id;

SELECT 'Setup verification complete!' as status;