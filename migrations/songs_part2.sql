-- migrations/songs_part2.sql (Albums 9-16)
-- Insert songs data - Albums 9-16

INSERT INTO songs (id, name, audio_url, duration, artist_id, album_id, track_id) VALUES 
-- Album 9: Music for Seven Structures
('0901', 'I', 'https://storage.googleapis.com/ip-public-bucket1/Music-For-Seven-Structures/STRUCTURE-1.mp3', '06:51', 1, 9, 1),
('0902', 'II', 'https://storage.googleapis.com/ip-public-bucket1/Music-For-Seven-Structures/STRUCTURE-2.mp3', '04:32', 1, 9, 2),
('0903', 'III', 'https://storage.googleapis.com/ip-public-bucket1/Music-For-Seven-Structures/STRUCTURE-3.mp3', '04:47', 1, 9, 3),
('0904', 'IV', 'https://storage.googleapis.com/ip-public-bucket1/Music-For-Seven-Structures/STRUCTURE-4.mp3', '02:41', 1, 9, 4),
('0905', 'V', 'https://storage.googleapis.com/ip-public-bucket1/Music-For-Seven-Structures/STRUCTURE-5.mp3', '05:39', 1, 9, 5),
('0906', 'VI', 'https://storage.googleapis.com/ip-public-bucket1/Music-For-Seven-Structures/STRUCTURE-6.mp3', '06:53', 1, 9, 6),
('0907', 'VII', 'https://storage.googleapis.com/ip-public-bucket1/Music-For-Seven-Structures/STRUCTURE-7.mp3', '06:58', 1, 9, 7),

-- Album 10: Inner Moments of Light
('1001', 'Moment of Light', 'https://storage.googleapis.com/ip-public-bucket1/Inner-Moment-of-Light/MOMENT-OF-LIGHT.mp3', '04:34', 1, 10, 1),
('1002', 'Landscape II', 'https://storage.googleapis.com/ip-public-bucket1/Inner-Moment-of-Light/LANDSCAPE-II.mp3', '03:00', 1, 10, 2),
('1003', 'Prisms', 'https://storage.googleapis.com/ip-public-bucket1/Inner-Moment-of-Light/PRISMS.mp3', '08:08', 1, 10, 3),
('1004', 'Sphere', 'https://storage.googleapis.com/ip-public-bucket1/Inner-Moment-of-Light/SPHERE.mp3', '12:44', 1, 10, 4),
('1005', 'Beauty of the Heart', 'https://storage.googleapis.com/ip-public-bucket1/Inner-Moment-of-Light/BEAUTY-OF-THE-HEART.mp3', '04:13', 1, 10, 5),
('1006', 'Beginnings', 'https://storage.googleapis.com/ip-public-bucket1/Inner-Moment-of-Light/BEGININGS.mp3', '06:53', 1, 10, 6),
('1007', 'Landscape I', 'https://storage.googleapis.com/ip-public-bucket1/Inner-Moment-of-Light/LANDCSCAPE-I.mp3', '03:19', 1, 10, 7),
('1008', 'Universal Knowledge', 'https://storage.googleapis.com/ip-public-bucket1/Inner-Moment-of-Light/UNIVERSAL-KNOWLEDGE.mp3', '04:25', 1, 10, 8),
('1009', 'Love is the Universe', 'https://storage.googleapis.com/ip-public-bucket1/Inner-Moment-of-Light/LOVE-IS-THE-UNIVERSE.mp3', '04:27', 1, 10, 9),

-- Album 11: Nocturnes & Reveries
('1101', 'Moon above the Sea', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Moon-above-the-Sea.mp3', '06:46', 1, 11, 1),
('1102', 'Starlight through Trees', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Starlight-through-Trees.mp3', '09:40', 1, 11, 2),
('1103', 'Garden', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Garden.mp3', '04:31', 1, 11, 3),
('1104', 'Animals of the Night', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Animals-of-the-Night.mp3', '06:09', 1, 11, 4),
('1105', 'Moon Gate', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Moon-Gate.mp3', '06:49', 1, 11, 5),
('1106', 'Obelisk', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Obelisk.mp3', '08:42', 1, 11, 6),
('1107', 'Bardo', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Bardo.mp3', '07:06', 1, 11, 7),
('1108', 'Eyes open at the Cusp of Dawn', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Eyes-open-at-the-Cusp-of-Dawn.mp3', '05:36', 1, 11, 8),
('1109', 'Selene', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Selene.mp3', '04:54', 1, 11, 9),
('1110', 'Charon', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Charon.mp3', '06:08', 1, 11, 10),
('1111', 'Night Music', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Night-Music.mp3', '07:07', 1, 11, 11),
('1112', 'Lunar Eclipse', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Lunar-Eclipse.mp3', '04:44', 1, 11, 12),
('1113', 'Nocturnes & Reveries', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Nocturnes-and-Reveries.mp3', '09:20', 1, 11, 13),
('1114', 'Beyond the Veils', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Beyond-the-Veils.mp3', '07:08', 1, 11, 14),
('1115', 'Morning Light', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Morning-Light.mp3', '06:28', 1, 11, 15),

-- Album 12: Prefabrication
('1201', 'Prefabrication', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/PREFABRICATION.mp3', '06:15', 1, 12, 1),
('1202', 'Construct', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/CONSTRUCT.mp3', '06:24', 1, 12, 2),
('1203', 'Euclid', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/EUCLID.mp3', '08:14', 1, 12, 3),
('1204', 'Quadrangle', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/QUADRANGLE.mp3', '07:49', 1, 12, 4),
('1205', 'Open Concept', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/OPEN-CONCEPT.mp3', '08:00', 1, 12, 5),
('1206', 'Three Over One', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/THREE-OVER-ONE.mp3', '08:58', 1, 12, 6),
('1207', 'Schematic', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/SCHEMATIC.mp3', '04:04', 1, 12, 7),
('1208', 'Sequences', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/SEQUENCES.mp3', '05:59', 1, 12, 8),
('1209', 'A Noble Plan for a Good Idea', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/A-NOBLE-PLAN-FOR-A-GOOD-IDEA.mp3', '03:22', 1, 12, 9),
('1210', 'Formulations', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/FORMULATIONS.mp3', '07:48', 1, 12, 10),

-- Album 13: Vagary
('1301', 'I- When the Observer becomes the observed', 'https://storage.googleapis.com/ip-public-bucket1/Vagary/I-When-the-Observer-becomes-the-Observed.mp3', '09:06', 1, 13, 1),
('1302', 'II- We all look inward to the Multiverse', 'https://storage.googleapis.com/ip-public-bucket1/Vagary/II-We-all-look-inward-to-the-Multiverse.mp3', '06:32', 1, 13, 2),
('1303', 'III- Axons to the Void', 'https://storage.googleapis.com/ip-public-bucket1/Vagary/III-Axons-to-the-Void.mp3', '07:18', 1, 13, 3),
('1304', 'IV- The embrace of Mountains & the Skies', 'https://storage.googleapis.com/ip-public-bucket1/Vagary/IV-The-Embrace-of-Mountains-and-the-Skies.mp3', '09:08', 1, 13, 4),
('1305', 'V- Crucibles', 'https://storage.googleapis.com/ip-public-bucket1/Vagary/V-Crucibles.mp3', '12:27', 1, 13, 5),
('1306', 'VI- What lies beyond That which you Think You Understand?', 'https://storage.googleapis.com/ip-public-bucket1/Vagary/VI-What-lies-beyond-That-which-you-Think-You-Understand.mp3', '13:41', 1, 13, 6),
('1307', 'VII- Pathologies', 'https://storage.googleapis.com/ip-public-bucket1/Vagary/VII-Pathologies.mp3', '04:36', 1, 13, 7),
('1308', 'VIII- The Crescent of Ascension', 'https://storage.googleapis.com/ip-public-bucket1/Vagary/VIII-The-Crescent-of-Ascension.mp3', '16:37', 1, 13, 8),

-- Album 14: Amsterdam Concreet
('1401', 'EXHIBIT A', 'https://storage.googleapis.com/ip-public-bucket1/Amsterdam-Concreet/EXHIBIT-A.mp3', '06:40', 1, 14, 1),
('1402', 'EXHIBIT B', 'https://storage.googleapis.com/ip-public-bucket1/Amsterdam-Concreet/EXHIBIT-B.mp3', '10:42', 1, 14, 2),
('1403', 'EXHIBIT C1', 'https://storage.googleapis.com/ip-public-bucket1/Amsterdam-Concreet/EXHIBIT-C1.mp3', '08:39', 1, 14, 3),
('1404', 'EXHIBIT C2', 'https://storage.googleapis.com/ip-public-bucket1/Amsterdam-Concreet/EXHIBIT-C2.mp3', '03:19', 1, 14, 4),
('1405', 'EXHIBIT C3', 'https://storage.googleapis.com/ip-public-bucket1/Amsterdam-Concreet/EXHIBIT-C3.mp3', '05:27', 1, 14, 5),
('1406', 'EXHIBIT D', 'https://storage.googleapis.com/ip-public-bucket1/Amsterdam-Concreet/EXHIBIT-D.mp3', '07:24', 1, 14, 6),
('1407', 'EXHIBIT E', 'https://storage.googleapis.com/ip-public-bucket1/Amsterdam-Concreet/EXHIBIT-E.mp3', '08:36', 1, 14, 7),
('1408', 'EXHIBIT F', 'https://storage.googleapis.com/ip-public-bucket1/Amsterdam-Concreet/EXHIBIT-F.mp3', '08:34', 1, 14, 8),
('1409', 'EXHIBIT G', 'https://storage.googleapis.com/ip-public-bucket1/Amsterdam-Concreet/EXHIBIT-G.mp3', '09:28', 1, 14, 9),

-- Album 15: Watercolours for Friends (INCLUDING ROBOT'S DREAM!)
('1501', 'Breakfasts', 'https://storage.googleapis.com/ip-public-bucket1/Watercolours-for-Friends/BREAKFASTS.mp3', '10:28', 1, 15, 1),
('1502', 'Astral Conversion', 'https://storage.googleapis.com/ip-public-bucket1/Watercolours-for-Friends/ASTRAL-CONVERSION.mp3', '05:40', 1, 15, 2),
('1503', 'Clouds for Two', 'https://storage.googleapis.com/ip-public-bucket1/Watercolours-for-Friends/CLOUDS-FOR-TWO.mp3', '05:30', 1, 15, 3),
('1504', 'Artwork of Children', 'https://storage.googleapis.com/ip-public-bucket1/Watercolours-for-Friends/ARTWORK-OF-CHILDREN.mp3', '06:20', 1, 15, 4),
('1505', 'Robot''s Dream', 'https://storage.googleapis.com/ip-public-bucket1/Watercolours-for-Friends/ROBOTS-DREAM.mp3', '07:51', 1, 15, 5),
('1506', 'Spatial Recognition', 'https://storage.googleapis.com/ip-public-bucket1/Watercolours-for-Friends/SPATIAL-RECOGNITION.mp3', '05:56', 1, 15, 6),
('1507', 'Memories of Forgotten Places', 'https://storage.googleapis.com/ip-public-bucket1/Watercolours-for-Friends/MEMORIES-OF-FORGOTTEN-PLACES.mp3', '09:08', 1, 15, 7),

-- Album 16: Postcards from Old Sounds
('1601', 'Polarity', 'https://storage.googleapis.com/ip-public-bucket1/Postcards-From-Old-Sounds/POLARITY.mp3', '11:18', 1, 16, 1),
('1602', 'Celestial Drum', 'https://storage.googleapis.com/ip-public-bucket1/Postcards-From-Old-Sounds/CELESTIAL-DRUM.mp3', '09:36', 1, 16, 2),
('1603', 'Crystal Heart', 'https://storage.googleapis.com/ip-public-bucket1/Postcards-From-Old-Sounds/CRYSTAL-HEART.mp3', '10:48', 1, 16, 3),
('1604', 'Old Machines', 'https://storage.googleapis.com/ip-public-bucket1/Postcards-From-Old-Sounds/OLD-MACHINES.mp3', '04:55', 1, 16, 4),
('1605', 'Postcards from Old sounds', 'https://storage.googleapis.com/ip-public-bucket1/Postcards-From-Old-Sounds/POSTCARDS-FROM-OLD-SOUNDS.mp3', '13:06', 1, 16, 5)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  audio_url = EXCLUDED.audio_url,
  duration = EXCLUDED.duration,
  artist_id = EXCLUDED.artist_id,
  album_id = EXCLUDED.album_id,
  track_id = EXCLUDED.track_id,
  updated_at = CURRENT_TIMESTAMP;