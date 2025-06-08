-- migrations/songs.sql (Part 1 of 3)
-- Insert all songs data - Albums 1-8

INSERT INTO songs (id, name, audio_url, duration, artist_id, album_id, track_id) VALUES 
-- Album 1: Charlotta
('0101', 'Charlotta', 'https://storage.googleapis.com/ip-public-bucket1/Charlotta/CHARLOTTA.mp3', '08:28', 1, 1, 1),
('0102', 'Garden Mix', 'https://storage.googleapis.com/ip-public-bucket1/Charlotta/GARDEN-MIX.mp3', '03:28', 1, 1, 2),
('0103', 'New Ornithologies', 'https://storage.googleapis.com/ip-public-bucket1/Charlotta/NEW-ORNITHOLOGIES.mp3', '03:51', 1, 1, 3),
('0104', 'Old Flowers', 'https://storage.googleapis.com/ip-public-bucket1/Charlotta/OLD-FLOWERS.mp3', '03:33', 1, 1, 4),
('0105', 'Windows', 'https://storage.googleapis.com/ip-public-bucket1/Charlotta/WINDOWS.mp3', '09:12', 1, 1, 5),
('0106', 'Beautiful Waters', 'https://storage.googleapis.com/ip-public-bucket1/Charlotta/BEAUTIFUL-WATERS.mp3', '08:05', 1, 1, 6),
('0107', 'Yellow Transports', 'https://storage.googleapis.com/ip-public-bucket1/Charlotta/YELLOW-TRANSPORTS.mp3', '04:39', 1, 1, 7),
('0108', 'Perfumed Letter', 'https://storage.googleapis.com/ip-public-bucket1/Charlotta/PERFUMED-LETTER.mp3', '04:49', 1, 1, 8),

-- Album 2: Objects & Particles
('0201', 'Jade Flower Memory Index', 'https://storage.googleapis.com/ip-public-bucket1/Objects-and-Particles/JADE-FLOWER-MEMORY-INDEX.mp3', '06:19', 1, 2, 1),
('0202', 'r+d=t', 'https://storage.googleapis.com/ip-public-bucket1/Objects-and-Particles/r-D-T.mp3', '09:06', 1, 2, 2),
('0203', 'Raintunnels', 'https://storage.googleapis.com/ip-public-bucket1/Objects-and-Particles/RAINTUNNELS.mp3', '04:35', 1, 2, 3),
('0204', 'Snow Crystal', 'https://storage.googleapis.com/ip-public-bucket1/Objects-and-Particles/SNOW-CRYSTAL.mp3', '08:09', 1, 2, 4),
('0205', 'X+Y=Z', 'https://storage.googleapis.com/ip-public-bucket1/Objects-and-Particles/X-Y-Z.mp3', '06:10', 1, 2, 5),
('0206', 'V', 'https://storage.googleapis.com/ip-public-bucket1/Objects-and-Particles/V.mp3', '06:45', 1, 2, 6),

-- Album 3: Glass City of Us
('0301', 'Caterpillar', 'https://storage.googleapis.com/ip-public-bucket1/Glass-City-of-Us/CATERPILLAR.mp3', '06:43', 1, 3, 1),
('0302', 'Films of Nature', 'https://storage.googleapis.com/ip-public-bucket1/Glass-City-of-Us/FILMS-OF-NATURE.mp3', '06:09', 1, 3, 2),
('0303', 'Glass City of Us', 'https://storage.googleapis.com/ip-public-bucket1/Glass-City-of-Us/GLASS-CITY-OF-US.mp3', '12:52', 1, 3, 3),
('0304', 'Nice', 'https://storage.googleapis.com/ip-public-bucket1/Glass-City-of-Us/NICE.mp3', '07:00', 1, 3, 4),
('0305', 'Optical Record Pipe', 'https://storage.googleapis.com/ip-public-bucket1/Glass-City-of-Us/OPTICAL-RECORD-PIPE.mp3', '07:44', 1, 3, 5),
('0306', 'Sun Through Clouds onto Flowers', 'https://storage.googleapis.com/ip-public-bucket1/Glass-City-of-Us/SUN-THROUGH-CLOUDS-ONTO-FLOWERS.mp3', '08:33', 1, 3, 6),

-- Album 4: New Domes of Earth
('0401', 'Beaches', 'https://storage.googleapis.com/ip-public-bucket1/New-Domes-of-Earth/BEACHES.mp3', '03:58', 1, 4, 1),
('0402', 'Projected Mountains', 'https://storage.googleapis.com/ip-public-bucket1/New-Domes-of-Earth/PROJECTED-MOUNTAINS.mp3', '08:24', 1, 4, 2),
('0403', 'Repeated Fires', 'https://storage.googleapis.com/ip-public-bucket1/New-Domes-of-Earth/REPEATED-FIRES.mp3', '03:04', 1, 4, 3),
('0404', 'The Taste of Truth', 'https://storage.googleapis.com/ip-public-bucket1/New-Domes-of-Earth/THE-TASTE-OF-TRUTH.mp3', '04:38', 1, 4, 4),
('0405', 'Spheres of Life', 'https://storage.googleapis.com/ip-public-bucket1/New-Domes-of-Earth/SPHERES-OF-LIFE.mp3', '02:54', 1, 4, 5),
('0406', 'Dawn for Children', 'https://storage.googleapis.com/ip-public-bucket1/New-Domes-of-Earth/DAWN-FOR-CHILDREN.mp3', '04:29', 1, 4, 6),

-- Album 5: Natura
('0501', 'Botany', 'https://storage.googleapis.com/ip-public-bucket1/Natura/BOTANY.mp3', '03:19', 1, 5, 1),
('0502', 'Clouds', 'https://storage.googleapis.com/ip-public-bucket1/Natura/CLOUDS.mp3', '05:12', 1, 5, 2),
('0503', 'Colours in Rain', 'https://storage.googleapis.com/ip-public-bucket1/Natura/COLOURS-IN-RAIN.mp3', '07:18', 1, 5, 3),
('0504', 'Early Summer Sky', 'https://storage.googleapis.com/ip-public-bucket1/Natura/EARLY-SUMMER-SKY.mp3', '04:46', 1, 5, 4),
('0505', 'First Spring', 'https://storage.googleapis.com/ip-public-bucket1/Natura/FIRST-SPRING.mp3', '05:26', 1, 5, 5),
('0506', 'Flower', 'https://storage.googleapis.com/ip-public-bucket1/Natura/FLOWER.mp3', '03:45', 1, 5, 6),
('0507', 'Streams', 'https://storage.googleapis.com/ip-public-bucket1/Natura/STREAMS.mp3', '05:29', 1, 5, 7),
('0508', 'Tidal', 'https://storage.googleapis.com/ip-public-bucket1/Natura/TIDAL.mp3', '04:55', 1, 5, 8),
('0509', 'Waters', 'https://storage.googleapis.com/ip-public-bucket1/Natura/WATERS.mp3', '05:46', 1, 5, 9),

-- Album 6: Outer Corners
('0601', 'Stars', 'https://storage.googleapis.com/ip-public-bucket1/Outer-Corners/STARS.mp3', '06:23', 1, 6, 1),
('0602', 'Galaxies', 'https://storage.googleapis.com/ip-public-bucket1/Outer-Corners/GALAXIES.mp3', '05:49', 1, 6, 2),
('0603', 'Dimensions', 'https://storage.googleapis.com/ip-public-bucket1/Outer-Corners/DIMENSIONS.mp3', '02:25', 1, 6, 3),
('0604', 'Nebulae', 'https://storage.googleapis.com/ip-public-bucket1/Outer-Corners/NEBULAE.mp3', '04:54', 1, 6, 4),
('0605', 'Galactic Cosmic Rays', 'https://storage.googleapis.com/ip-public-bucket1/Outer-Corners/GALACTIC-COSMIC-RAYS.mp3', '07:34', 1, 6, 5),
('0606', 'Quantum', 'https://storage.googleapis.com/ip-public-bucket1/Outer-Corners/QUANTUM.mp3', '05:40', 1, 6, 6),
('0607', 'Stellar', 'https://storage.googleapis.com/ip-public-bucket1/Outer-Corners/STELLAR.mp3', '05:38', 1, 6, 7),

-- Album 7: Nonagon
('0701', 'Spherical', 'https://storage.googleapis.com/ip-public-bucket1/Nonagon/SPHERICAL.mp3', '05:00', 1, 7, 1),
('0702', 'Rhombus', 'https://storage.googleapis.com/ip-public-bucket1/Nonagon/RHOMBUS.mp3', '05:25', 1, 7, 2),
('0703', 'Triangular', 'https://storage.googleapis.com/ip-public-bucket1/Nonagon/TRIANGULAR.mp3', '03:58', 1, 7, 3),
('0704', 'Curvature', 'https://storage.googleapis.com/ip-public-bucket1/Nonagon/CURVATURE.mp3', '04:16', 1, 7, 4),
('0705', 'Nonagon', 'https://storage.googleapis.com/ip-public-bucket1/Nonagon/NONAGON.mp3', '04:13', 1, 7, 5),
('0706', 'Quadrants', 'https://storage.googleapis.com/ip-public-bucket1/Nonagon/QUADRANTS.mp3', '07:17', 1, 7, 6),
('0707', 'Dodecahedron', 'https://storage.googleapis.com/ip-public-bucket1/Nonagon/DODECAHEDRON.mp3', '06:05', 1, 7, 7),
('0708', 'Arc', 'https://storage.googleapis.com/ip-public-bucket1/Nonagon/ARC.mp3', '08:53', 1, 7, 8),
('0709', 'Vertices', 'https://storage.googleapis.com/ip-public-bucket1/Nonagon/VERTICES.mp3', '08:17', 1, 7, 9),

-- Album 8: Ambient Garden One
('0801', 'Stars | Outer Corners', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/STARS.mp3', '06:23', 1, 8, 1),
('0802', 'Waters | Natura', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/WATERS.mp3', '05:46', 1, 8, 2),
('0803', 'Caterpillar | Glass City of Us', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/CATERPILLAR.mp3', '06:43', 1, 8, 3),
('0804', 'Flower | Natura', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/FLOWER.mp3', '03:45', 1, 8, 4),
('0805', 'Beaches | New Domes of Earth', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/BEACHES.mp3', '03:58', 1, 8, 5),
('0806', 'Perfumed Letter | Charlotta', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/PERFUMED-LETTER.mp3', '04:48', 1, 8, 6),
('0807', 'Stellar | Outer Corners', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/STELLAR.mp3', '05:38', 1, 8, 7),
('0808', 'Dawn for Children | New Domes of Earth', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/DAWN-FOR-CHILDREN.mp3', '04:29', 1, 8, 8),
('0809', 'Optical Record Pipe | Glass City of Us', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/OPTICAL-RECORD-PIPE.mp3', '07:44', 1, 8, 9),
('0810', 'Nonagon | Nonagon', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/NONAGON.mp3', '04:13', 1, 8, 10),
('0811', 'V | Objects & Particles', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/V.mp3', '06:54', 1, 8, 11),
('0812', 'Arc | Nonagon', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/ARC.mp3', '08:53', 1, 8, 12),
('0813', 'Jade Flower Memory Index | Objects & Particles', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/JADE-FLOWER-MEMORY-INDEX.mp3', '06:14', 1, 8, 13),
('0814', 'Charlotta | Charlotta', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/CHARLOTTA.mp3', '08:19', 1, 8, 14)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  audio_url = EXCLUDED.audio_url,
  duration = EXCLUDED.duration,
  artist_id = EXCLUDED.artist_id,
  album_id = EXCLUDED.album_id,
  track_id = EXCLUDED.track_id,
  updated_at = CURRENT_TIMESTAMP;