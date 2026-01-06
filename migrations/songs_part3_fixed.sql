-- migrations/songs_part3.sql (Albums 17-24)
-- Insert songs data - Albums 17-24

INSERT INTO songs (id, name, audio_url, duration, artist_id, album_id, track_id) VALUES 
-- Album 17: Sakura
('1701', 'Asa no Tori', '/api/audio/Sakura/Asa-no-Tori.mp3', '07:49', 1, 17, 1),
('1702', 'Night Tunnel to Tokyo', '/api/audio/Sakura/Night-Tunnel-to-Tokyo.mp3', '07:40', 1, 17, 2),
('1703', '5 Rings', '/api/audio/Sakura/5-Rings.mp3', '05:16', 1, 17, 3),
('1704', 'A Dream of Rain & Blossoms', '/api/audio/Sakura/A-Dream-of-Rain-and-Blossoms.mp3', '05:46', 1, 17, 4),
('1705', 'Izakaya', '/api/audio/Sakura/Izakaya.mp3', '05:14', 1, 17, 5),
('1706', 'Hanzo Blues', '/api/audio/Sakura/Hanzo-Blues.mp3', '04:47', 1, 17, 6),
('1707', 'Yamanote', '/api/audio/Sakura/Yamanote.mp3', '08:05', 1, 17, 7),

-- Album 18: Poem for a Homeworld
('1801', 'Ocean Holiday Simulation', '/api/audio/Poem-For-A-Homeworld/Ocean-Holiday-Simulation.mp3', '06:41', 1, 18, 1),
('1802', 'Journey home to Base One', '/api/audio/Poem-For-A-Homeworld/Journey-home-to-Base-One.mp3', '06:16', 1, 18, 2),
('1803', 'Solarium at Base Two', '/api/audio/Poem-For-A-Homeworld/Solarium-at-Base-Two.mp3', '05:13', 1, 18, 3),
('1804', 'Code for Robots', '/api/audio/Poem-For-A-Homeworld/Code-for-Robots.mp3', '05:08', 1, 18, 4),
('1805', 'Bouquet against the Blackness of Space', '/api/audio/Poem-For-A-Homeworld/Bouquet-against-the-Blackness-of-Space.mp3', '03:52', 1, 18, 5),
('1806', 'Poem for a Homeworld', '/api/audio/Poem-For-A-Homeworld/Poem-for-a-Homeworld.mp3', '09:37', 1, 18, 6),
('1807', 'Heirlooms of 1999 (Featuring: Ruby Lakatua)', '/api/audio/Poem-For-A-Homeworld/Heirlooms-of-1999.mp3', '07:09', 1, 18, 7),
('1808', 'The Colours of Beyond', '/api/audio/Poem-For-A-Homeworld/The-Colours-of-Beyond.mp3', '07:44', 1, 18, 8),
('1809', 'Biospheres', '/api/audio/Poem-For-A-Homeworld/Biospheres.mp3', '05:04', 1, 18, 9),
('1810', 'Lone Galaxies', '/api/audio/Poem-For-A-Homeworld/Lone-Galaxies.mp3', '09:30', 1, 18, 10),
('1811', 'Stars of Origin', '/api/audio/Poem-For-A-Homeworld/Stars-of-Origin.mp3', '04:49', 1, 18, 11),
('1812', 'Cryostasis', '/api/audio/Poem-For-A-Homeworld/Cryostasis.mp3', '05:48', 1, 18, 12),
('1813', 'Sailboat to the Sun', '/api/audio/Poem-For-A-Homeworld/Sailboat-to-the-Sun.mp3', '06:02', 1, 18, 13),
('1814', 'Event Horizon of the Self', '/api/audio/Poem-For-A-Homeworld/Event-Horizon-of-the-Self.mp3', '04:47', 1, 18, 14),
('1815', 'Epilogues', '/api/audio/Poem-For-A-Homeworld/Epilogues.mp3', '05:18', 1, 18, 15),

-- Album 19: Rhombus
('1901', 'Origami', '/api/audio/Rhombus/Origami.mp3', '05:34', 1, 19, 1),
('1902', 'A Beautiful Design', '/api/audio/Rhombus/A-Beautiful-Design.mp3', '07:44', 1, 19, 2),
('1903', 'The Conduit', '/api/audio/Rhombus/The-Conduit.mp3', '06:12', 1, 19, 3),
('1904', 'A Letter to Rhombus from a Square', '/api/audio/Rhombus/A-Letter-to-Rhombus-from-a-Square.mp3', '05:24', 1, 19, 4),
('1905', 'Of Conté & Shade', '/api/audio/Rhombus/Of-Conte-and-Shade.mp3', '03:56', 1, 19, 5),
('1906', 'A Window is a Friend of Rain', '/api/audio/Rhombus/A-Window-is-a-Friend-of-Rain.mp3', '05:01', 1, 19, 6),
('1907', 'Sunrise in Primary Colors', '/api/audio/Rhombus/Sunrise-In-Primary-Colors.mp3', '04:02', 1, 19, 7),
('1908', 'Penumbra', '/api/audio/Rhombus/Penumbra.mp3', '06:59', 1, 19, 8),
('1909', 'Tree of Thought', '/api/audio/Rhombus/Tree-of-Thought.mp3', '08:05', 1, 19, 9),
('1910', 'Art District', '/api/audio/Rhombus/Art-District.mp3', '07:05', 1, 19, 10),

-- Album 20: Vignettes of Clouds
('2001', 'Clouds I', '/api/audio/Vignettes-of-Clouds/Clouds-I.mp3', '09:04', 1, 20, 1),
('2002', 'Messages', '/api/audio/Vignettes-of-Clouds/Messages.mp3', '07:44', 1, 20, 2),
('2003', 'Cumulus', '/api/audio/Vignettes-of-Clouds/Cumulus.mp3', '03:38', 1, 20, 3),
('2004', 'Fractus', '/api/audio/Vignettes-of-Clouds/Fractus.mp3', '05:36', 1, 20, 4),
('2005', 'A Cloud''s Poem to the Rain below', '/api/audio/Vignettes-of-Clouds/A-Clouds-Poem-to-the-Rain-below.mp3', '05:52', 1, 20, 5),
('2006', 'Cloud Light above the Sea', '/api/audio/Vignettes-of-Clouds/Cloud-Light-above-the-Sea.mp3', '03:46', 1, 20, 6),
('2007', 'Morning Clouds', '/api/audio/Vignettes-of-Clouds/Morning-Clouds.mp3', '06:04', 1, 20, 7),
('2008', 'A Cloud''s visit to the Artist', '/api/audio/Vignettes-of-Clouds/A-Clouds-visit-to-the-Artist.mp3', '02:48', 1, 20, 8),
('2009', 'Mountain Tops amongst the White', '/api/audio/Vignettes-of-Clouds/Mountain-Tops-amongst-the-White.mp3', '02:48', 1, 20, 9),
('2010', 'Clouds and the City', '/api/audio/Vignettes-of-Clouds/Clouds-and-the-City.mp3', '07:33', 1, 20, 10),
('2011', 'Formations', '/api/audio/Vignettes-of-Clouds/Formations.mp3', '05:40', 1, 20, 11),
('2012', 'Clouds II', '/api/audio/Vignettes-of-Clouds/Clouds-II.mp3', '04:34', 1, 20, 12),

-- Album 21: JIKAN | Original Soundtrack
('2101', 'I: Abstraction & Landscape', '/api/audio/Jikan/I-Abstraction-and-Landscape.mp3', '06:38', 1, 21, 1),
('2102', 'II: The Colour of Life', '/api/audio/Jikan/II-The-Colour-of-Life.mp3', '06:16', 1, 21, 2),
('2103', 'III: The Sun of The Day', '/api/audio/Jikan/III-The-Sun-of-The-Day.mp3', '04:07', 1, 21, 3),
('2104', 'IV: Rain of the Fall', '/api/audio/Jikan/IV-Rain-of-the-Fall.mp3', '08:43', 1, 21, 4),
('2105', 'V: The Fire of Autumn', '/api/audio/Jikan/V-The-Fire-of-Autumn.mp3', '05:13', 1, 21, 5),
('2106', 'VI: The Slumber of Snow', '/api/audio/Jikan/VI-The-Slumber-of-Snow.mp3', '05:15', 1, 21, 6),
('2107', 'JIKAN: Continuous |Movements 1-6', '/api/audio/Jikan/JIKAN-Continuous-Movements1-6.mp3', '36:12', 1, 21, 7),

-- Album 22: Apocrypha
('2201', 'Apocrypha', '/api/audio/Apocrypha/Apocrypha.mp3', '11:29', 1, 22, 1),
('2202', 'Hermitage', '/api/audio/Apocrypha/Hermitage.mp3', '05:35', 1, 22, 2),
('2203', 'Decision Weight', '/api/audio/Apocrypha/Decision-Weight.mp3', '03:04', 1, 22, 3),
('2204', 'Black Box', '/api/audio/Apocrypha/Black-Box.mp3', '07:44', 1, 22, 4),
('2205', 'Compute', '/api/audio/Apocrypha/Compute.mp3', '02:04', 1, 22, 5),
('2206', 'Data Tree', '/api/audio/Apocrypha/Data-Tree.mp3', '04:18', 1, 22, 6),
('2207', 'Jacquard', '/api/audio/Apocrypha/Jacquard.mp3', '05:50', 1, 22, 7),
('2208', 'To be watched amongst the Random Forest', '/api/audio/Apocrypha/To-be-watched-amongst-the-Random-Forest.mp3', '07:00', 1, 22, 8),
('2209', 'Sigma', '/api/audio/Apocrypha/Sigma.mp3', '08:39', 1, 22, 9),
('2210', 'Post Singularities', '/api/audio/Apocrypha/Post-Singularities.mp3', '06:38', 1, 22, 10),
('2211', 'The City Beyond!', '/api/audio/Apocrypha/The-City-Beyond!.mp3', '04:20', 1, 22, 11),
('2212', 'Behold the Eyes that see though you', '/api/audio/Apocrypha/Behold-the-Eyes-that-see-though-you.mp3', '05:20', 1, 22, 12),
('2213', 'The Poems of Integers', '/api/audio/Apocrypha/The-Poems-of-Integers.mp3', '03:49', 1, 22, 13),
('2214', 'Task', '/api/audio/Apocrypha/Task.mp3', '04:38', 1, 22, 14),
('2215', 'Abzu', '/api/audio/Apocrypha/Abzu.mp3', '06:01', 1, 22, 15),

-- Album 23: Ambient Garden Two
('2301', 'IV | Music for Seven Structures', '/api/audio/Ambient-Garden-Two/STRUCTURE-4.mp3', '02:41', 1, 23, 1),
('2302', 'Moment of Light | Inner Moments of Light', '/api/audio/Ambient-Garden-Two/MOMENT-OF-LIGHT.mp3', '04:34', 1, 23, 2),
('2303', 'Beyond the Veils | Nocturnes & Reveries', '/api/audio/Ambient-Garden-Two/BEYOND-THE-VEILS.mp3', '07:08', 1, 23, 3),
('2304', 'Open Concept | Prefabrication', '/api/audio/Ambient-Garden-Two/OPEN-CONCEPT.mp3', '08:00', 1, 23, 4),
('2305', 'III- Axons to the Void | Vagary', '/api/audio/Ambient-Garden-Two/III-AXONS-TO-THE-VOID.mp3', '07:18', 1, 23, 5),
('2306', 'EXHIBIT C3 | Amsterdam Concreet', '/api/audio/Ambient-Garden-Two/EXHIBIT-C3.mp3', '05:27', 1, 23, 6),
('2307', 'Artwork of Children | Watercolours for Friends', '/api/audio/Ambient-Garden-Two/ARTWORK-OF-CHILDREN.mp3', '06:20', 1, 23, 7),
('2308', 'Celestial Drum | Postcards from Old Sounds', '/api/audio/Ambient-Garden-Two/CELESTIAL-DRUM.mp3', '09:36', 1, 23, 8),
('2309', 'Asa no Tori | Sakura', '/api/audio/Ambient-Garden-Two/ASA-NO-TORI.mp3', '07:49', 1, 23, 9),
('2310', 'Bouquet against the Blackness of Space | Poem for a Homeworld', '/api/audio/Ambient-Garden-Two/BOUQUET-AGAINST-THE-BLACKNESS-OF-SPACE.mp3', '03:52', 1, 23, 10),
('2311', 'Sunrise in Primary Colors | Rhombus', '/api/audio/Ambient-Garden-Two/SUNRISE-IN-PRIMARY-COLOURS.mp3', '04:02', 1, 23, 11),
('2312', 'A Cloud''s visit to the Artist | Vignettes of Clouds', '/api/audio/Ambient-Garden-Two/A-COLOUDS-VISIT-TO-THE-ARTIST.mp3', '02:48', 1, 23, 12),
('2313', 'VI: The Slumber of Snow | JIKAN | Original Soundtrack', '/api/audio/Ambient-Garden-Two/VI-THE-SLUMBER-OF-SNOW.mp3', '05:15', 1, 23, 13),
('2314', 'Abzu | APOCRYPHA', '/api/audio/Ambient-Garden-Two/ABZU.mp3', '06:01', 1, 23, 14),

-- Album 24: Utopian
('2401', 'Lost Postcard', '/api/audio/UTOPIA/Lost-Postcard.mp3', '03:52', 1, 24, 1),
('2402', 'Car to a known Place', '/api/audio/UTOPIA/Car-to-a-known-Place.mp3', '06:12', 1, 24, 2),
('2403', 'Train of Memory', '/api/audio/UTOPIA/Train-of-Memory.mp3', '05:14', 1, 24, 3),
('2404', 'Garden Light', '/api/audio/UTOPIA/Garden-Light.mp3', '07:32', 1, 24, 4),
('2405', 'Mutual Sunrise', '/api/audio/UTOPIA/Mutual-Sunrise.mp3', '05:12', 1, 24, 5),
('2406', 'A distant Cloud says Hello', '/api/audio/UTOPIA/A-distant-Cloud-says-Hello.mp3', '06:08', 1, 24, 6),
('2407', 'Photographs', '/api/audio/UTOPIA/Photographs.mp3', '04:28', 1, 24, 7),
('2408', 'Utopian', '/api/audio/UTOPIA/Utopian.mp3', '07:39', 1, 24, 8),


-- Album 25: Signals
('2501', 'Mathematics of the New Domain', '/api/audio/Signals/Mathematics-of-the-New-Domain.mp3', '04:45', 1, 25, 1),
('2502', 'The Galactic Proxy', '/api/audio/Signals/The-Galactic-Proxy.mp3', '08:42', 1, 25, 2),
('2503', 'Signal I', '/api/audio/Signals/Signal-I.mp3', '05:34', 1, 25, 3),
('2504', 'No Coincidence', '/api/audio/Signals/No-Coincidence.mp3', '5:44', 1, 25, 4),
('2505', 'Overture for Transmutation', '/api/audio/Signals/Overture-for-Transmutation.mp3', '06:21', 1, 25, 5),
('2506', 'Inward Breath to the Multitudes', '/api/audio/Signals/Inward-Breath-to-the-Multitudes.mp3', '06:38', 1, 25, 6),
('2507', 'You Choose your own Universe', '/api/audio/Signals/You-Choose-your-own-Universe.mp3', '09:18', 1, 25, 7),
('2508', 'The Conclusion of Moments', '/api/audio/Signals/The-Conclusion-of-Moments.mp3', '07:18', 1, 25, 8),
('2509', 'Signal II', '/api/audio/Signals/Signal-II.mp3', '04:51', 1, 25, 9),





ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  audio_url = EXCLUDED.audio_url,
  duration = EXCLUDED.duration,
  artist_id = EXCLUDED.artist_id,
  album_id = EXCLUDED.album_id,
  track_id = EXCLUDED.track_id,
  updated_at = CURRENT_TIMESTAMP;