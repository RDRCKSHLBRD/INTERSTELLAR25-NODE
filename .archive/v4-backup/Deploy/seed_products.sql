-- seed_products.sql
-- Seed data for products table (albums + individual songs + physical items)

-- Album products (24 digital albums)
INSERT INTO products (cat_id, price, name, catalogue_id, description, active) VALUES 
('00040101', 12.00, 'Charlotta', '00040101', 'Digital download of Charlotta', true),
('00040102', 12.00, 'Objects & Particles', '00040102', 'Digital download of Objects & Particles', true),
('00040103', 12.00, 'Glass City of Us', '00040103', 'Digital download of Glass City of Us', true),
('00040104', 12.00, 'New Domes of Earth', '00040104', 'Digital download of New Domes of Earth', true),
('01040105', 12.00, 'Natura', '01040105', 'Digital download of Natura', true),
('01040106', 12.00, 'Outer Corners', '01040106', 'Digital download of Outer Corners', true),
('01040107', 12.00, 'Nonagon', '01040107', 'Digital download of Nonagon', true),
('01040108', 12.00, 'Ambient Garden One', '01040108', 'Digital download of Ambient Garden One', true),
('01040109', 12.00, 'Music for Seven Structures', '01040109', 'Digital download of Music for Seven Structures', true),
('01040110', 12.00, 'Inner Moments of Light', '01040110', 'Digital download of Inner Moments of Light', true),
('01040111', 12.00, 'Nocturnes & Reveries', '01040111', 'Digital download of Nocturnes & Reveries', true),
('01040112', 12.00, 'Prefabrication', '01040112', 'Digital download of Prefabrication', true),
('01040113', 12.00, 'Vagary', '01040113', 'Digital download of Vagary', true),
('01040114', 12.00, 'Amsterdam Concreet', '01040114', 'Digital download of Amsterdam Concreet', true),
('01040115', 12.00, 'Watercolours for Friends', '01040115', 'Digital download of Watercolours for Friends', true),
('01040116', 12.00, 'Postcards from Old Sounds', '01040116', 'Digital download of Postcards from Old Sounds', true),
('01040117', 12.00, 'Sakura', '01040117', 'Digital download of Sakura', true),
('01040118', 12.00, 'Poem for a Homeworld', '01040118', 'Digital download of Poem for a Homeworld', true),
('01040119', 12.00, 'Rhombus', '01040119', 'Digital download of Rhombus', true),
('01040120', 12.00, 'Vignettes of Clouds', '01040120', 'Digital download of Vignettes of Clouds', true),
('01040121', 12.00, 'JIKAN | Original Soundtrack', '01040121', 'Digital download of JIKAN | Original Soundtrack', true),
('01040122', 12.00, 'Apocrypha', '01040122', 'Digital download of Apocrypha', true),
('01040123', 12.00, 'Ambient Garden Two', '01040123', 'Digital download of Ambient Garden Two', true),
('01040124', 12.00, 'Utopian', '01040124', 'Digital download of Utopian', true),

-- Physical Products  
('01020105', 25.00, 'Natura (Cassette)', '01040105', 'Physical cassette tape of Natura album', true);

-- Generate individual song products (1.29 each)
-- This will create a product for every song in the database
INSERT INTO products (cat_id, price, name, catalogue_id, description, song_id)
SELECT  
    s.id,                                          -- cat_id = song code "0203"
    1.29   AS price,                              -- default track price
    s.name,
    a.catalogue,
    'Digital download of ' || s.name,
    s.id
FROM    songs   s
JOIN    albums  a ON a.id = s.album_id
WHERE   NOT EXISTS (
    SELECT 1 FROM products p WHERE p.song_id = s.id
);

-- Success message
SELECT 'Products seeded successfully!' AS status;