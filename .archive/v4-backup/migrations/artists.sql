-- migrations/artists.sql
-- Insert all artists data

INSERT INTO artists (id, name, description) VALUES 
(1, 'Roderick Shoolbraid', 'Electronic Ambient Musician')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;