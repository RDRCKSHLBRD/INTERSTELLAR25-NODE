-- INTERSTELLAR DATABASE - COMPLETE SQLITE MIGRATION
-- Generated: 2026-02-08
-- Target: SQLite 3

PRAGMA foreign_keys = ON;

-- ==========================================
-- 1. CLEANUP (DROP TABLES)
-- ==========================================
DROP TABLE IF EXISTS guest_downloads;
DROP TABLE IF EXISTS purchase_items;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS playlists;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS songs;
DROP TABLE IF EXISTS albums;
DROP TABLE IF EXISTS artists;
DROP TABLE IF EXISTS users;

-- ==========================================
-- 2. SCHEMA DEFINITION
-- ==========================================

-- ARTISTS
CREATE TABLE artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ALBUMS
CREATE TABLE albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    catalogue TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    cover_url TEXT,
    production_date TEXT,
    release_date TEXT,
    artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
    credit TEXT,
    description TEXT,
    tracks INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- SONGS
CREATE TABLE songs (
    id TEXT PRIMARY KEY, -- '0101' format preserved
    name TEXT NOT NULL,
    audio_url TEXT,
    duration TEXT,
    artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
    album_id INTEGER REFERENCES albums(id) ON DELETE CASCADE,
    track_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- USERS
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT UNIQUE NOT NULL,
    name_first TEXT,
    name_last TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    verification_token TEXT,
    is_verified INTEGER DEFAULT 0,
    reset_token TEXT,
    reset_token_expiry DATETIME,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PLAYLISTS
CREATE TABLE playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    is_public INTEGER DEFAULT 0,
    songs TEXT DEFAULT '[]', -- JSON array stored as TEXT
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCTS
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cat_id TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    name TEXT NOT NULL,
    catalogue_id TEXT,
    description TEXT,
    active INTEGER DEFAULT 1,
    song_id TEXT UNIQUE REFERENCES songs(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CARTS
CREATE TABLE carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CART ITEMS
CREATE TABLE cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id INTEGER REFERENCES carts(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PURCHASES
CREATE TABLE purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'cad',
    status TEXT DEFAULT 'pending',
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    email TEXT,
    customer_name TEXT,
    metadata TEXT,
    purchase_type TEXT DEFAULT 'user' CHECK(purchase_type IN ('user', 'guest')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PURCHASE ITEMS
CREATE TABLE purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 1,
    price_at_purchase DECIMAL(10, 2) NOT NULL
);

-- USER SESSIONS
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- GUEST DOWNLOADS
CREATE TABLE guest_downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    accessed_at DATETIME,
    access_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. TRIGGERS (Auto-Update Timestamps)
-- ==========================================
CREATE TRIGGER update_artists_timestamp AFTER UPDATE ON artists BEGIN UPDATE artists SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id; END;
CREATE TRIGGER update_albums_timestamp AFTER UPDATE ON albums BEGIN UPDATE albums SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id; END;
CREATE TRIGGER update_songs_timestamp AFTER UPDATE ON songs BEGIN UPDATE songs SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id; END;
CREATE TRIGGER update_users_timestamp AFTER UPDATE ON users BEGIN UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id; END;
CREATE TRIGGER update_products_timestamp AFTER UPDATE ON products BEGIN UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id; END;
CREATE TRIGGER update_purchases_timestamp AFTER UPDATE ON purchases BEGIN UPDATE purchases SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id; END;

-- ==========================================
-- 4. DATA SEEDING (ARTISTS)
-- ==========================================
INSERT INTO artists (id, name, description) VALUES 
(1, 'Roderick Shoolbraid', 'Electronic Ambient Musician');

-- ==========================================
-- 5. DATA SEEDING (ALBUMS - ALL 25)
-- ==========================================
INSERT INTO albums (id, catalogue, name, cover_url, production_date, release_date, artist_id, credit, description, tracks) VALUES 
(1, '00040101', 'Charlotta', '/api/image/Charlotta/1_CHARLOTTA.png', 'May 1, 2005', 'October 3, 2010', 1, 'All Sound & Composition: Roderick Shoolbraid.<br>Cover Art, Photography & Design: Roderick Shoolbraid.<br> &copy;All Rights Reserved.', 'The debut ambient electronic album by Roderick Shoolbraid, written in a span from 2003 to 2005. Released in 2010. A soundtrack for a dream, and a film that never was.', 8),
(2, '00040102', 'Objects & Particles', '/api/image/Objects-and-Particles/2_OBJECTS-PARTICLES.png', 'March 1, 2006', 'October 10, 2010', 1, 'All Sound & Composition: Roderick Shoolbraid.<br>Cover Art, Photography & Design: Roderick Shoolbraid.<br> &copy;All Rights Reserved.', 'Between "Charlotta" & "Glass City of Us" (2004-6), this darker album explored minimal ambient music. It used noise, line hum, record skips, and drone reverbs. Inspired by the idea that objects in math, physics, & chemistry have their own music, if we listen closely.', 6),
(3, '00040103', 'Glass City of Us', '/api/image/Glass-City-of-Us/3_GLASS-CITY.png', 'July 1, 2007', 'November 1, 2010', 1, 'All Sound & Composition: Roderick Shoolbraid.<br>Cover Art, Photography & Design: Roderick Shoolbraid.<br> &copy;All Rights Reserved.', 'The third installment of the "Ambient Garden" series. A brighter, more optimistic sound than its predecessor.', 6),
(4, '00040104', 'New Domes of Earth', '/api/image/New-Domes-of-Earth/4_NEW-DOMES.png', 'August 1, 2007', 'November 12, 2010', 1, 'All Sound & Composition: Roderick Shoolbraid.<br>Cover Art, Photography & Design: Roderick Shoolbraid.<br> &copy;All Rights Reserved.', 'A return to structure and melody.', 6),
(5, '01040105', 'Natura', '/api/image/Natura/5_NATURA.png', 'September 1, 2008', 'January 25, 2011', 1, 'All Sound & Composition: Roderick Shoolbraid.<br>Cover Art, Photography & Design: Roderick Shoolbraid.<br> &copy;All Rights Reserved.', 'Organic sounds meets digital synthesis.', 9),
(6, '01040106', 'Outer Corners', '/api/image/Outer-Corners/6_OUTER-CORNERS.png', 'October 1, 2008', 'February 4, 2011', 1, 'All Sound & Composition: Roderick Shoolbraid.<br>Cover Art, Photography & Design: Roderick Shoolbraid.<br> &copy;All Rights Reserved.', 'Explorations of the edge of sound.', 7),
(7, '01040107', 'Nonagon', '/api/image/Nonagon/7_NONAGON.png', 'November 1, 2009', 'March 10, 2011', 1, 'All Sound & Composition: Roderick Shoolbraid.<br>Cover Art, Photography & Design: Roderick Shoolbraid.<br> &copy;All Rights Reserved.', 'Nine sides, nine tracks, nine dreams.', 9),
(8, '01040108', 'Ambient Garden One', '/api/image/Ambient-Garden-One/8_AMBIENT-GARDEN-ONE.png', 'May 1, 2010', 'June 5, 2011', 1, 'All Sound & Composition: Roderick Shoolbraid.<br>Cover Art, Photography & Design: Roderick Shoolbraid.<br> &copy;All Rights Reserved.', 'The compilation that started it all.', 14),
(9, '01040109', 'Music for Seven Structures', '/api/image/Music-For-Seven-Structures/9_SEVEN-STRUCTURES.png', 'January 2012', 'January 2012', 1, 'All Sound & Composition: Roderick Shoolbraid', 'Architectural soundscapes.', 7),
(10, '01040110', 'Inner Moment of Light', '/api/image/Inner-Moment-of-Light/10_INNER-MOMENT.png', 'June 2012', 'June 2012', 1, 'All Sound & Composition: Roderick Shoolbraid', 'A study in silence and space.', 9),
(11, '01040111', 'Nocturnes & Reveries', '/api/image/Nocturnes-and-Reveries/11_NOCTURNES.png', '2013', '2013', 1, 'All Sound & Composition: Roderick Shoolbraid', 'Drifting through memory.', 15),
(12, '01040112', 'Prefabrication', '/api/image/Prefabrication/12_PREFAB.png', '2014', '2014', 1, 'All Sound & Composition: Roderick Shoolbraid', 'Constructed realities.', 10),
(13, '01040113', 'Vagary', '/api/image/Vagary/13_VAGARY.png', '2015', '2015', 1, 'All Sound & Composition: Roderick Shoolbraid', 'A wandering journey.', 8),
(14, '01040114', 'Amsterdam Concreet', '/api/image/Amsterdam-Concreet/14_AMSTERDAM.png', '2016', '2016', 1, 'All Sound & Composition: Roderick Shoolbraid', 'Urban textures from the canals.', 9),
(15, '01040115', 'Watercolours for Friends', '/api/image/Watercolours-for-Friends/15_WATERCOLOURS.png', '2017', '2017', 1, 'All Sound & Composition: Roderick Shoolbraid', 'Soft, blended tones.', 7),
(16, '01040116', 'Postcards from Old Sounds', '/api/image/Postcards-From-Old-Sounds/16_POSTCARDS.png', '2018', '2018', 1, 'All Sound & Composition: Roderick Shoolbraid', 'Nostalgic frequencies.', 5),
(17, '01040117', 'Sakura', '/api/image/Sakura/17_SAKURA.png', '2019', '2019', 1, 'All Sound & Composition: Roderick Shoolbraid', 'Inspired by Japan.', 7),
(18, '01040118', 'Poem for a Homeworld', '/api/image/Poem-for-a-Homeworld/18_POEM.png', '2020', '2020', 1, 'All Sound & Composition: Roderick Shoolbraid', 'Sci-fi ambient.', 15),
(19, '01040119', 'Rhombus', '/api/image/Rhombus/19_RHOMBUS.png', '2021', '2021', 1, 'All Sound & Composition: Roderick Shoolbraid', 'Geometric sound design.', 10),
(20, '01040120', 'Vignettes of Clouds', '/api/image/Vignettes-of-Clouds/20_VIGNETTES.png', '2022', '2022', 1, 'All Sound & Composition: Roderick Shoolbraid', 'Short stories in sound.', 12),
(21, '01040121', 'JIKAN | Original Soundtrack', '/api/image/Jikan/21_JIKAN.png', '2023', '2023', 1, 'All Sound & Composition: Roderick Shoolbraid', 'Deep, fluid textures.', 7),
(22, '01040122', 'Apocrypha', '/api/image/Apocrypha/22_APOCRYPHA.png', '2023', '2023', 1, 'All Sound & Composition: Roderick Shoolbraid', 'Music for the late hours.', 15),
(23, '01040123', 'Ambient Garden Two', '/api/image/Ambient-Garden-Two/23_AMBIENT-GARDEN-TWO.png', '2024', '2024', 1, 'All Sound & Composition: Roderick Shoolbraid', 'Further explorations of the east.', 14),
(24, '01040124', 'Utopian', '/api/image/Utopia/24_UTOPIA.png', '2025', '2025', 1, 'All Sound & Composition: Roderick Shoolbraid', 'The perfect place.', 8),
(25, '01040125', 'Signals', '/api/image/Signals/SIGNAL-COVER-3000.png', 'December 31, 2025', 'December 31, 2025', 1, 'All Sound, Composition & Music: Roderick Shoolbraid <br> &copy; All rights reserved', 'A natural moment, starting in the vacuum and blackness.', 9);


-- ==========================================
-- 6. DATA SEEDING (SONGS - ALL 215+ TRACKS)
-- ==========================================
INSERT INTO songs (id, name, audio_url, duration, artist_id, album_id, track_id) VALUES 
-- Album 1
('0101', 'Charlotta', '/api/audio/Charlotta/CHARLOTTA.mp3', '08:28', 1, 1, 1),
('0102', 'Garden Mix', '/api/audio/Charlotta/GARDEN-MIX.mp3', '03:28', 1, 1, 2),
('0103', 'New Ornithologies', '/api/audio/Charlotta/NEW-ORNITHOLOGIES.mp3', '03:51', 1, 1, 3),
('0104', 'Old Flowers', '/api/audio/Charlotta/OLD-FLOWERS.mp3', '03:33', 1, 1, 4),
('0105', 'Windows', '/api/audio/Charlotta/WINDOWS.mp3', '09:12', 1, 1, 5),
('0106', 'Beautiful Waters', '/api/audio/Charlotta/BEAUTIFUL-WATERS.mp3', '08:05', 1, 1, 6),
('0107', 'Yellow Transports', '/api/audio/Charlotta/YELLOW-TRANSPORTS.mp3', '04:39', 1, 1, 7),
('0108', 'Perfumed Letter', '/api/audio/Charlotta/PERFUMED-LETTER.mp3', '04:49', 1, 1, 8),
-- Album 2
('0201', 'Jade Flower Memory Index', '/api/audio/Objects-and-Particles/JADE-FLOWER-MEMORY-INDEX.mp3', '06:19', 1, 2, 1),
('0202', 'r+d=t', '/api/audio/Objects-and-Particles/r-D-T.mp3', '09:06', 1, 2, 2),
('0203', 'Raintunnels', '/api/audio/Objects-and-Particles/RAINTUNNELS.mp3', '04:35', 1, 2, 3),
('0204', 'Snow Crystal', '/api/audio/Objects-and-Particles/SNOW-CRYSTAL.mp3', '08:09', 1, 2, 4),
('0205', 'X+Y=Z', '/api/audio/Objects-and-Particles/X-Y-Z.mp3', '06:10', 1, 2, 5),
('0206', 'V', '/api/audio/Objects-and-Particles/V.mp3', '06:45', 1, 2, 6),
-- Album 3
('0301', 'Caterpillar', '/api/audio/Glass-City-of-Us/CATERPILLAR.mp3', '06:43', 1, 3, 1),
('0302', 'Films of Nature', '/api/audio/Glass-City-of-Us/FILMS-OF-NATURE.mp3', '06:09', 1, 3, 2),
('0303', 'Glass City of Us', '/api/audio/Glass-City-of-Us/GLASS-CITY-OF-US.mp3', '12:52', 1, 3, 3),
('0304', 'Nice', '/api/audio/Glass-City-of-Us/NICE.mp3', '07:00', 1, 3, 4),
('0305', 'Optical Record Pipe', '/api/audio/Glass-City-of-Us/OPTICAL-RECORD-PIPE.mp3', '07:44', 1, 3, 5),
('0306', 'Sun Through Clouds onto Flowers', '/api/audio/Glass-City-of-Us/SUN-THROUGH-CLOUDS-ONTO-FLOWERS.mp3', '08:33', 1, 3, 6),
-- Album 4
('0401', 'Beaches', '/api/audio/New-Domes-of-Earth/BEACHES.mp3', '03:58', 1, 4, 1),
('0402', 'Projected Mountains', '/api/audio/New-Domes-of-Earth/PROJECTED-MOUNTAINS.mp3', '08:24', 1, 4, 2),
('0403', 'Repeated Fires', '/api/audio/New-Domes-of-Earth/REPEATED-FIRES.mp3', '03:04', 1, 4, 3),
('0404', 'The Taste of Truth', '/api/audio/New-Domes-of-Earth/THE-TASTE-OF-TRUTH.mp3', '04:38', 1, 4, 4),
('0405', 'Spheres of Life', '/api/audio/New-Domes-of-Earth/SPHERES-OF-LIFE.mp3', '02:54', 1, 4, 5),
('0406', 'Dawn for Children', '/api/audio/New-Domes-of-Earth/DAWN-FOR-CHILDREN.mp3', '04:29', 1, 4, 6),
-- Album 5
('0501', 'Botany', '/api/audio/Natura/BOTANY.mp3', '03:19', 1, 5, 1),
('0502', 'Clouds', '/api/audio/Natura/CLOUDS.mp3', '05:12', 1, 5, 2),
('0503', 'Colours in Rain', '/api/audio/Natura/COLOURS-IN-RAIN.mp3', '07:18', 1, 5, 3),
('0504', 'Early Summer Sky', '/api/audio/Natura/EARLY-SUMMER-SKY.mp3', '04:46', 1, 5, 4),
('0505', 'First Spring', '/api/audio/Natura/FIRST-SPRING.mp3', '05:26', 1, 5, 5),
('0506', 'Flower', '/api/audio/Natura/FLOWER.mp3', '03:45', 1, 5, 6),
('0507', 'Streams', '/api/audio/Natura/STREAMS.mp3', '05:29', 1, 5, 7),
('0508', 'Tidal', '/api/audio/Natura/TIDAL.mp3', '04:55', 1, 5, 8),
('0509', 'Waters', '/api/audio/Natura/WATERS.mp3', '05:46', 1, 5, 9),
-- Album 6
('0601', 'Stars', '/api/audio/Outer-Corners/STARS.mp3', '06:23', 1, 6, 1),
('0602', 'Galaxies', '/api/audio/Outer-Corners/GALAXIES.mp3', '05:49', 1, 6, 2),
('0603', 'Dimensions', '/api/audio/Outer-Corners/DIMENSIONS.mp3', '02:25', 1, 6, 3),
('0604', 'Nebulae', '/api/audio/Outer-Corners/NEBULAE.mp3', '04:54', 1, 6, 4),
('0605', 'Galactic Cosmic Rays', '/api/audio/Outer-Corners/GALACTIC-COSMIC-RAYS.mp3', '07:34', 1, 6, 5),
('0606', 'Quantum', '/api/audio/Outer-Corners/QUANTUM.mp3', '05:40', 1, 6, 6),
('0607', 'Stellar', '/api/audio/Outer-Corners/STELLAR.mp3', '05:38', 1, 6, 7),
-- Album 7
('0701', 'Spherical', '/api/audio/Nonagon/SPHERICAL.mp3', '05:00', 1, 7, 1),
('0702', 'Rhombus', '/api/audio/Nonagon/RHOMBUS.mp3', '05:25', 1, 7, 2),
('0703', 'Triangular', '/api/audio/Nonagon/TRIANGULAR.mp3', '03:58', 1, 7, 3),
('0704', 'Curvature', '/api/audio/Nonagon/CURVATURE.mp3', '04:16', 1, 7, 4),
('0705', 'Nonagon', '/api/audio/Nonagon/NONAGON.mp3', '04:13', 1, 7, 5),
('0706', 'Quadrants', '/api/audio/Nonagon/QUADRANTS.mp3', '07:17', 1, 7, 6),
('0707', 'Dodecahedron', '/api/audio/Nonagon/DODECAHEDRON.mp3', '06:05', 1, 7, 7),
('0708', 'Arc', '/api/audio/Nonagon/ARC.mp3', '08:53', 1, 7, 8),
('0709', 'Vertices', '/api/audio/Nonagon/VERTICES.mp3', '08:17', 1, 7, 9),
-- Album 8
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
('0814', 'Charlotta | Charlotta', '/api/audio/Ambient-Garden-One/CHARLOTTA.mp3', '08:19', 1, 8, 14),
-- Album 9
('0901', 'I', '/api/audio/Music-For-Seven-Structures/STRUCTURE-1.mp3', '06:51', 1, 9, 1),
('0902', 'II', '/api/audio/Music-For-Seven-Structures/STRUCTURE-2.mp3', '04:32', 1, 9, 2),
('0903', 'III', '/api/audio/Music-For-Seven-Structures/STRUCTURE-3.mp3', '04:47', 1, 9, 3),
('0904', 'IV', '/api/audio/Music-For-Seven-Structures/STRUCTURE-4.mp3', '02:41', 1, 9, 4),
('0905', 'V', '/api/audio/Music-For-Seven-Structures/STRUCTURE-5.mp3', '05:39', 1, 9, 5),
('0906', 'VI', '/api/audio/Music-For-Seven-Structures/STRUCTURE-6.mp3', '06:53', 1, 9, 6),
('0907', 'VII', '/api/audio/Music-For-Seven-Structures/STRUCTURE-7.mp3', '06:58', 1, 9, 7),
-- Album 10
('1001', 'Moment of Light', '/api/audio/Inner-Moment-of-Light/MOMENT-OF-LIGHT.mp3', '04:34', 1, 10, 1),
('1002', 'Landscape II', '/api/audio/Inner-Moment-of-Light/LANDSCAPE-II.mp3', '03:00', 1, 10, 2),
('1003', 'Prisms', '/api/audio/Inner-Moment-of-Light/PRISMS.mp3', '08:08', 1, 10, 3),
('1004', 'Sphere', '/api/audio/Inner-Moment-of-Light/SPHERE.mp3', '12:44', 1, 10, 4),
('1005', 'Beauty of the Heart', '/api/audio/Inner-Moment-of-Light/BEAUTY-OF-THE-HEART.mp3', '04:13', 1, 10, 5),
('1006', 'Beginnings', '/api/audio/Inner-Moment-of-Light/BEGININGS.mp3', '06:53', 1, 10, 6),
('1007', 'Landscape I', '/api/audio/Inner-Moment-of-Light/LANDCSCAPE-I.mp3', '03:19', 1, 10, 7),
('1008', 'Universal Knowledge', '/api/audio/Inner-Moment-of-Light/UNIVERSAL-KNOWLEDGE.mp3', '04:25', 1, 10, 8),
('1009', 'Love is the Universe', '/api/audio/Inner-Moment-of-Light/LOVE-IS-THE-UNIVERSE.mp3', '04:27', 1, 10, 9),
-- Album 11
('1101', 'Moon above the Sea', '/api/audio/Nocturnes-and-Reveries/Moon-above-the-Sea.mp3', '06:46', 1, 11, 1),
('1102', 'Starlight through Trees', '/api/audio/Nocturnes-and-Reveries/Starlight-through-Trees.mp3', '09:40', 1, 11, 2),
('1103', 'Garden', '/api/audio/Nocturnes-and-Reveries/Garden.mp3', '04:31', 1, 11, 3),
('1104', 'Animals of the Night', '/api/audio/Nocturnes-and-Reveries/Animals-of-the-Night.mp3', '06:09', 1, 11, 4),
('1105', 'Moon Gate', '/api/audio/Nocturnes-and-Reveries/Moon-Gate.mp3', '06:49', 1, 11, 5),
('1106', 'Obelisk', '/api/audio/Nocturnes-and-Reveries/Obelisk.mp3', '08:42', 1, 11, 6),
('1107', 'Bardo', '/api/audio/Nocturnes-and-Reveries/Bardo.mp3', '07:06', 1, 11, 7),
('1108', 'Eyes open at the Cusp of Dawn', '/api/audio/Nocturnes-and-Reveries/Eyes-open-at-the-Cusp-of-Dawn.mp3', '05:36', 1, 11, 8),
('1109', 'Selene', '/api/audio/Nocturnes-and-Reveries/Selene.mp3', '04:54', 1, 11, 9),
('1110', 'Charon', '/api/audio/Nocturnes-and-Reveries/Charon.mp3', '06:08', 1, 11, 10),
('1111', 'Night Music', '/api/audio/Nocturnes-and-Reveries/Night-Music.mp3', '07:07', 1, 11, 11),
('1112', 'Lunar Eclipse', '/api/audio/Nocturnes-and-Reveries/Lunar-Eclipse.mp3', '04:44', 1, 11, 12),
('1113', 'Nocturnes & Reveries', '/api/audio/Nocturnes-and-Reveries/Nocturnes-and-Reveries.mp3', '09:20', 1, 11, 13),
('1114', 'Beyond the Veils', '/api/audio/Nocturnes-and-Reveries/Beyond-the-Veils.mp3', '07:08', 1, 11, 14),
('1115', 'Morning Light', '/api/audio/Nocturnes-and-Reveries/Morning-Light.mp3', '06:28', 1, 11, 15),
-- Album 12
('1201', 'Prefabrication', '/api/audio/Prefabrication/PREFABRICATION.mp3', '06:15', 1, 12, 1),
('1202', 'Construct', '/api/audio/Prefabrication/CONSTRUCT.mp3', '06:24', 1, 12, 2),
('1203', 'Euclid', '/api/audio/Prefabrication/EUCLID.mp3', '08:14', 1, 12, 3),
('1204', 'Quadrangle', '/api/audio/Prefabrication/QUADRANGLE.mp3', '07:49', 1, 12, 4),
('1205', 'Open Concept', '/api/audio/Prefabrication/OPEN-CONCEPT.mp3', '08:00', 1, 12, 5),
('1206', 'Three Over One', '/api/audio/Prefabrication/THREE-OVER-ONE.mp3', '08:58', 1, 12, 6),
('1207', 'Schematic', '/api/audio/Prefabrication/SCHEMATIC.mp3', '04:04', 1, 12, 7),
('1208', 'Sequences', '/api/audio/Prefabrication/SEQUENCES.mp3', '05:59', 1, 12, 8),
('1209', 'A Noble Plan for a Good Idea', '/api/audio/Prefabrication/A-NOBLE-PLAN-FOR-A-GOOD-IDEA.mp3', '03:22', 1, 12, 9),
('1210', 'Formulations', '/api/audio/Prefabrication/FORMULATIONS.mp3', '07:48', 1, 12, 10),
-- Album 13
('1301', 'I- When the Observer becomes the observed', '/api/audio/Vagary/I-When-the-Observer-becomes-the-Observed.mp3', '09:06', 1, 13, 1),
('1302', 'II- We all look inward to the Multiverse', '/api/audio/Vagary/II-We-all-look-inward-to-the-Multiverse.mp3', '06:32', 1, 13, 2),
('1303', 'III- Axons to the Void', '/api/audio/Vagary/III-Axons-to-the-Void.mp3', '07:18', 1, 13, 3),
('1304', 'IV- The embrace of Mountains & the Skies', '/api/audio/Vagary/IV-The-Embrace-of-Mountains-and-the-Skies.mp3', '09:08', 1, 13, 4),
('1305', 'V- Crucibles', '/api/audio/Vagary/V-Crucibles.mp3', '12:27', 1, 13, 5),
('1306', 'VI- What lies beyond That which you Think You Understand?', '/api/audio/Vagary/VI-What-lies-beyond-That-which-you-Think-You-Understand.mp3', '13:41', 1, 13, 6),
('1307', 'VII- Pathologies', '/api/audio/Vagary/VII-Pathologies.mp3', '04:36', 1, 13, 7),
('1308', 'VIII- The Crescent of Ascension', '/api/audio/Vagary/VIII-The-Crescent-of-Ascension.mp3', '16:37', 1, 13, 8),
-- Album 14
('1401', 'EXHIBIT A', '/api/audio/Amsterdam-Concreet/EXHIBIT-A.mp3', '06:40', 1, 14, 1),
('1402', 'EXHIBIT B', '/api/audio/Amsterdam-Concreet/EXHIBIT-B.mp3', '10:42', 1, 14, 2),
('1403', 'EXHIBIT C1', '/api/audio/Amsterdam-Concreet/EXHIBIT-C1.mp3', '08:39', 1, 14, 3),
('1404', 'EXHIBIT C2', '/api/audio/Amsterdam-Concreet/EXHIBIT-C2.mp3', '03:19', 1, 14, 4),
('1405', 'EXHIBIT C3', '/api/audio/Amsterdam-Concreet/EXHIBIT-C3.mp3', '05:27', 1, 14, 5),
('1406', 'EXHIBIT D', '/api/audio/Amsterdam-Concreet/EXHIBIT-D.mp3', '07:24', 1, 14, 6),
('1407', 'EXHIBIT E', '/api/audio/Amsterdam-Concreet/EXHIBIT-E.mp3', '08:36', 1, 14, 7),
('1408', 'EXHIBIT F', '/api/audio/Amsterdam-Concreet/EXHIBIT-F.mp3', '08:34', 1, 14, 8),
('1409', 'EXHIBIT G', '/api/audio/Amsterdam-Concreet/EXHIBIT-G.mp3', '09:28', 1, 14, 9),
-- Album 15
('1501', 'Breakfasts', '/api/audio/Watercolours-for-Friends/BREAKFASTS.mp3', '10:28', 1, 15, 1),
('1502', 'Astral Conversion', '/api/audio/Watercolours-for-Friends/ASTRAL-CONVERSION.mp3', '05:40', 1, 15, 2),
('1503', 'Clouds for Two', '/api/audio/Watercolours-for-Friends/CLOUDS-FOR-TWO.mp3', '05:30', 1, 15, 3),
('1504', 'Artwork of Children', '/api/audio/Watercolours-for-Friends/ARTWORK-OF-CHILDREN.mp3', '06:20', 1, 15, 4),
('1505', 'Robot''s Dream', '/api/audio/Watercolours-for-Friends/ROBOTS-DREAM.mp3', '07:51', 1, 15, 5),
('1506', 'Spatial Recognition', '/api/audio/Watercolours-for-Friends/SPATIAL-RECOGNITION.mp3', '05:56', 1, 15, 6),
('1507', 'Memories of Forgotten Places', '/api/audio/Watercolours-for-Friends/MEMORIES-OF-FORGOTTEN-PLACES.mp3', '09:08', 1, 15, 7),
-- Album 16
('1601', 'Polarity', '/api/audio/Postcards-From-Old-Sounds/POLARITY.mp3', '11:18', 1, 16, 1),
('1602', 'Celestial Drum', '/api/audio/Postcards-From-Old-Sounds/CELESTIAL-DRUM.mp3', '09:36', 1, 16, 2),
('1603', 'Crystal Heart', '/api/audio/Postcards-From-Old-Sounds/CRYSTAL-HEART.mp3', '10:48', 1, 16, 3),
('1604', 'Old Machines', '/api/audio/Postcards-From-Old-Sounds/OLD-MACHINES.mp3', '04:55', 1, 16, 4),
('1605', 'Postcards from Old sounds', '/api/audio/Postcards-From-Old-Sounds/POSTCARDS-FROM-OLD-SOUNDS.mp3', '13:06', 1, 16, 5),
-- Album 17
('1701', 'Asa no Tori', '/api/audio/Sakura/Asa-no-Tori.mp3', '07:49', 1, 17, 1),
('1702', 'Night Tunnel to Tokyo', '/api/audio/Sakura/Night-Tunnel-to-Tokyo.mp3', '07:40', 1, 17, 2),
('1703', '5 Rings', '/api/audio/Sakura/5-Rings.mp3', '05:16', 1, 17, 3),
('1704', 'A Dream of Rain & Blossoms', '/api/audio/Sakura/A-Dream-of-Rain-and-Blossoms.mp3', '05:46', 1, 17, 4),
('1705', 'Izakaya', '/api/audio/Sakura/Izakaya.mp3', '05:14', 1, 17, 5),
('1706', 'Hanzo Blues', '/api/audio/Sakura/Hanzo-Blues.mp3', '04:47', 1, 17, 6),
('1707', 'Yamanote', '/api/audio/Sakura/Yamanote.mp3', '08:05', 1, 17, 7),
-- Album 18
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
-- Album 19
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
-- Album 20
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
-- Album 21
('2101', 'I: Abstraction & Landscape', '/api/audio/Jikan/I-Abstraction-and-Landscape.mp3', '06:38', 1, 21, 1),
('2102', 'II: The Colour of Life', '/api/audio/Jikan/II-The-Colour-of-Life.mp3', '06:16', 1, 21, 2),
('2103', 'III: The Sun of The Day', '/api/audio/Jikan/III-The-Sun-of-The-Day.mp3', '04:07', 1, 21, 3),
('2104', 'IV: Rain of the Fall', '/api/audio/Jikan/IV-Rain-of-the-Fall.mp3', '08:43', 1, 21, 4),
('2105', 'V: The Fire of Autumn', '/api/audio/Jikan/V-The-Fire-of-Autumn.mp3', '05:13', 1, 21, 5),
('2106', 'VI: The Slumber of Snow', '/api/audio/Jikan/VI-The-Slumber-of-Snow.mp3', '05:15', 1, 21, 6),
('2107', 'JIKAN: Continuous |Movements 1-6', '/api/audio/Jikan/JIKAN-Continuous-Movements1-6.mp3', '36:12', 1, 21, 7),
-- Album 22
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
-- Album 23
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
-- Album 24
('2401', 'Lost Postcard', '/api/audio/UTOPIA/Lost-Postcard.mp3', '03:52', 1, 24, 1),
('2402', 'Car to a known Place', '/api/audio/UTOPIA/Car-to-a-known-Place.mp3', '06:12', 1, 24, 2),
('2403', 'Train of Memory', '/api/audio/UTOPIA/Train-of-Memory.mp3', '05:14', 1, 24, 3),
('2404', 'Garden Light', '/api/audio/UTOPIA/Garden-Light.mp3', '07:32', 1, 24, 4),
('2405', 'Mutual Sunrise', '/api/audio/UTOPIA/Mutual-Sunrise.mp3', '05:12', 1, 24, 5),
('2406', 'A distant Cloud says Hello', '/api/audio/UTOPIA/A-distant-Cloud-says-Hello.mp3', '06:08', 1, 24, 6),
('2407', 'Photographs', '/api/audio/UTOPIA/Photographs.mp3', '04:28', 1, 24, 7),
('2408', 'Utopian', '/api/audio/UTOPIA/Utopian.mp3', '07:39', 1, 24, 8),
-- Album 25
('2501', 'Mathematics of the New Domain', '/api/audio/Signals/Mathematics-of-the-New-Domain.mp3', '04:45', 1, 25, 1),
('2502', 'The Galactic Proxy', '/api/audio/Signals/The-Galactic-Proxy.mp3', '08:42', 1, 25, 2),
('2503', 'Signal I', '/api/audio/Signals/Signal-I.mp3', '05:34', 1, 25, 3),
('2504', 'No Coincidence', '/api/audio/Signals/No-Coincidence.mp3', '5:44', 1, 25, 4),
('2505', 'Overture for Transmutation', '/api/audio/Signals/Overture-for-Transmutation.mp3', '06:21', 1, 25, 5),
('2506', 'Inward Breath to the Multitudes', '/api/audio/Signals/Inward-Breath-to-the-Multitudes.mp3', '06:38', 1, 25, 6),
('2507', 'You Choose your own Universe', '/api/audio/Signals/You-Choose-your-own-Universe.mp3', '09:18', 1, 25, 7),
('2508', 'The Conclusion of Moments', '/api/audio/Signals/The-Conclusion-of-Moments.mp3', '07:18', 1, 25, 8),
('2509', 'Signal II', '/api/audio/Signals/Signal-II.mp3', '04:51', 1, 25, 9);


-- ==========================================
-- 7. AUTO-GENERATE PRODUCTS (ALBUMS & SONGS)
-- ==========================================
-- Create products for Albums
INSERT INTO products (cat_id, price, name, catalogue_id, description, active)
SELECT 
    catalogue, 
    12.00, 
    name, 
    catalogue, 
    'Digital download of ' || name, 
    1 
FROM albums;

-- Create products for Songs (Preventing duplicates)
INSERT INTO products (cat_id, price, name, catalogue_id, description, song_id)
SELECT 
    s.id,
    1.29,
    s.name,
    a.catalogue,
    'Digital download of ' || s.name,
    s.id
FROM songs s
JOIN albums a ON a.id = s.album_id
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.song_id = s.id);

-- ==========================================
-- 8. VERIFICATION
-- ==========================================
SELECT 'Setup Complete!' as Status;
SELECT count(*) as Artists FROM artists;
SELECT count(*) as Albums FROM albums;
SELECT count(*) as Songs FROM songs;
SELECT count(*) as Products FROM products;