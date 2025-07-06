-- setupEXT_database.sql
-- Master database setup file for Interstellar Packages (External execution)
-- Execute this file from the project root to create complete database with all data on a remote server

BEGIN;

-- ============================================================================
-- STEP 1: CREATE SCHEMA
-- ============================================================================

\echo 'Creating database schema...'
\i Deploy/schema.sql  -- ADDED 'Deploy/' prefix

-- ============================================================================
-- STEP 2: SEED REFERENCE DATA
-- ============================================================================

\echo 'Seeding artists...'
\i Deploy/seed_artists.sql -- ADDED 'Deploy/' prefix

\echo 'Seeding albums...'
\i Deploy/seed_albums.sql -- ADDED 'Deploy/' prefix

\echo 'Seeding songs...'
\i Deploy/seed_songs.sql -- ADDED 'Deploy/' prefix

\echo 'Seeding products...'
\i Deploy/seed_products.sql -- ADDED 'Deploy/' prefix

-- ============================================================================
-- STEP 3: VERIFICATION
-- ============================================================================

\echo 'Verifying database setup...'

SELECT 'Database Summary:' AS info;
SELECT
    'Artists' AS table_name,
    COUNT(*) AS record_count
FROM artists
UNION ALL
SELECT
    'Albums' AS table_name,
    COUNT(*) AS record_count
FROM albums
UNION ALL
SELECT
    'Songs' AS table_name,
    COUNT(*) AS record_count
FROM songs
UNION ALL
SELECT
    'Products' AS table_name,
    COUNT(*) AS record_count
FROM products;

-- Sample verification - check first album
\echo 'Sample verification - Charlotta album:'
SELECT
    a.name              AS album_name,
    COUNT(s.id)         AS song_count,
    p.price             AS album_price
FROM albums a
LEFT JOIN songs    s ON a.id = s.album_id
LEFT JOIN products p ON a.catalogue = p.catalogue_id AND p.song_id IS NULL
WHERE a.id = 1
GROUP BY a.name, p.price;

-- Check for Robot's Dream track (album 15, track 5)
\echo 'Checking for Robot''s Dream track:'
SELECT
    s.id,
    s.name,
    a.name AS album_name,
    s.track_id
FROM songs s
JOIN albums a ON s.album_id = a.id
WHERE s.id = '1505';

-- Count products by type
\echo 'Product breakdown:'
SELECT
    CASE
        WHEN song_id IS NOT NULL THEN 'Individual Songs'
        WHEN catalogue_id IS NOT NULL THEN 'Albums'
        ELSE 'Other Products'
    END AS product_type,
    COUNT(*) AS count
FROM products
GROUP BY
    CASE
        WHEN song_id IS NOT NULL THEN 'Individual Songs'
        WHEN catalogue_id IS NOT NULL THEN 'Albums'
        ELSE 'Other Products'
    END;

COMMIT;

SELECT 'Database setup completed successfully!' AS status;
SELECT 'Total setup time: ' || EXTRACT(EPOCH FROM (clock_timestamp() - statement_timestamp())) || ' seconds' AS timing;