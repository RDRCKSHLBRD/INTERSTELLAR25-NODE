-- seed_artists.sql
-- Seed data for artists table

INSERT INTO artists (id, name, description) VALUES 
(1, 'Roderick Shoolbraid', 'Electronic Ambient Musician')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- Success message
SELECT 'Artists seeded successfully!' AS status;