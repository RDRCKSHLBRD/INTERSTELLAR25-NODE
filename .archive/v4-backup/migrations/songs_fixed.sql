-- migrations/songs.sql (Part 1 of 3)
-- Insert all songs data - Albums 1-8

INSERT INTO songs (id, name, audio_url, duration, artist_id, album_id, track_id) VALUES 
-- Album 1: Charlotta
('0101', 'Charlotta', '/api/audio/Charlotta/CHARLOTTA.mp3', '08:28', 1, 1, 1),
('0102', 'Garden Mix', '/api/audio/Charlotta/GARDEN-MIX.mp3', '03:28', 1, 1, 2),
('0103', 'New Ornithologies', '/api/audio/Charlotta/NEW-ORNITHOLOGIES.mp3', '03:51', 1, 1, 3),
('0104', 'Old Flowers', '/api/audio/Charlotta/OLD-FLOWERS.mp3', '03:33', 1, 1, 4),
('0105', 'Windows', '/api/audio/Charlotta/WINDOWS.mp3', '09:12', 1, 1, 5),
('0106', 'Beautiful Waters', '/api/audio/Charlotta/BEAUTIFUL-WATERS.mp3', '08:05', 1, 1, 6),
('0107', 'Yellow Transports', '/api/audio/Charlotta/YELLOW-TRANSPORTS.mp3', '04:39', 1, 1, 7),
('0108', 'Perfumed Letter', '/api/audio/Charlotta/PERFUMED-LETTER.mp3', '04:49', 1, 1, 8),

-- Album 2: Objects & Particles
('0201', 'Jade Flower Memory Index', '/api/audio/Objects-and-Particles/JADE-FLOWER-MEMORY-INDEX.mp3', '06:19', 1, 2, 1),
('0202', 'r+d=t', '/api/audio/Objects-and-Particles/r-D-T.mp3', '09:06', 1, 2, 2),
('0203', 'Raintunnels', '/api/audio/Objects-and-Particles/RAINTUNNELS.mp3', '04:35', 1, 2, 3),
('0204', 'Snow Crystal', '/api/audio/Objects-and-Particles/SNOW-CRYSTAL.mp3', '08:09', 1, 2, 4),
('0205', 'X+Y=Z', '/api/audio/Objects-and-Particles/X-Y-Z.mp3', '06:10', 1, 2, 5),
('0206', 'V', '/api/audio/Objects-and-Particles/V.mp3', '06:45', 1, 2, 6),

-- Album 3: Glass City of Us
('0301', 'Caterpillar', '/api/audio/Glass-City-of-Us/CATERPILLAR.mp3', '06:43', 1, 3, 1),
('0302', 'Films of Nature', '/api/audio/Glass-City-of-Us/FILMS-OF-NATURE.mp3', '06:09', 1, 3, 2),
('0303', 'Glass City of Us', '/api/audio/Glass-City-of-Us/GLASS-CITY-OF-US.mp3', '12:52', 1, 3, 3),
('0304', 'Nice', '/api/audio/Glass-City-of-Us/NICE.mp3', '07:00', 1, 3, 4),
('0305', 'Optical Record Pipe', '/api/audio/Glass-City-of-Us/OPTICAL-RECORD-PIPE.mp3', '07:44', 1, 3, 5),
('0306', 'Sun Through Clouds onto Flowers', '/api/audio/Glass-City-of-Us/SUN-THROUGH-CLOUDS-ONTO-FLOWERS.mp3', '08:33', 1, 3, 6),

-- Album 4: New Domes of Earth
('0401', 'Beaches', '/api/audio/New-Domes-of-Earth/BEACHES.mp3', '03:58', 1, 4, 1),
('0402', 'Projected Mountains', '/api/audio/New-Domes-of-Earth/PROJECTED-MOUNTAINS.mp3', '08:24', 1, 4, 2),
('0403', 'Repeated Fires', '/api/audio/New-Domes-of-Earth/REPEATED-FIRES.mp3', '03:04', 1, 4, 3),
('0404', 'The Taste of Truth', '/api/audio/New-Domes-of-Earth/THE-TASTE-OF-TRUTH.mp3', '04:38', 1, 4, 4),
('0405', 'Spheres of Life', '/api/audio/New-Domes-of-Earth/SPHERES-OF-LIFE.mp3', '02:54', 1, 4, 5),
('0406', 'Dawn for Children', '/api/audio/New-Domes-of-Earth/DAWN-FOR-CHILDREN.mp3', '04:29', 1, 4, 6),

-- Album 5: Natura
('0501', 'Botany', '/api/audio/Natura/BOTANY.mp3', '03:19', 1, 5, 1),
('0502', 'Clouds', '/api/audio/Natura/CLOUDS.mp3', '05:12', 1, 5, 2),
('0503', 'Colours in Rain', '/api/audio/Natura/COLOURS-IN-RAIN.mp3', '07:18', 1, 5, 3),
('0504', 'Early Summer Sky', '/api/audio/Natura/EARLY-SUMMER-SKY.mp3', '04:46', 1, 5, 4),
('0505', 'First Spring', '/api/audio/Natura/FIRST-SPRING.mp3', '05:26', 1, 5, 5),
('0506', 'Flower', '/api/audio/Natura/FLOWER.mp3', '03:45', 1, 5, 6),
('0507', 'Streams', '/api/audio/Natura/STREAMS.mp3', '05:29', 1, 5, 7),
('0508', 'Tidal', '/api/audio/Natura/TIDAL.mp3', '04:55', 1, 5, 8),
('0509', 'Waters', '/api/audio/Natura/WATERS.mp3', '05:46', 1, 5, 9),

-- Album 6: Outer Corners
('0601', 'Stars', '/api/audio/Outer-Corners/STARS.mp3', '06:23', 1, 6, 1),
('0602', 'Galaxies', '/api/audio/Outer-Corners/GALAXIES.mp3', '05:49', 1, 6, 2),
('0603', 'Dimensions', '/api/audio/Outer-Corners/DIMENSIONS.mp3', '02:25', 1, 6, 3),
('0604', 'Nebulae', '/api/audio/Outer-Corners/NEBULAE.mp3', '04:54', 1, 6, 4),
('0605', 'Galactic Cosmic Rays', '/api/audio/Outer-Corners/GALACTIC-COSMIC-RAYS.mp3', '07:34', 1, 6, 5),
('0606', 'Quantum', '/api/audio/Outer-Corners/QUANTUM.mp3', '05:40', 1, 6, 6),
('0607', 'Stellar', '/api/audio/Outer-Corners/STELLAR.mp3', '05:38', 1, 6, 7),

-- Album 7: Nonagon
('0701', 'Spherical', '/api/audio/Nonagon/SPHERICAL.mp3', '05:00', 1, 7, 1),
('0702', 'Rhombus', '/api/audio/Nonagon/RHOMBUS.mp3', '05:25', 1, 7, 2),
('0703', 'Triangular', '/api/audio/Nonagon/TRIANGULAR.mp3', '03:58', 1, 7, 3),
('0704', 'Curvature', '/api/audio/Nonagon/CURVATURE.mp3', '04:16', 1, 7, 4),
('0705', 'Nonagon', '/api/audio/Nonagon/NONAGON.mp3', '04:13', 1, 7, 5),
('0706', 'Quadrants', '/api/audio/Nonagon/QUADRANTS.mp3', '07:17', 1, 7, 6),
('0707', 'Dodecahedron', '/api/audio/Nonagon/DODECAHEDRON.mp3', '06:05', 1, 7, 7),
('0708', 'Arc', '/api/audio/Nonagon/ARC.mp3', '08:53', 1, 7, 8),
('0709', 'Vertices', '/api/audio/Nonagon/VERTICES.mp3', '08:17', 1, 7, 9),

-- Album 8: Ambient Garden One
('0801', 'Stars | Outer Corners', '/api/audio/Ambient-Garden-One/STARS.mp3', '06:23', 1, 8, 1),
('0802', 'Waters | Natura', '/api/audio/Ambient-Garden-One/WATERS.mp3', '05:46', 1, 8, 2),
('0803', 'Caterpillar | Glass City of Us', '/api/audio/Ambient-Garden-One/CATERPILLAR.mp3', '06:43', 1, 8, 3),
('0804', 'Flower | Natura', '/api/audio/Ambient-Garden-One/FLOWER.mp3', '03:45', 1, 8, 4),
('0805', 'Beaches | New Domes of Earth', '/api/audio/Ambient-Garden-One/BEACHES.mp3', '03:58', 1, 8, 5),
('0806', 'Perfumed Letter | Charlotta', '/api/audio/Ambient-Garden-One/PERFUMED-LETTER.mp3', '04:48', 1, 8, 6),
('0807', 'Stellar | Outer Corners', '/api/audio/Ambient-Garden-One/STELLAR.mp3', '05:38', 1, 8, 7),
('0808', 'Dawn for Children | New Domes of Earth', '/api/audio/Ambient-Garden-One/DAWN-FOR-CHILDREN.mp3', '04:29', 1, 8, 8),
('0809', 'Optical Record Pipe | Glass City of Us', '/api/audio/Ambient-Garden-One/OPTICAL-RECORD-PIPE.mp3', '07:44', 1, 8, 9),
('0810', 'Nonagon | Nonagon', '/api/audio/Ambient-Garden-One/NONAGON.mp3', '04:13', 1, 8, 10),
('0811', 'V | Objects & Particles', '/api/audio/Ambient-Garden-One/V.mp3', '06:54', 1, 8, 11),
('0812', 'Arc | Nonagon', '/api/audio/Ambient-Garden-One/ARC.mp3', '08:53', 1, 8, 12),
('0813', 'Jade Flower Memory Index | Objects & Particles', '/api/audio/Ambient-Garden-One/JADE-FLOWER-MEMORY-INDEX.mp3', '06:14', 1, 8, 13),
('0814', 'Charlotta | Charlotta', '/api/audio/Ambient-Garden-One/CHARLOTTA.mp3', '08:19', 1, 8, 14)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  audio_url = EXCLUDED.audio_url,
  duration = EXCLUDED.duration,
  artist_id = EXCLUDED.artist_id,
  album_id = EXCLUDED.album_id,
  track_id = EXCLUDED.track_id,
  updated_at = CURRENT_TIMESTAMP;