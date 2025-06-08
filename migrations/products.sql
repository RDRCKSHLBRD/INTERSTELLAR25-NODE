-- migrations/products.sql
-- Insert all products data (album products)

INSERT INTO products (cat_id, price, name, catalogue_id, description, stripe_product_id, active) VALUES 
('00040101', 12.00, 'Charlotta', '00040101', 'Digital download of Charlotta', 'https://buy.stripe.com/aEUdRWfih6hz0QU6oo', true),
('00040102', 12.00, 'Objects & Particles', '00040102', 'Digital download of Objects & Particles', 'https://buy.stripe.com/5kA016gml49r7fibIJ', true),
('00040103', 12.00, 'Glass City of Us', '00040103', 'Digital download of Glass City of Us', 'https://buy.stripe.com/28o016da90XfgPS5km', true),
('00040104', 12.00, 'New Domes of Earth', '00040104', 'Digital download of New Domes of Earth', 'https://buy.stripe.com/5kAdRW5HH9tLfLO7sv', true),
('01040105', 12.00, 'Natura', '01040105', 'Digital download of Natura', 'https://buy.stripe.com/example_Album5', true),
('01040106', 12.00, 'Outer Corners', '01040106', 'Digital download of Outer Corners', 'https://buy.stripe.com/example_Album6', true),
('01040107', 12.00, 'Nonagon', '01040107', 'Digital download of Nonagon', 'https://buy.stripe.com/example_Album7', true),
('01040108', 12.00, 'Ambient Garden One', '01040108', 'Digital download of Ambient Garden One', 'https://buy.stripe.com/example_Album8', true),
('01040109', 12.00, 'Music for Seven Structures', '01040109', 'Digital download of Music for Seven Structures', 'https://buy.stripe.com/example_Album9', true),
('01040110', 12.00, 'Inner Moments of Light', '01040110', 'Digital download of Inner Moments of Light', 'https://buy.stripe.com/example_Album10', true),
('01040111', 12.00, 'Nocturnes & Reveries', '01040111', 'Digital download of Nocturnes & Reveries', 'https://buy.stripe.com/example_Album11', true),
('01040112', 12.00, 'Prefabrication', '01040112', 'Digital download of Prefabrication', 'https://buy.stripe.com/example_Album12', true),
('01040113', 12.00, 'Vagary', '01040113', 'Digital download of Vagary', 'https://buy.stripe.com/example_Album13', true),
('01040114', 12.00, 'Amsterdam Concreet', '01040114', 'Digital download of Amsterdam Concreet', 'https://buy.stripe.com/example_Album14', true),
('01040115', 12.00, 'Watercolours for Friends', '01040115', 'Digital download of Watercolours for Friends', 'https://buy.stripe.com/example_Album15', true),
('01040116', 12.00, 'Postcards from Old Sounds', '01040116', 'Digital download of Postcards from Old Sounds', 'https://buy.stripe.com/example_Album16', true),
('01040117', 12.00, 'Sakura', '01040117', 'Digital download of Sakura', 'https://buy.stripe.com/example_Album17', true),
('01040118', 12.00, 'Poem for a Homeworld', '01040118', 'Digital download of Poem for a Homeworld', 'https://buy.stripe.com/example_Album18', true),
('01040119', 12.00, 'Rhombus', '01040119', 'Digital download of Rhombus', 'https://buy.stripe.com/example_Album19', true),
('01040120', 12.00, 'Vignettes of Clouds', '01040120', 'Digital download of Vignettes of Clouds', 'https://buy.stripe.com/example_Album20', true),
('01040121', 12.00, 'JIKAN | Original Soundtrack', '01040121', 'Digital download of JIKAN | Original Soundtrack', 'https://buy.stripe.com/example_Album21', true),
('01040122', 12.00, 'Apocrypha', '01040122', 'Digital download of Apocrypha', 'https://buy.stripe.com/example_Album22', true),
('01040123', 12.00, 'Ambient Garden Two', '01040123', 'Digital download of Ambient Garden Two', 'https://buy.stripe.com/example_Album23', true),
('01040124', 12.00, 'Utopian', '01040124', 'Digital download of Utopian', 'https://buy.stripe.com/example_Album24', true)
ON CONFLICT (cat_id) DO UPDATE SET
  price = EXCLUDED.price,
  name = EXCLUDED.name,
  catalogue_id = EXCLUDED.catalogue_id,
  description = EXCLUDED.description,
  stripe_product_id = EXCLUDED.stripe_product_id,
  active = EXCLUDED.active,
  updated_at = CURRENT_TIMESTAMP;