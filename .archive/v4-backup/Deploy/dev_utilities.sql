-- dev_utilities.sql
-- Helpful queries and utilities for development and debugging

-- ============================================================================
-- QUICK STATS
-- ============================================================================

-- Get overview of all data
CREATE OR REPLACE VIEW v_database_summary AS
SELECT 
    'Artists' AS table_name, 
    COUNT(*) AS record_count,
    'Core data' AS category
FROM artists
UNION ALL
SELECT 
    'Albums' AS table_name, 
    COUNT(*) AS record_count,
    'Core data' AS category
FROM albums
UNION ALL
SELECT 
    'Songs' AS table_name, 
    COUNT(*) AS record_count,
    'Core data' AS category
FROM songs
UNION ALL
SELECT 
    'Products (Albums)' AS table_name, 
    COUNT(*) AS record_count,
    'Commerce' AS category
FROM products WHERE song_id IS NULL AND catalogue_id IS NOT NULL
UNION ALL
SELECT 
    'Products (Songs)' AS table_name, 
    COUNT(*) AS record_count,
    'Commerce' AS category
FROM products WHERE song_id IS NOT NULL
UNION ALL
SELECT 
    'Users' AS table_name, 
    COUNT(*) AS record_count,
    'User data' AS category
FROM users
UNION ALL
SELECT 
    'Purchases' AS table_name, 
    COUNT(*) AS record_count,
    'Commerce' AS category
FROM purchases;

-- ============================================================================
-- ALBUM QUERIES
-- ============================================================================

-- Get complete album info with song count
CREATE OR REPLACE VIEW v_albums_complete AS
SELECT 
    a.id,
    a.catalogue,
    a.name,
    a.release_date,
    a.production_date,
    art.name AS artist_name,
    COUNT(s.id) AS actual_song_count,
    a.tracks AS listed_track_count,
    CASE 
        WHEN COUNT(s.id) = a.tracks THEN 'Complete'
        WHEN COUNT(s.id) < a.tracks THEN 'Missing songs'
        ELSE 'Extra songs'
    END AS status
FROM albums a
LEFT JOIN artists art ON a.artist_id = art.id
LEFT JOIN songs s ON a.id = s.album_id
GROUP BY a.id, a.catalogue, a.name, a.release_date, a.production_date, art.name, a.tracks
ORDER BY a.id;

-- ============================================================================
-- PRODUCT QUERIES
-- ============================================================================

-- Get all products with type classification
CREATE OR REPLACE VIEW v_products_classified AS
SELECT 
    p.id,
    p.cat_id,
    p.name,
    p.price,
    CASE 
        WHEN p.song_id IS NOT NULL THEN 'Song'
        WHEN p.catalogue_id IS NOT NULL AND p.song_id IS NULL THEN 'Album'
        ELSE 'Physical/Other'
    END AS product_type,
    p.catalogue_id,
    p.song_id,
    a.name AS album_name,
    s.name AS song_name,
    p.active,
    p.created_at
FROM products p
LEFT JOIN albums a ON p.catalogue_id = a.catalogue
LEFT JOIN songs s ON p.song_id = s.id
ORDER BY 
    CASE 
        WHEN p.song_id IS NOT NULL THEN 1
        WHEN p.catalogue_id IS NOT NULL THEN 2
        ELSE 3
    END, 
    p.catalogue_id, 
    p.song_id;

-- ============================================================================
-- USEFUL DEVELOPMENT FUNCTIONS
-- ============================================================================

-- Function to reset auto-increment sequences (useful after manual inserts)
CREATE OR REPLACE FUNCTION reset_sequences() 
RETURNS void AS $$
BEGIN
    PERFORM setval('artists_id_seq', COALESCE((SELECT MAX(id) FROM artists), 1));
    PERFORM setval('albums_id_seq', COALESCE((SELECT MAX(id) FROM albums), 1));
    PERFORM setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
    PERFORM setval('playlists_id_seq', COALESCE((SELECT MAX(id) FROM playlists), 1));
    PERFORM setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1));
    PERFORM setval('carts_id_seq', COALESCE((SELECT MAX(id) FROM carts), 1));
    PERFORM setval('purchases_id_seq', COALESCE((SELECT MAX(id) FROM purchases), 1));
    
    RAISE NOTICE 'All sequences have been reset to current max values.';
END;
$$ LANGUAGE plpgsql;

-- Function to get album statistics
CREATE OR REPLACE FUNCTION get_album_stats(album_catalogue VARCHAR(50))
RETURNS TABLE(
    album_name VARCHAR(255),
    total_songs INTEGER,
    total_duration INTERVAL,
    avg_song_length INTERVAL,
    album_product_price DECIMAL(10,2),
    total_song_products_value DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.name::VARCHAR(255),
        COUNT(s.id)::INTEGER,
        INTERVAL '0 minutes' + SUM(
            CASE 
                WHEN s.duration ~ '^\d+:\d+$' THEN 
                    (split_part(s.duration, ':', 1)::INTEGER * 60 + 
                     split_part(s.duration, ':', 2)::INTEGER) * INTERVAL '1 second'
                ELSE INTERVAL '0 seconds'
            END
        ),
        CASE 
            WHEN COUNT(s.id) > 0 THEN
                (INTERVAL '0 minutes' + SUM(
                    CASE 
                        WHEN s.duration ~ '^\d+:\d+$' THEN 
                            (split_part(s.duration, ':', 1)::INTEGER * 60 + 
                             split_part(s.duration, ':', 2)::INTEGER) * INTERVAL '1 second'
                        ELSE INTERVAL '0 seconds'
                    END
                )) / COUNT(s.id)
            ELSE INTERVAL '0 seconds'
        END,
        p_album.price,
        (COUNT(s.id) * 1.29)::DECIMAL(10,2)
    FROM albums a
    LEFT JOIN songs s ON a.id = s.album_id
    LEFT JOIN products p_album ON a.catalogue = p_album.catalogue_id AND p_album.song_id IS NULL
    WHERE a.catalogue = album_catalogue
    GROUP BY a.name, a.catalogue, p_album.price;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- QUICK CLEANUP FUNCTIONS
-- ============================================================================

-- Function to clean up test data (preserves core music data)
CREATE OR REPLACE FUNCTION cleanup_test_data()
RETURNS void AS $$
BEGIN
    DELETE FROM guest_downloads;
    DELETE FROM purchase_items;
    DELETE FROM purchases;
    DELETE FROM cart_items;
    DELETE FROM carts;
    DELETE FROM user_sessions;
    DELETE FROM playlist_songs;
    DELETE FROM playlists;
    DELETE FROM users;
    
    -- Reset sequences
    PERFORM reset_sequences();
    
    RAISE NOTICE 'Test data cleaned up. Core music data preserved.';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE QUERIES FOR TESTING
-- ============================================================================

-- Sample query: Get all songs from a specific album
/*
SELECT s.track_id, s.name, s.duration 
FROM songs s 
JOIN albums a ON s.album_id = a.id 
WHERE a.catalogue = '01040105' 
ORDER BY s.track_id;
*/

-- Sample query: Get product pricing for an album
/*
SELECT 
    'Album' AS type, 
    p.name, 
    p.price 
FROM products p 
WHERE p.catalogue_id = '01040105' AND p.song_id IS NULL

UNION ALL

SELECT 
    'Song' AS type, 
    p.name, 
    p.price 
FROM products p 
WHERE p.catalogue_id = '01040105' AND p.song_id IS NOT NULL
ORDER BY type, name;
*/

-- Sample query: Find Robot's Dream and related products
/*
SELECT 
    s.id AS song_id,
    s.name AS song_name,
    a.name AS album_name,
    p.price AS song_price,
    p_album.price AS album_price
FROM songs s
JOIN albums a ON s.album_id = a.id
LEFT JOIN products p ON s.id = p.song_id
LEFT JOIN products p_album ON a.catalogue = p_album.catalogue_id AND p_album.song_id IS NULL
WHERE s.name ILIKE '%robot%dream%';
*/

SELECT 'Development utilities loaded successfully!' AS status;