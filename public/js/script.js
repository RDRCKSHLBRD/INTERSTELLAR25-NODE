/***************************************************
 * 1) STRIPE PRODUCT LINKS (fill in real URLs)
 **************************************************/
const purchaseLinks = {
  1:  "https://buy.stripe.com/aEUdRWfih6hz0QU6oo",
  2:  "https://buy.stripe.com/5kA016gml49r7fibIJ",
  3:  "https://buy.stripe.com/28o016da90XfgPS5km",
  4:  "https://buy.stripe.com/5kAdRW5HH9tLfLO7sv",
  5:  "https://buy.stripe.com/example_Album5",
  6:  "https://buy.stripe.com/example_Album6",
  7:  "https://buy.stripe.com/example_Album7",
  8:  "https://buy.stripe.com/example_Album8",
  9:  "https://buy.stripe.com/example_Album9",
  10: "https://buy.stripe.com/example_Album10",
  11: "https://buy.stripe.com/example_Album11",
  12: "https://buy.stripe.com/example_Album12",
  13: "https://buy.stripe.com/example_Album13",
  14: "https://buy.stripe.com/example_Album14",
  15: "https://buy.stripe.com/example_Album15",
  16: "https://buy.stripe.com/example_Album16",
  17: "https://buy.stripe.com/example_Album17",
  18: "https://buy.stripe.com/example_Album18",
  19: "https://buy.stripe.com/example_Album19",
  20: "https://buy.stripe.com/example_Album20",
  21: "https://buy.stripe.com/example_Album21",
  22: "https://buy.stripe.com/example_Album22",
  23: "https://buy.stripe.com/example_Album23"
};


/***************************************************
 * 2) CLASS DEFINITIONS
 **************************************************/
class User {
  constructor(id, user_name, name_first, name_last, email) {
    this.id = id;
    this.user_name = user_name;
    this.name_first = name_first;
    this.name_last = name_last;
    this.email = email;
    this.playlists = [];
    this.cart = null;
  }
}

class Artist {
  constructor(id, name, description) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.albums = [];
  }
}

class Album {
  constructor(
    id,
    catalogue,
    name,
    cover_url,
    production_date,
    release_date,
    artist_id,
    credit,
    description,
    tracks
  ) {
    this.id = id;
    this.catalogue = catalogue;
    this.name = name;
    this.cover_url = cover_url;
    this.production_date = production_date;
    this.release_date = release_date;
    this.artist_id = artist_id;
    this.credit = credit;
    this.description = description;
    this.tracks = tracks;
    this.songs = [];
  }
}

class Song {
  constructor(id, name, audio_url, duration, artist_id, album_id, track_id) {
    this.id = id;
    this.name = name;
    this.audio_url = audio_url;
    this.duration = duration;
    this.artist_id = artist_id;
    this.album_id = album_id;
    this.track_id = track_id;
  }
}

class Playlist {
  constructor(id, user_id, name) {
    this.id = id;
    this.user_id = user_id;
    this.name = name;
    this.songs = [];
  }
}

class Product {
  constructor(id, cat_id, price, name, catalogue_id, description) {
    this.id = id;
    this.cat_id = cat_id;
    this.price = price;
    this.name = name;
    this.catalogue_id = catalogue_id;
    this.description = description;
  }
}

class Cart {
  constructor(id, user_id, created_at) {
    this.id = id;
    this.user_id = user_id;
    this.created_at = created_at;
    this.items = [];
  }
}

class CartItem {
  constructor(id, cart_id, product_id, quantity, added_at) {
    this.id = id;
    this.cart_id = cart_id;
    this.product_id = product_id;
    this.quantity = quantity;
    this.added_at = added_at;
  }
}


/***************************************************
 * 3) CREATE YOUR ARTIST + ALBUM + SONG DATA
 **************************************************/
// Artists
const artists = [];

const artist1 = new Artist(
  1,
  'Roderick Shoolbraid',
  'Electronic Ambient Musician'
);
artists.push(artist1);

// The array to hold all your albums
const albums = [];

/**
 *  Below is your massive block of album definitions.
 *  Keep them exactly as in your original code, with no data removed.
 *  (All 23 albums, each with its .songs push.)
 */

// -------------- ALBUM #1 --------------
const album1 = new Album(
  1,
  '00040101',
  'Charlotta',
  'https://storage.googleapis.com/ip-public-bucket1/Charlotta/1_CHARLOTTA.png',
  'May 1, 2005',
  'October 3, 2010',
  1,
  'All Sound & Composition: Roderick Shoolbraid.<br>Cover Art, Photography & Design: Roderick Shoolbraid.<br> &copy;All Rights Reserved.',
  'The debut ambient electronic album by Roderick Shoolbraid, written in a span from 2003 to 2005. Released in 2010. A soundtrack for a dream, and a film that never was.',
  8
);
albums.push(album1);
artist1.albums.push(album1);

// Songs for Album 1
album1.songs.push(
  new Song('0101', 'Charlotta', 'https://storage.googleapis.com/ip-public-bucket1/Charlotta/CHARLOTTA.mp3', '08:28', 1, 1, 1),
  new Song('0102', 'Garden Mix', 'https://storage.googleapis.com/ip-public-bucket1/Charlotta/GARDEN-MIX.mp3', '03:28', 1, 1, 2),
  new Song('0103', 'New Ornithologies', 'https://storage.googleapis.com/ip-public-bucket1/Charlotta/NEW-ORNITHOLOGIES.mp3', '03:51', 1, 1, 3),
  new Song('0104', 'Old Flowers', 'https://storage.googleapis.com/ip-public-bucket1/Charlotta/OLD-FLOWERS.mp3', '03:33', 1, 1, 4),
  new Song('0105', 'Windows', 'https://storage.googleapis.com/ip-public-bucket1/Charlotta/WINDOWS.mp3', '09:12', 1, 1, 5),
  new Song('0106', 'Beautiful Waters', 'https://storage.googleapis.com/ip-public-bucket1/Charlotta/BEAUTIFUL-WATERS.mp3', '08:05', 1, 1, 6),
  new Song('0107', 'Yellow Transports', 'https://storage.googleapis.com/ip-public-bucket1/Charlotta/YELLOW-TRANSPORTS.mp3', '04:39', 1, 1, 7),
  new Song('0108', 'Perfumed Letter', 'https://storage.googleapis.com/ip-public-bucket1/Charlotta/PERFUMED-LETTER.mp3', '04:49', 1, 1, 8)
);

// -------------- ALBUM #2 --------------
const album2 = new Album(
  2,
  '00040102',
  'Objects & Particles',
  'https://storage.googleapis.com/ip-public-bucket1/Objects-and-Particles/2_OBJECTS-PARTICLES.png',
  'March 1, 2006',
  'October 10, 2010',
  1,
  'All Sound & Composition: Roderick Shoolbraid.<br>Cover Art, Photography & Design: Roderick Shoolbraid.<br> &copy;All Rights Reserved.',
  'Between "Charlotta" & "Glass City of Us" (2004-6), this darker album explored minimal ambient music. It used noise, line hum, record skips, and drone reverbs. Inspired by the idea that objects in math, physics, & chemistry have their own music, if we listen closely.',
  6
);
albums.push(album2);
artist1.albums.push(album2);

// Songs for Album 2
album2.songs.push(
  new Song('0201', 'Jade Flower Memory Index', 'https://storage.googleapis.com/ip-public-bucket1/Objects-and-Particles/JADE-FLOWER-MEMORY-INDEX.mp3', '06:19', 1, 2, 1),
  new Song('0202', 'r+d=t', 'https://storage.googleapis.com/ip-public-bucket1/Objects-and-Particles/r-D-T.mp3', '09:06', 1, 2, 2),
  new Song('0203', 'Raintunnels', 'https://storage.googleapis.com/ip-public-bucket1/Objects-and-Particles/RAINTUNNELS.mp3', '04:35', 1, 2, 3),
  new Song('0204', 'Snow Crystal', 'https://storage.googleapis.com/ip-public-bucket1/Objects-and-Particles/SNOW-CRYSTAL.mp3', '08:09', 1, 2, 4),
  new Song('0205', 'X+Y=Z', 'https://storage.googleapis.com/ip-public-bucket1/Objects-and-Particles/X-Y-Z.mp3', '06:10', 1, 2, 5),
  new Song('0206', 'V', 'https://storage.googleapis.com/ip-public-bucket1/Objects-and-Particles/V.mp3', '06:45', 1, 2, 6)
);

// -------------- ALBUM #3 --------------
const album3 = new Album(
  3,
  '00040103',
  'Glass City of Us',
  'https://storage.googleapis.com/ip-public-bucket1/Glass-City-of-Us/3_GLASS-CITY-OF-US.png',
  'April 1, 2005',
  'October 6, 2010',
  1,
  'All Sound & Composition: Roderick Shoolbraid.<br>Cover Art, Photography & Design: Roderick Shoolbraid.<br> &copy;All Rights Reserved.',
  'This album became the sequel to "Charlotta", composed and engineered over a 2 year period from 2003-2005, finished in the middle of 2005. The concept of "The City" emerged through the rough romantic plot of two people in a massive futuristic city, that seems dwarfed by the sentiments by them both.',
  6
);
albums.push(album3);
artist1.albums.push(album3);

// Songs for Album 3
album3.songs.push(
  new Song('0301', 'Caterpillar', 'https://storage.googleapis.com/ip-public-bucket1/Glass-City-of-Us/CATERPILLAR.mp3', '06:43', 1, 3, 1),
  new Song('0302', 'Films of Nature', 'https://storage.googleapis.com/ip-public-bucket1/Glass-City-of-Us/FILMS-OF-NATURE.mp3', '06:09', 1, 3, 2),
  new Song('0303', 'Glass City of Us', 'https://storage.googleapis.com/ip-public-bucket1/Glass-City-of-Us/GLASS-CITY-OF-US.mp3', '12:52', 1, 3, 3),
  new Song('0304', 'Nice', 'https://storage.googleapis.com/ip-public-bucket1/Glass-City-of-Us/NICE.mp3', '07:00', 1, 3, 4),
  new Song('0305', 'Optical Record Pipe', 'https://storage.googleapis.com/ip-public-bucket1/Glass-City-of-Us/OPTICAL-RECORD-PIPE.mp3', '07:44', 1, 3, 5),
  new Song('0306', 'Sun Through Clouds onto Flowers', 'https://storage.googleapis.com/ip-public-bucket1/Glass-City-of-Us/SUN-THROUGH-CLOUDS-ONTO-FLOWERS.mp3', '08:33', 1, 3, 6)
);

// -------------- ALBUM #4 --------------
const album4 = new Album(
  4,
  '00040104',
  'New Domes of Earth',
  'https://storage.googleapis.com/ip-public-bucket1/New-Domes-of-Earth/4_NEW-DOMES.png',
  'May 15, 2005',
  'October 19, 2010',
  1,
  'All Sound & Composition: Roderick Shoolbraid.<br>Cover Art, Photography & Design: Roderick Shoolbraid.<br> &copy;All Rights Reserved.',
  'Music for visions of the future.',
  6
);
albums.push(album4);
artist1.albums.push(album4);

// Songs for Album 4
album4.songs.push(
  new Song('0401', 'Beaches', 'https://storage.googleapis.com/ip-public-bucket1/New-Domes-of-Earth/BEACHES.mp3', '03:58', 1, 4, 1),
  new Song('0402', 'Projected Mountains', 'https://storage.googleapis.com/ip-public-bucket1/New-Domes-of-Earth/PROJECTED-MOUNTAINS.mp3', '08:24', 1, 4, 2),
  new Song('0403', 'Repeated Fires', 'https://storage.googleapis.com/ip-public-bucket1/New-Domes-of-Earth/REPEATED-FIRES.mp3', '03:04', 1, 4, 3),
  new Song('0404', 'The Taste of Truth', 'https://storage.googleapis.com/ip-public-bucket1/New-Domes-of-Earth/THE-TASTE-OF-TRUTH.mp3', '04:38', 1, 4, 4),
  new Song('0405', 'Spheres of Life', 'https://storage.googleapis.com/ip-public-bucket1/New-Domes-of-Earth/SPHERES-OF-LIFE.mp3', '02:54', 1, 4, 5),
  new Song('0406', 'Dawn for Children', 'https://storage.googleapis.com/ip-public-bucket1/New-Domes-of-Earth/DAWN-FOR-CHILDREN.mp3', '04:29', 1, 4, 6)
);

// -------------- ALBUM #5 --------------
const album5 = new Album(
  5,
  '01040105',
  'Natura',
  'https://storage.googleapis.com/ip-public-bucket1/Natura/5_NATURA.png',
  'March 15, 2022',
  'March 22, 2022',
  1,
  'All Sound & Instruments: Roderick Shoolbraid. <br>Painting & Album Cover Design: Roderick Shoolbraid. <br>&copy;All Rights Reserved.',
  'An open letter of love and admiration for the natural world.',
  9
);
albums.push(album5);
artist1.albums.push(album5);

// Songs for Album 5
album5.songs.push(
  new Song('0501', 'Botany', 'https://storage.googleapis.com/ip-public-bucket1/Natura/BOTANY.mp3', '03:19', 1, 5, 1),
  new Song('0502', 'Clouds', 'https://storage.googleapis.com/ip-public-bucket1/Natura/CLOUDS.mp3', '05:12', 1, 5, 2),
  new Song('0503', 'Colours in Rain', 'https://storage.googleapis.com/ip-public-bucket1/Natura/COLOURS-IN-RAIN.mp3', '07:18', 1, 5, 3),
  new Song('0504', 'Early Summer Sky', 'https://storage.googleapis.com/ip-public-bucket1/Natura/EARLY-SUMMER-SKY.mp3', '04:46', 1, 5, 4),
  new Song('0505', 'First Spring', 'https://storage.googleapis.com/ip-public-bucket1/Natura/FIRST-SPRING.mp3', '05:26', 1, 5, 5),
  new Song('0506', 'Flower', 'https://storage.googleapis.com/ip-public-bucket1/Natura/FLOWER.mp3', '03:45', 1, 5, 6),
  new Song('0507', 'Streams', 'https://storage.googleapis.com/ip-public-bucket1/Natura/STREAMS.mp3', '05:29', 1, 5, 7),
  new Song('0508', 'Tidal', 'https://storage.googleapis.com/ip-public-bucket1/Natura/TIDAL.mp3', '04:55', 1, 5, 8),
  new Song('0509', 'Waters', 'https://storage.googleapis.com/ip-public-bucket1/Natura/WATERS.mp3', '05:46', 1, 5, 9)
);

// -------------- ALBUM #6 --------------
const album6 = new Album(
  6,
  '01040106',
  'Outer Corners',
  'https://storage.googleapis.com/ip-public-bucket1/Outer-Corners/6_OUTER-CORNERS.png',
  'February 15, 2022',
  'March 25, 2022',
  1,
  'All Sound & Composition: Roderick Shoolbraid.<br>Cover Art, Photography & Design: Roderick Shoolbraid.<br> &copy;All Rights Reserved.',
  'Music for the stars and beyond. Started in late 2021, completed in 2022.',
  7
);
albums.push(album6);
artist1.albums.push(album6);

// Songs for Album 6
album6.songs.push(
  new Song('0601', 'Stars', 'https://storage.googleapis.com/ip-public-bucket1/Outer-Corners/STARS.mp3', '06:23', 1, 6, 1),
  new Song('0602', 'Galaxies', 'https://storage.googleapis.com/ip-public-bucket1/Outer-Corners/GALAXIES.mp3', '05:49', 1, 6, 2),
  new Song('0603', 'Dimensions', 'https://storage.googleapis.com/ip-public-bucket1/Outer-Corners/DIMENSIONS.mp3', '02:25', 1, 6, 3),
  new Song('0604', 'Nebulae', 'https://storage.googleapis.com/ip-public-bucket1/Outer-Corners/NEBULAE.mp3', '04:54', 1, 6, 4),
  new Song('0605', 'Galactic Cosmic Rays', 'https://storage.googleapis.com/ip-public-bucket1/Outer-Corners/GALACTIC-COSMIC-RAYS.mp3', '07:34', 1, 6, 5),
  new Song('0606', 'Quantum', 'https://storage.googleapis.com/ip-public-bucket1/Outer-Corners/QUANTUM.mp3', '05:40', 1, 6, 6),
  new Song('0607', 'Stellar', 'https://storage.googleapis.com/ip-public-bucket1/Outer-Corners/STELLAR.mp3', '05:38', 1, 6, 7)
);

// -------------- ALBUM #7 --------------
const album7 = new Album(
  7,
  '01040107',
  'Nonagon',
  'https://storage.googleapis.com/ip-public-bucket1/Nonagon/7_NONAGON.png',
  'May 15, 2022',
  'June 14, 2022',
  1,
  'All Sound, production & Composition: <br>Roderick Shoolbraid <br> Cover design: Roderick Shoolbraid <br> &copy;All Rights Reserved.',
  'Lines drawn by field recordings, manipulated and accompanied by guitars & bass. Coloured in by synths and reverb to show a space of the beauty of geometry. Sound sources from: 1996-7, 2003-15. Compiled and finished in summer 2022.',
  9
);
albums.push(album7);
artist1.albums.push(album7);

// Songs for Album 7
album7.songs.push(
  new Song('0701', 'Spherical', 'https://storage.googleapis.com/ip-public-bucket1/Nonagon/SPHERICAL.mp3', '05:00', 1, 7, 1),
  new Song('0702', 'Rhombus', 'https://storage.googleapis.com/ip-public-bucket1/Nonagon/RHOMBUS.mp3', '05:25', 1, 7, 2),
  new Song('0703', 'Triangular', 'https://storage.googleapis.com/ip-public-bucket1/Nonagon/TRIANGULAR.mp3', '03:58', 1, 7, 3),
  new Song('0704', 'Curvature', 'https://storage.googleapis.com/ip-public-bucket1/Nonagon/CURVATURE.mp3', '04:16', 1, 7, 4),
  new Song('0705', 'Nonagon', 'https://storage.googleapis.com/ip-public-bucket1/Nonagon/NONAGON.mp3', '04:13', 1, 7, 5),
  new Song('0706', 'Quadrants', 'https://storage.googleapis.com/ip-public-bucket1/Nonagon/QUADRANTS.mp3', '07:17', 1, 7, 6),
  new Song('0707', 'Dodecahedron', 'https://storage.googleapis.com/ip-public-bucket1/Nonagon/DODECAHEDRON.mp3', '06:05', 1, 7, 7),
  new Song('0708', 'Arc', 'https://storage.googleapis.com/ip-public-bucket1/Nonagon/ARC.mp3', '08:53', 1, 7, 8),
  new Song('0709', 'Vertices', 'https://storage.googleapis.com/ip-public-bucket1/Nonagon/VERTICES.mp3', '08:17', 1, 7, 9)
);

// -------------- ALBUM #8 --------------
const album8 = new Album(
  8,
  '01040108',
  'Ambient Garden One',
  'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/8_AMBIENTGARDENONE.png',
  'June 22, 2022',
  'June 22, 2022',
  1,
  'All Sound, production & Composition: <br>Roderick Shoolbraid <br> Cover design: Roderick Shoolbraid <br> &copy;All Rights Reserved.',
  'A curated collection of some favourite pieces from the present discography. Spanning 20 years 2002-2022, this exposition showcases the work from a variety of different artistic perspectives: Electronica, Drone, Minimalism, Polytonality and Free Jazz. <br>One is always a summary of influences. And in this compilation it is evident - an open letter to the history of electronic, electro-acoustic music and musique concrète. The appreciation for the natural world and Its interplay with the Astral.',
  14
);
albums.push(album8);
artist1.albums.push(album8);

// Songs for Album 8
album8.songs.push(
  new Song('0801', 'Stars | Outer Corners', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/STARS.mp3', '06:23', 1, 8, 1),
  new Song('0802', 'Waters | Natura', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/WATERS.mp3', '05:46', 1, 8, 2),
  new Song('0803', 'Caterpillar | Glass City of Us', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/CATERPILLAR.mp3', '06:43', 1, 8, 3),
  new Song('0804', 'Flower | Natura', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/FLOWER.mp3', '03:45', 1, 8, 4),
  new Song('0805', 'Beaches | New Domes of Earth', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/BEACHES.mp3', '03:58', 1, 8, 5),
  new Song('0806', 'Perfumed Letter | Charlotta', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/PERFUMED-LETTER.mp3', '04:48', 1, 8, 6),
  new Song('0807', 'Stellar | Outer Corners', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/STELLAR.mp3', '05:38', 1, 8, 7),
  new Song('0808', 'Dawn for Children | New Domes of Earth', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/DAWN-FOR-CHILDREN.mp3', '04:29', 1, 8, 8),
  new Song('0809', 'Optical Record Pipe | Glass City of Us', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/OPTICAL-RECORD-PIPE.mp3', '07:44', 1, 8, 9),
  new Song('0810', 'Nonagon | Nonagon', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/NONAGON.mp3', '04:13', 1, 8, 10),
  new Song('0811', 'V | Objects & Particles', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/V.mp3', '06:54', 1, 8, 11),
  new Song('0812', 'Arc | Nonagon', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/ARC.mp3', '08:53', 1, 8, 12),
  new Song('0813', 'Jade Flower Memory Index | Objects & Particles', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/JADE-FLOWER-MEMORY-INDEX.mp3', '06:14', 1, 8, 13),
  new Song('0814', 'Charlotta | Charlotta', 'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-One/CHARLOTTA.mp3', '08:19', 1, 8, 14)
);

// -------------- ALBUM #9 --------------
const album9 = new Album(
  9,
  '01040109',
  'Music for Seven Structures',
  'https://storage.googleapis.com/ip-public-bucket1/Music-For-Seven-Structures/9_7STRUCTURES.png',
  'June 1, 2022',
  'June 28, 2022',
  1,
  'All Sound & Composition: Roderick Shoolbraid<br> Cover design: Roderick Shoolbraid <br> &copy;All Rights Reserved.',
  'A simple minimal album exploring the images of places and structures that came to mind, while designing & demoing the synth patches created for Nonagon. Written from May to June 2022.',
  7
);
albums.push(album9);
artist1.albums.push(album9);

// Songs for Album 9
album9.songs.push(
  new Song('0901', 'I', 'https://storage.googleapis.com/ip-public-bucket1/Music-For-Seven-Structures/STRUCTURE-1.mp3', '06:51', 1, 9, 1),
  new Song('0902', 'II', 'https://storage.googleapis.com/ip-public-bucket1/Music-For-Seven-Structures/STRUCTURE-2.mp3', '04:32', 1, 9, 2),
  new Song('0903', 'III', 'https://storage.googleapis.com/ip-public-bucket1/Music-For-Seven-Structures/STRUCTURE-3.mp3', '04:47', 1, 9, 3),
  new Song('0904', 'IV', 'https://storage.googleapis.com/ip-public-bucket1/Music-For-Seven-Structures/STRUCTURE-4.mp3', '02:41', 1, 9, 4),
  new Song('0905', 'V', 'https://storage.googleapis.com/ip-public-bucket1/Music-For-Seven-Structures/STRUCTURE-5.mp3', '05:39', 1, 9, 5),
  new Song('0906', 'VI', 'https://storage.googleapis.com/ip-public-bucket1/Music-For-Seven-Structures/STRUCTURE-6.mp3', '06:53', 1, 9, 6),
  new Song('0907', 'VII', 'https://storage.googleapis.com/ip-public-bucket1/Music-For-Seven-Structures/STRUCTURE-7.mp3', '06:58', 1, 9, 7)
);

// -------------- ALBUM #10 --------------
const album10 = new Album(
  10,
  '01040110',
  'Inner Moments of Light',
  'https://storage.googleapis.com/ip-public-bucket1/Inner-Moment-of-Light/10_INNER-MOMENTS.png',
  'November 15, 2015',
  'July 9, 2022',
  1,
  'All Music & Sound: Roderick Shoolbraid <br> Cover Design: Roderick Shoolbraid <br> &copy;All Rights Reserved.',
  'A collection or curation of assorted tracks from 2003-2015. With some source files going back as far as 1996-7. Organized finally in a little volume of what I like to think of as sacred or holy music, music or sound for meditation into specific spaces, or at least it is what it is for me. Everyone will have their own experience of the ambient medicinal sounds, finding itself roots in Minimalism, Drone, Noise, & Lo Fi. This was my original intent behind the contemplative sound, and music I created, whether I am successful, I leave that in your hands and your mind.',
  9
);
albums.push(album10);
artist1.albums.push(album10);

// Songs for Album 10
album10.songs.push(
  new Song('1001', 'Moment of Light', 'https://storage.googleapis.com/ip-public-bucket1/Inner-Moment-of-Light/MOMENT-OF-LIGHT.mp3', '04:34', 1, 10, 1),
  new Song('1002', 'Landscape II', 'https://storage.googleapis.com/ip-public-bucket1/Inner-Moment-of-Light/LANDSCAPE-II.mp3', '03:00', 1, 10, 2),
  new Song('1003', 'Prisms', 'https://storage.googleapis.com/ip-public-bucket1/Inner-Moment-of-Light/PRISMS.mp3', '08:08', 1, 10, 3),
  new Song('1004', 'Sphere', 'https://storage.googleapis.com/ip-public-bucket1/Inner-Moment-of-Light/SPHERE.mp3', '12:44', 1, 10, 4),
  new Song('1005', 'Beauty of the Heart', 'https://storage.googleapis.com/ip-public-bucket1/Inner-Moment-of-Light/BEAUTY-OF-THE-HEART.mp3', '04:13', 1, 10, 5),
  new Song('1006', 'Beginnings', 'https://storage.googleapis.com/ip-public-bucket1/Inner-Moment-of-Light/BEGININGS.mp3', '06:53', 1, 10, 6),
  new Song('1007', 'Landscape I', 'https://storage.googleapis.com/ip-public-bucket1/Inner-Moment-of-Light/LANDCSCAPE-I.mp3', '03:19', 1, 10, 7),
  new Song('1008', 'Universal Knowledge', 'https://storage.googleapis.com/ip-public-bucket1/Inner-Moment-of-Light/UNIVERSAL-KNOWLEDGE.mp3', '04:25', 1, 10, 8),
  new Song('1009', 'Love is the Universe', 'https://storage.googleapis.com/ip-public-bucket1/Inner-Moment-of-Light/LOVE-IS-THE-UNIVERSE.mp3', '04:27', 1, 10, 9)
);

// -------------- ALBUM #11 --------------
const album11 = new Album(
  11,
  '01040111',
  'Nocturnes & Reveries',
  'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/11_NOCTURNES-REVERIES.png',
  'August 23, 2022',
  'September 3, 2023',
  1,
  'All Sound & Composition: Roderick Shoolbraid. <br>Cover Design: Roderick Shoolbraid. <br>Painting: <em>"Nocturnes"</em> - Roderick Shoolbraid. <br> &copy;All Rights Reserved.',
  'A collection of 15 compositions, experiments and musings; all centred around night scenes, dreams, the mystical, and the subconscious. Using more challenging approach to scales and harmony, the album is influenced by Olivier Messiaen, György Ligeti, Gurdjieff, Sufi and Eastern Music.',
  15
);
albums.push(album11);
artist1.albums.push(album11);

// Songs for Album 11
album11.songs.push(
  new Song('1101', 'Moon above the Sea', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Moon-above-the-Sea.mp3', '06:46', 1, 11, 1),
  new Song('1102', 'Starlight through Trees', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Starlight-through-Trees.mp3', '09:40', 1, 11, 2),
  new Song('1103', 'Garden', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Garden.mp3', '04:31', 1, 11, 3),
  new Song('1104', 'Animals of the Night', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Animals-of-the-Night.mp3', '06:09', 1, 11, 4),
  new Song('1105', 'Moon Gate', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Moon-Gate.mp3', '06:49', 1, 11, 5),
  new Song('1106', 'Obelisk', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Obelisk.mp3', '08:42', 1, 11, 6),
  new Song('1107', 'Bardo', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Bardo.mp3', '07:06', 1, 11, 7),
  new Song('1108', 'Eyes open at the Cusp of Dawn', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Eyes-open-at-the-Cusp-of-Dawn.mp3', '05:36', 1, 11, 8),
  new Song('1109', 'Selene', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Selene.mp3', '04:54', 1, 11, 9),
  new Song('1110', 'Charon', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Charon.mp3', '06:08', 1, 11, 10),
  new Song('1111', 'Night Music', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Night-Music.mp3', '07:07', 1, 11, 11),
  new Song('1112', 'Lunar Eclipse', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Lunar-Eclipse.mp3', '04:44', 1, 11, 12),
  new Song('1113', 'Nocturnes & Reveries', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Nocturnes-and-Reveries.mp3', '09:20', 1, 11, 13),
  new Song('1114', 'Beyond the Veils', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Beyond-the-Veils.mp3', '07:08', 1, 11, 14),
  new Song('1115', 'Morning Light', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Morning-Light.mp3', '06:28', 1, 11, 15)
);

// -------------- ALBUM #12 --------------
const album12 = new Album(
  12,
  '01040112',
  'Prefabrication',
  'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/12_PREFABRICATION.png',
  'December 15, 2022',
  'January 24, 2023',
  1,
  'All Sound & Composition: Roderick Shoolbraid <br> Cover Design: Roderick Shoolbraid <br> &copy;All Rights Reserved.',
  '"Prefabrication" is an album that builds on the concept of Music for Seven Structures, it uses one central melodic passage interpreted from 10 different viewpoints.' +
  '<br>The motif is modified based on multiples of 4 and pitch in octaves, creating a library of relative sounds. These sounds are arranged together in patterns and structures using a fixed tempo of 120 bpm throughout the albums 10 pieces.' +
  '<br> Predetermined edits and automation of effects are done to a grid to create an environment of chance. After this "prefabrication" stage, a more detailed finish is applied , drawing from the lexicon of modern electronica and IDM.' +
  '<br>The album is intended to be a collection of remixes on the subject of the experience of being inside a simple minimalist designed building.',
  10
);
albums.push(album12);
artist1.albums.push(album12);

// Songs for Album 12
album12.songs.push(
  new Song('1201', 'Prefabrication', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/PREFABRICATION.mp3', '06:15', 1, 12, 1),
  new Song('1202', 'Construct', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/CONSTRUCT.mp3', '06:24', 1, 12, 2),
  new Song('1203', 'Euclid', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/EUCLID.mp3', '08:14', 1, 12, 3),
  new Song('1204', 'Quadrangle', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/QUADRANGLE.mp3', '07:49', 1, 12, 4),
  new Song('1205', 'Open Concept', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/OPEN-CONCEPT.mp3', '08:00', 1, 12, 5),
  new Song('1206', 'Three Over One', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/THREE-OVER-ONE.mp3', '08:58', 1, 12, 6),
  new Song('1207', 'Schematic', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/SCHEMATIC.mp3', '04:04', 1, 12, 7),
  new Song('1208', 'Sequences', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/SEQUENCES.mp3', '05:59', 1, 12, 8),
  new Song('1209', 'A Noble Plan for a Good Idea', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/A-NOBLE-PLAN-FOR-A-GOOD-IDEA.mp3', '03:22', 1, 12, 9),
  new Song('1210', 'Formulations', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/FORMULATIONS.mp3', '07:48', 1, 12, 10)
);

// -------------- ALBUM #13 --------------
const album13 = new Album(
  13,
  '01040113',
  'Vagary',
  'https://storage.googleapis.com/ip-public-bucket1/Vagary/13_VAGARY.png',
  'January 15, 2023',
  'February 11, 2023',
  1,
  'All Sound & Composition: Roderick Shoolbraid <br> Cover Design: Roderick Shoolbraid <br> &copy;All Rights Reserved.',
  'A series of 8 tone poems on the inward experience of my healing journey.  Written over a course of 6 months from 2022, to the following year.',
  8
);
albums.push(album13);
artist1.albums.push(album13);

// Songs for Album 13
album13.songs.push(
  new Song('1301', 'I- When the Observer becomes the observed', 'https://storage.googleapis.com/ip-public-bucket1/Vagary/I-When-the-Observer-becomes-the-Observed.mp3', '09:06', 1, 13, 1),
  new Song('1302', 'II- We all look inward to the Multiverse', 'https://storage.googleapis.com/ip-public-bucket1/Vagary/II-We-all-look-inward-to-the-Multiverse.mp3', '06:32', 1, 13, 2),
  new Song('1303', 'III- Axons to the Void', 'https://storage.googleapis.com/ip-public-bucket1/Vagary/III-Axons-to-the-Void.mp3', '07:18', 1, 13, 3),
  new Song('1304', 'IV- The embrace of Mountains & the Skies', 'https://storage.googleapis.com/ip-public-bucket1/Vagary/IV-The-Embrace-of-Mountains-and-the-Skies.mp3', '09:08', 1, 13, 4),
  new Song('1305', 'V- Crucibles', 'https://storage.googleapis.com/ip-public-bucket1/Vagary/V-Crucibles.mp3', '12:27', 1, 13, 5),
  new Song('1306', 'VI- What lies beyond That which you Think You Understand?', 'https://storage.googleapis.com/ip-public-bucket1/Vagary/VI-What-lies-beyond-That-which-you-Think-You-Understand.mp3', '13:41', 1, 13, 6),
  new Song('1307', 'VII- Pathologies', 'https://storage.googleapis.com/ip-public-bucket1/Vagary/VII-Pathologies.mp3', '04:36', 1, 13, 7),
  new Song('1308', 'VIII- The Crescent of Ascension', 'https://storage.googleapis.com/ip-public-bucket1/Vagary/VIII-The-Crescent-of-Ascension.mp3', '16:37', 1, 13, 8)
);

// -------------- ALBUM #14 --------------
const album14 = new Album(
  14,
  '01040114',
  'Amsterdam Concreet',
  'https://storage.googleapis.com/ip-public-bucket1/Amsterdam-Concreet/14_AMSTERDAM-CONCREET.png',
  'February 15, 2023',
  'February 20, 2023',
  1,
  'All Sound & Composition: Roderick Shoolbraid <br>Location recording: (Exhibit A,B,C1-3): <br>Tanya Slingsby & Dylan Armour <br>Principal Cover photography: Dylan Armour <br> Cover Design: Roderick Shoolbraid <br> &copy;All Rights Reserved.',
  '"Found Sound" and location recordings from Amsterdam, processed and layered. Compiled in collages and atmospheres, as a portal to introspective travel.',
  9
);
albums.push(album14);
artist1.albums.push(album14); 

// Songs for Album 14
album14.songs.push(
  new Song('1401', 'EXHIBIT A', 'https://storage.googleapis.com/ip-public-bucket1/Amsterdam-Concreet/EXHIBIT-A.mp3', '06:40', 1, 14, 1),
  new Song('1402', 'EXHIBIT B', 'https://storage.googleapis.com/ip-public-bucket1/Amsterdam-Concreet/EXHIBIT-B.mp3', '10:42', 1, 14, 2),
  new Song('1403', 'EXHIBIT C1', 'https://storage.googleapis.com/ip-public-bucket1/Amsterdam-Concreet/EXHIBIT-C1.mp3', '08:39', 1, 14, 3),
  new Song('1404', 'EXHIBIT C2', 'https://storage.googleapis.com/ip-public-bucket1/Amsterdam-Concreet/EXHIBIT-C2.mp3', '03:19', 1, 14, 4),
  new Song('1405', 'EXHIBIT C3', 'https://storage.googleapis.com/ip-public-bucket1/Amsterdam-Concreet/EXHIBIT-C3.mp3', '05:27', 1, 14, 5),
  new Song('1406', 'EXHIBIT D', 'https://storage.googleapis.com/ip-public-bucket1/Amsterdam-Concreet/EXHIBIT-D.mp3', '07:24', 1, 14, 6),
  new Song('1407', 'EXHIBIT E', 'https://storage.googleapis.com/ip-public-bucket1/Amsterdam-Concreet/EXHIBIT-E.mp3', '08:36', 1, 14, 7),
  new Song('1408', 'EXHIBIT F', 'https://storage.googleapis.com/ip-public-bucket1/Amsterdam-Concreet/EXHIBIT-F.mp3', '08:34', 1, 14, 8),
  new Song('1409', 'EXHIBIT G', 'https://storage.googleapis.com/ip-public-bucket1/Amsterdam-Concreet/EXHIBIT-G.mp3', '09:28', 1, 14, 9)
);

// -------------- ALBUM #15 --------------
const album15 = new Album(
  15,
  '01040115',
  'Watercolours for Friends',
  'https://storage.googleapis.com/ip-public-bucket1/Watercolours-for-Friends/15_WATERCOLOURS.png',
  'March 20, 2023',
  'March 24, 2023',
  1,
  'All Sound & Composition: Roderick Shoolbraid <br> Cover Design: Roderick Shoolbraid...',
  'This album was a response creatively to the large project and emotionally requiring: VAGARY. WATERCOLOURS FOR FRIENDS was a return to a more simple melodic structure and production values of my first releases. <br>With that in mind, I used sound sources and instruments from my first few years at sound design collage from 2002-3, with a view to create a minimalist palette. <br>A wonderful friend had remarked that though she appreciated the foreboding, emotional gravity and unsettling nature of VAGARY and other work, it was pieces like "Spherical" of NONAGON that she liked. As she could do other things and be in the space with the music.<br>These comments greatly influenced the composition and structure of the sound, treating them like large rooms of watercolour paintings that one could be inside.',
  7
);
albums.push(album15);
artist1.albums.push(album15);

// Songs for Album 15
album15.songs.push(
  new Song('1501', 'Breakfasts', 'https://storage.googleapis.com/ip-public-bucket1/Watercolours-for-Friends/BREAKFASTS.mp3', '10:28', 1, 15, 1),
  new Song('1502', 'Astral Conversion', 'https://storage.googleapis.com/ip-public-bucket1/Watercolours-for-Friends/ASTRAL-CONVERSION.mp3', '05:40', 1, 15, 2),
  new Song('1503', 'Clouds for Two', 'https://storage.googleapis.com/ip-public-bucket1/Watercolours-for-Friends/CLOUDS-FOR-TWO.mp3', '05:30', 1, 15, 3),
  new Song('1504', 'Artwork of Children', 'https://storage.googleapis.com/ip-public-bucket1/Watercolours-for-Friends/ARTWORK-OF-CHILDREN.mp3', '06:20', 1, 15, 4),
  new Song('1505', 'Robot\'s Dream', 'https://storage.googleapis.com/ip-public-bucket1/Watercolours-for-Friends/ROBOTS-DREAM.mp3', '07:51', 1, 15, 5),
  new Song('1506', 'Spatial Recognition', 'https://storage.googleapis.com/ip-public-bucket1/Watercolours-for-Friends/SPATIAL-RECOGNITION.mp3', '05:56', 1, 15, 6),
  new Song('1507', 'Memories of Forgotten Places', 'https://storage.googleapis.com/ip-public-bucket1/Watercolours-for-Friends/MEMORIES-OF-FORGOTTEN-PLACES.mp3', '09:08', 1, 15, 7)
);

// -------------- ALBUM #16 --------------
const album16 = new Album(
  16,
  '01040116',
  'Postcards from Old Sounds',
  'https://storage.googleapis.com/ip-public-bucket1/Postcards-From-Old-Sounds/16_POSTACARDS-OLD-SOUNDS.png',
  'April 20, 2023',
  'April 30, 2023',
  1,
  'All Sound & Composition: Roderick Shoolbraid <br> Cover Design: Roderick Shoolbraid <br>Photography: Roderick Shoolbraid...',
  '“Postcards from Old Sounds” is a continuation from “Watercolours For Friends” in its approach to harmony and sound design. <br>Using a long form minimalist structure, the idea is: that these small sounds from the early 2000s are carried forward into the present palette and shaped with modern tools. <br>Telling us stories of where they have been. It was written in tandem with "Watercolours.." in the spring of 2023.',
  5
);
albums.push(album16);
artist1.albums.push(album16);

// Songs for Album 16
album16.songs.push(
  new Song('1601', 'Polarity', 'https://storage.googleapis.com/ip-public-bucket1/Postcards-From-Old-Sounds/POLARITY.mp3', '11:18', 1, 16, 1),
  new Song('1602', 'Celestial Drum', 'https://storage.googleapis.com/ip-public-bucket1/Postcards-From-Old-Sounds/CELESTIAL-DRUM.mp3', '09:36', 1, 16, 2),
  new Song('1603', 'Crystal Heart', 'https://storage.googleapis.com/ip-public-bucket1/Postcards-From-Old-Sounds/CRYSTAL-HEART.mp3', '10:48', 1, 16, 3),
  new Song('1604', 'Old Machines', 'https://storage.googleapis.com/ip-public-bucket1/Postcards-From-Old-Sounds/OLD-MACHINES.mp3', '04:55', 1, 16, 4),
  new Song('1605', 'Postcards from Old sounds', 'https://storage.googleapis.com/ip-public-bucket1/Postcards-From-Old-Sounds/POSTCARDS-FROM-OLD-SOUNDS.mp3', '13:06', 1, 16, 5)
);

// -------------- ALBUM #17 --------------
const album17 = new Album(
  17,
  '01040117',
  'Sakura',
  'https://storage.googleapis.com/ip-public-bucket1/Sakura/17_SAKURA.png',
  'June 15, 2023',
  'June 19, 2023',
  1,
  'All Sound & Instruments: Roderick Shoolbraid. <br> Cover Design: Roderick Shoolbraid...',
  `One starts with no real intentions sometimes, and after awhile the idea formulates and direction emerges. Such was the case with "SAKURA". <br>Written during April and May of this year, 2023, the materials gathered from improvised sessions were interludes between the walks along the seaside, where the blossoms fell from the trees.
<br>All of this reminded me of the visit I had to Japan for 6 months in 1998-1999. I had been listening to a lot of city pop over the winter, and thinking about my good late friend Peter Stufano. I decided to use all of this as a starting point.
<br>I had a small library of samples of my friend playing several instruments: tabla, dumbek, kalimba, and flute; and these became the sources in sampler instruments for the melodies. <br>I used location recordings of the walks along the sea and record skips from the end of the city pop & Japanese jazz records I was listening to as a backdrop. <br>The piano samples are from public outdoor instrument recorded a couple years ago, and the guitar work was completed this month.
These are the materials used to create the sonic paintings of my memories, please enjoy & thank you for listening.
-Roderick`,
  7
);
albums.push(album17);
artist1.albums.push(album17);

// Songs for Album 17
album17.songs.push(
  new Song('1701', 'Asa no Tori', 'https://storage.googleapis.com/ip-public-bucket1/Sakura/Asa-no-Tori.mp3', '07:49', 1, 17, 1),
  new Song('1702', 'Night Tunnel to Tokyo', 'https://storage.googleapis.com/ip-public-bucket1/Sakura/Night-Tunnel-to-Tokyo.mp3', '07:40', 1, 17, 2),
  new Song('1703', '5 Rings', 'https://storage.googleapis.com/ip-public-bucket1/Sakura/5-Rings.mp3', '05:16', 1, 17, 3),
  new Song('1704', 'A Dream of Rain & Blossoms', 'https://storage.googleapis.com/ip-public-bucket1/Sakura/A-Dream-of-Rain-and-Blossoms.mp3', '05:46', 1, 17, 4),
  new Song('1705', 'Izakaya', 'https://storage.googleapis.com/ip-public-bucket1/Sakura/Izakaya.mp3', '05:14', 1, 17, 5),
  new Song('1706', 'Hanzo Blues', 'https://storage.googleapis.com/ip-public-bucket1/Sakura/Hanzo-Blues.mp3', '04:47', 1, 17, 6),
  new Song('1707', 'Yamanote', 'https://storage.googleapis.com/ip-public-bucket1/Sakura/Yamanote.mp3', '08:05', 1, 17, 7)
);

// -------------- ALBUM #18 --------------
const album18 = new Album(
  18,
  '01040118',
  'Poem for a Homeworld',
  'https://storage.googleapis.com/ip-public-bucket1/Poem-For-A-Homeworld/18_POEM-HOMEWORLD.png',
  'October 20, 2023',
  'October 25, 2023',
  1,
  `All Sound & Instruments: Roderick Shoolbraid<br> 
Voice sample on track #1: Lynn Demers<br> 
Voice sample on track #7: Lovina Lakatua <br>
Vocal on track #7: Ruby Lakatua<br>
Cover Design: Roderick Shoolbraid<br> 
&copy;All Rights Reserved.`,
  `A cascade of experiences, a free fall into pulp science fiction of singular memory, set against 1990s electronic music’s landscape & language. <em>What is the plot summary for our protagonist? </em>Only the environments know. <br>Written over 7 months pulling from reservoirs of old and new sounds: <em>"Poem for a Homeworld"</em> has a history of its own. <br>Where are we in the index of portals? "Have I not been here before?" asks the lone traveller as all paths lead back to the beginning of the contemplations: <br><br>"Am I alone? If I am alone in the universe, am I then not alone? If I am held in the embrace of the expanse of the universe?" <br><br>These are the questions and revelations of our story, painted in the colours and reference of nostalgia.
A lament from a distant future, a chaos of remembrance; an understanding that all time exists at once, on the cusp of the Void. A narrative set against the abstracted lexicon of 90s ambient drum & bass on a bed of watercolours of experiments. Completed by the fall of 2023.`,
  15
);
albums.push(album18);
artist1.albums.push(album18);

// Songs for Album 18
album18.songs.push(
  new Song('1801', 'Ocean Holiday Simulation', 'https://storage.googleapis.com/ip-public-bucket1/Poem-For-A-Homeworld/Ocean-Holiday-Simulation.mp3', '06:41', 1, 18, 1),
  new Song('1802', 'Journey home to Base One', 'https://storage.googleapis.com/ip-public-bucket1/Poem-For-A-Homeworld/Journey-home-to-Base-One.mp3', '06:16', 1, 18, 2),
  new Song('1803', 'Solarium at Base Two', 'https://storage.googleapis.com/ip-public-bucket1/Poem-For-A-Homeworld/Solarium-at-Base-Two.mp3', '05:13', 1, 18, 3),
  new Song('1804', 'Code for Robots', 'https://storage.googleapis.com/ip-public-bucket1/Poem-For-A-Homeworld/Code-for-Robots.mp3', '05:08', 1, 18, 4),
  new Song('1805', 'Bouquet against the Blackness of Space', 'https://storage.googleapis.com/ip-public-bucket1/Poem-For-A-Homeworld/Bouquet-against-the-Blackness-of-Space.mp3', '03:52', 1, 18, 5),
  new Song('1806', 'Poem for a Homeworld', 'https://storage.googleapis.com/ip-public-bucket1/Poem-For-A-Homeworld/Poem-for-a-Homeworld.mp3', '09:37', 1, 18, 6),
  new Song('1807', 'Heirlooms of 1999 (Featuring: Ruby Lakatua)', 'https://storage.googleapis.com/ip-public-bucket1/Poem-For-A-Homeworld/Heirlooms-of-1999.mp3', '07:09', 1, 18, 7),
  new Song('1808', 'The Colours of Beyond', 'https://storage.googleapis.com/ip-public-bucket1/Poem-For-A-Homeworld/The-Colours-of-Beyond.mp3', '07:44', 1, 18, 8),
  new Song('1809', 'Biospheres', 'https://storage.googleapis.com/ip-public-bucket1/Poem-For-A-Homeworld/Biospheres.mp3', '05:04', 1, 18, 9),
  new Song('1810', 'Lone Galaxies', 'https://storage.googleapis.com/ip-public-bucket1/Poem-For-A-Homeworld/Lone-Galaxies.mp3', '09:30', 1, 18, 10),
  new Song('1811', 'Stars of Origin', 'https://storage.googleapis.com/ip-public-bucket1/Poem-For-A-Homeworld/Stars-of-Origin.mp3', '04:49', 1, 18, 11),
  new Song('1812', 'Cryostasis', 'https://storage.googleapis.com/ip-public-bucket1/Poem-For-A-Homeworld/Cryostasis.mp3', '05:48', 1, 18, 12),
  new Song('1813', 'Sailboat to the Sun', 'https://storage.googleapis.com/ip-public-bucket1/Poem-For-A-Homeworld/Sailboat-to-the-Sun.mp3', '06:02', 1, 18, 13),
  new Song('1814', 'Event Horizon of the Self', 'https://storage.googleapis.com/ip-public-bucket1/Poem-For-A-Homeworld/Event-Horizon-of-the-Self.mp3', '04:47', 1, 18, 14),
  new Song('1815', 'Epilogues', 'https://storage.googleapis.com/ip-public-bucket1/Poem-For-A-Homeworld/Epilogues.mp3', '05:18', 1, 18, 15)
);

// -------------- ALBUM #19 --------------
const album19 = new Album(
  19,
  '01040119',
  'Rhombus',
  'https://storage.googleapis.com/ip-public-bucket1/Rhombus/19_RHOMBUS.png',
  'December 15, 2023',
  'January 1, 2024',
  1,
  `All Sound & Music: Roderick Shoolbraid<br>
  Words: Roderick Shoolbraid <br>*except for "Art District" : Lovina Lakatua<br>
  Vocal Samples All other tracks: Roderick Shoolbraid<br>

  "Art District" :<br>
  Vocal sample provided by: Lovina Lakatua<br>

  "A window is a Friend of Rain" :<br>
  Vocal sample provided by: Lovina & Ruby Lakatua<br>

  Cover:<br>
  Original Art: Kristin Shoolbraid<br>
  Processing and Cover design: Roderick Shoolbraid<br>
  &copy;All Rights Reserved.`,
  `Written in 2023, "Rhombus" was a brief break away from "Poem For a Homeworld". It revealed itself a collection of sounds distilled into larger ideas. 
  <br>I had been learning about and working with AI, and the following assortment of music reflects this exploration, and the deeper meaning behind it all. 
  <br>It is written in lamenting tone, similar to "Poem...", but its more immediate in its time scale and locale. 
  <br>A strange new future awaits us I am sure, these are the meditations on those themes.`,
  10
);
albums.push(album19);
artist1.albums.push(album19);

// Songs for Album 19
album19.songs.push(
  new Song('1901', 'Origami', 'https://storage.googleapis.com/ip-public-bucket1/Rhombus/Origami.mp3', '05:34', 1, 19, 1),
  new Song('1902', 'A Beautiful Design', 'https://storage.googleapis.com/ip-public-bucket1/Rhombus/A-Beautiful-Design.mp3', '07:44', 1, 19, 2),
  new Song('1903', 'The Conduit', 'https://storage.googleapis.com/ip-public-bucket1/Rhombus/The-Conduit.mp3', '06:12', 1, 19, 3),
  new Song('1904', 'A Letter to Rhombus from a Square', 'https://storage.googleapis.com/ip-public-bucket1/Rhombus/A-Letter-to-Rhombus-from-a-Square.mp3', '05:24', 1, 19, 4),
  new Song('1905', 'Of Conté & Shade', 'https://storage.googleapis.com/ip-public-bucket1/Rhombus/Of-Conte-and-Shade.mp3', '03:56', 1, 19, 5),
  new Song('1906', 'A Window is a Friend of Rain', 'https://storage.googleapis.com/ip-public-bucket1/Rhombus/A-Window-is-a-Friend-of-Rain.mp3', '05:01', 1, 19, 6),
  new Song('1907', 'Sunrise in Primary Colors', 'https://storage.googleapis.com/ip-public-bucket1/Rhombus/Sunrise-In-Primary-Colors.mp3', '04:02', 1, 19, 7),
  new Song('1908', 'Penumbra', 'https://storage.googleapis.com/ip-public-bucket1/Rhombus/Penumbra.mp3', '06:59', 1, 19, 8),
  new Song('1909', 'Tree of Thought', 'https://storage.googleapis.com/ip-public-bucket1/Rhombus/Tree-of-Thought.mp3', '08:05', 1, 19, 9),
  new Song('1910', 'Art District', 'https://storage.googleapis.com/ip-public-bucket1/Rhombus/Art-District.mp3', '07:05', 1, 19, 10)
);

// -------------- ALBUM #20 --------------
const album20 = new Album(
  20,
  '01040120',
  'Vignettes of Clouds',
  'https://storage.googleapis.com/ip-public-bucket1/Vignettes-of-Clouds/20_Vignettes-of-Clouds.png',
  'April 15, 2024',
  'May 23, 2024',
  1,
  `All Sound & Instruments : Roderick Shoolbraid <br>Cover Design: Roderick Shoolbraid <br> &copy;All Rights Reserved.`,
  `Inconsistently written over a period of 14 months (from: March 2023 to May 2024), - a collection of out-takes, or experiments; 
  eventually became the foundation for a series of essays on the subject of 'clouds',and our relationship with them. 
  <br>Halfway through the album, adjunctive compositions emerged and the overall thesis for the curation was complete. 
  <br><br>There are different routes to the same conclusion, that the mesmerizing stories of our friends of the sky hold a sacred truth, and a portal to a great understanding. 
  `,
  12
);
albums.push(album20);
artist1.albums.push(album20);

// Songs for Album 20
album20.songs.push(
  new Song('2001', 'Clouds I', 'https://storage.googleapis.com/ip-public-bucket1/Vignettes-of-Clouds/Clouds-I.mp3', '09:04', 1, 20, 1),
  new Song('2002', 'Messages', 'https://storage.googleapis.com/ip-public-bucket1/Vignettes-of-Clouds/Messages.mp3', '07:44', 1, 20, 2),
  new Song('2003', 'Cumulus', 'https://storage.googleapis.com/ip-public-bucket1/Vignettes-of-Clouds/Cumulus.mp3', '03:38', 1, 20, 3),
  new Song('2004', 'Fractus', 'https://storage.googleapis.com/ip-public-bucket1/Vignettes-of-Clouds/Fractus.mp3', '05:36', 1, 20, 4),
  new Song('2005', 'A Cloud’s Poem to the Rain below', 'https://storage.googleapis.com/ip-public-bucket1/Vignettes-of-Clouds/A-Clouds-Poem-to-the-Rain-below.mp3', '05:52', 1, 20, 5),
  new Song('2006', 'Cloud Light above the Sea', 'https://storage.googleapis.com/ip-public-bucket1/Vignettes-of-Clouds/Cloud-Light-above-the-Sea.mp3', '03:46', 1, 20, 6),
  new Song('2007', 'Morning Clouds', 'https://storage.googleapis.com/ip-public-bucket1/Vignettes-of-Clouds/Morning-Clouds.mp3', '06:04', 1, 20, 7),
  new Song('2008', 'A Cloud’s visit to the Artist', 'https://storage.googleapis.com/ip-public-bucket1/Vignettes-of-Clouds/A-Clouds-visit-to-the-Artist.mp3', '02:48', 1, 20, 8),
  new Song('2009', 'Mountain Tops amongst the White', 'https://storage.googleapis.com/ip-public-bucket1/Vignettes-of-Clouds/Mountain-Tops-amongst-the-White.mp3', '02:48', 1, 20, 9),
  new Song('2010', 'Clouds and the City', 'https://storage.googleapis.com/ip-public-bucket1/Vignettes-of-Clouds/Mountain-Tops-amongst-the-White.mp3', '07:33', 1, 20, 10),
  new Song('2011', 'Formations', 'https://storage.googleapis.com/ip-public-bucket1/Vignettes-of-Clouds/Formations.mp3', '05:40', 1, 20, 11),
  new Song('2012', 'Clouds II', 'https://storage.googleapis.com/ip-public-bucket1/Vignettes-of-Clouds/Clouds-II.mp3', '04:34', 1, 20, 12),
);

// -------------- ALBUM #21 --------------
const album21 = new Album(
  21,
  '01040121',
  'JIKAN | Original Soundtrack',
  'https://storage.googleapis.com/ip-public-bucket1/Jikan/21_JIKAN.png',
  'April 15, 2016',
  'September 30, 2024',
  1,
  `All Sound, Composition & Music: Roderick Shoolbraid <br> &copy; All rights reserved`,
  `Original Soundtrack to the 35 minute 2016 film, "JIKAN" by Lynn Demers.`,
  12
);
albums.push(album21);
artist1.albums.push(album21);

// Songs for Album 21
album21.songs.push(
  new Song('2101', 'I: Abstraction & Landscape', 'https://storage.googleapis.com/ip-public-bucket1/Jikan/I-Abstraction-and-Landscape.mp3', '06:38', 1, 21, 1),
  new Song('2102', 'II: The Colour of Life', 'https://storage.googleapis.com/ip-public-bucket1/Jikan/II-The-Colour-of-Life.mp3', '06:16', 1, 21, 2),
  new Song('2103', 'III: The Sun of The Day', 'https://storage.googleapis.com/ip-public-bucket1/Jikan/III-The-Sun-of-The-Day.mp3', '04:07', 1, 21, 3),
  new Song('2104', 'IV: Rain of the Fall', 'https://storage.googleapis.com/ip-public-bucket1/Jikan/IV-The-Rain-of-the-Fall.mp3', '08:43', 1, 21, 4),
  new Song('2105', 'V: The Fire of Autumn', 'https://storage.googleapis.com/ip-public-bucket1/Jikan/V-The-Fire-of-Autumn.mp3', '05:13', 1, 21, 5),
  new Song('2106', 'VI: The Slumber of Snow', 'https://storage.googleapis.com/ip-public-bucket1/Jikan/VI-The-Slumber-of-Snow.mp3', '05:15', 1, 21, 6),
  new Song('2107', 'JIKAN: Continuous |Movements 1-6', 'https://storage.googleapis.com/ip-public-bucket1/Jikan/JIKAN-Continuous-Movements1-6.mp3', '36:12', 1, 21, 7),
  
);

// -------------- ALBUM #22 --------------
const album22 = new Album(
  22,
  '01040122',
  'Apocrypha',
  'https://storage.googleapis.com/ip-public-bucket1/Apocrypha/APOCRYPHA_Resize.png',
  'January 18, 2025',
  'January 18, 2025',
  1,
  `All Sound, Composition & Music: Roderick Shoolbraid <br> &copy; All rights reserved`,
  `
  There is a stillness in the wind, and the boat rounds the misty corner.  There is a quickening to the current, and the song of the water lapping up against the hull, starts to sing louder.  <br>
  A shard of light appears through the clouds.  A golden light and yet we know its not the sun.<br>
There is an understanding before one understands one has understood, and there is no container for the impression.  I wonder how the mathematics feel about that.  <br>
We are on the cusp of something and yet in the void.   <br>This Album was written over a long period of time, from 2023 until now. However there are parts which date back years, or even decades.  <br>
It is a solace to have this idea come to its completion.  
<br>I invite you to listen to the essays on the satori of the machines.
  `,
  15
);
albums.push(album22);
artist1.albums.push(album22);

// Songs for Album 22
album22.songs.push(
  new Song('2201', 'Apocrypha', 'https://storage.googleapis.com/ip-public-bucket1/Apocrypha/Apocrypha.mp3', '11:29', 1, 22, 1),
  new Song('2202', 'Hermitage', 'https://storage.googleapis.com/ip-public-bucket1/Apocrypha/Hermitage.mp3', '05:35', 1, 22, 2),
  new Song('2203', 'Decision Weight', 'https://storage.googleapis.com/ip-public-bucket1/Apocrypha/Decision-Weight.mp3', '04:07', 1, 22, 3),
  new Song('2204', 'Black Box', 'https://storage.googleapis.com/ip-public-bucket1/Apocrypha/Black-Box.mp3', '07:44', 1, 22, 4),
  new Song('2205', 'Compute', 'https://storage.googleapis.com/ip-public-bucket1/Apocrypha/Compute.mp3', '2:04', 1, 22, 5),
  new Song('2206', 'Data Tree', 'https://storage.googleapis.com/ip-public-bucket1/Apocrypha/Data-Tree.mp3', '04:18', 1, 22, 6),
  new Song('2207', 'Jacquard', 'https://storage.googleapis.com/ip-public-bucket1/Apocrypha/Jacquard.mp3', '05:50', 1, 22, 7),
  new Song('2208', 'To be watched amongst the Random Forest', 'https://storage.googleapis.com/ip-public-bucket1/Apocrypha/To-be-watched-amongst-the-Random-Forest.mp3', '07:00', 1, 22, 8),
  new Song('2209', 'Sigma', 'https://storage.googleapis.com/ip-public-bucket1/Apocrypha/Sigma.mp3', '08:39', 1, 22, 9),
  new Song('2210', 'Post Singularities', 'https://storage.googleapis.com/ip-public-bucket1/Apocrypha/Post-Singularities.mp3', '08:39', 1, 22, 10),
  new Song('2211', 'The City Beyond!', 'https://storage.googleapis.com/ip-public-bucket1/Apocrypha/The-City-Beyond!.mp3', '04:20', 1, 22,11),
  new Song('2212', 'Behold the Eyes that see though you', 'https://storage.googleapis.com/ip-public-bucket1/Apocrypha/Behold-the-Eyes-that-see-though-you.mp3', '05:20', 1, 22,12),
  new Song('2213', 'The Poems of Integers', 'https://storage.googleapis.com/ip-public-bucket1/Apocrypha/The-Poems-of-Integers.mp3', '03:49', 1, 22, 13),
  new Song('2214', 'Task:', 'https://storage.googleapis.com/ip-public-bucket1/Apocrypha/Task.mp3', '04:38', 1, 22, 14),
  new Song('2215', 'Abzu', 'https://storage.googleapis.com/ip-public-bucket1/Apocrypha/Abzu.mp3', '06:01', 1, 22, 15),
);

// -------------- ALBUM #23 --------------
const album23 = new Album(
  23,
  '01040123',
  'Ambient Garden Two',
  'https://storage.googleapis.com/ip-public-bucket1/Ambient-Garden-Two/AMBIENTGARDENTWOsm-v2.png',
  'February 13, 2025',
  'February 13, 2025',
  1,
  `All Sound, Composition & Music: Roderick Shoolbraid <br> &copy; All rights reserved`,
  `
  The Second curation of Roderick's work featuring a selection from each of his 14 albums released over the last 3 years.
  `,
  14
);
albums.push(album23);

artist1.albums.push(album23);

// Songs for Album 23
album23.songs.push(
  new Song('2301', 'IV | Music for Seven Structures', 'https://storage.googleapis.com/ip-public-bucket1/Music-For-Seven-Structures/STRUCTURE-4.mp3', '02:41', 1, 23, 1),
  new Song('2302', 'Moment of Light | Inner Moments of Light', 'https://storage.googleapis.com/ip-public-bucket1/Inner-Moment-of-Light/MOMENT-OF-LIGHT.mp3', '04:34', 1, 23, 2),
  new Song('2303', 'Beyond the Veils | Nocturnes & Reveries', 'https://storage.googleapis.com/ip-public-bucket1/Nocturnes-and-Reveries/Beyond-the-Veils.mp3', '07:08', 1, 23, 3),
  new Song('2304', 'Open Concept | Prefabrication', 'https://storage.googleapis.com/ip-public-bucket1/Prefabrication/OPEN-CONCEPT.mp3', '08:00', 1, 23, 4),
  new Song('2305', 'III- Axons to the Void | Vagary', 'https://storage.googleapis.com/ip-public-bucket1/Vagary/III-Axons-to-the-Void.mp3', '07:18', 1, 23, 5),
  new Song('2306', 'EXHIBIT C3 | Amsterdam Concreet', 'https://storage.googleapis.com/ip-public-bucket1/Amsterdam-Concreet/EXHIBIT-C3.mp3', '05:27', 1, 23, 6),
  new Song('2307', 'Artwork of Children | Watercolours for Friends', 'https://storage.googleapis.com/ip-public-bucket1/Watercolours-for-Friends/ARTWORK-OF-CHILDREN.mp3', '06:20', 1, 23, 7),
  new Song('2308', 'Celestial Drum | Postcards from Old Sounds', 'https://storage.googleapis.com/ip-public-bucket1/Postcards-From-Old-Sounds/CELESTIAL-DRUM.mp3', '09:36', 1, 23, 8),
  new Song('2309', 'Asa no Tori | Sakura', 'https://storage.googleapis.com/ip-public-bucket1/Sakura/Asa-no-Tori.mp3', '07:49', 1, 23, 9),
  new Song('2310', 'Bouquet against the Blackness of Space | Poem for a Homeworld', 'https://storage.googleapis.com/ip-public-bucket1/Poem-For-A-Homeworld/Bouquet-against-the-Blackness-of-Space.mp3', '03:52', 1, 23, 10),
  new Song('2311', 'Sunrise in Primary Colors | Rhombus', 'https://storage.googleapis.com/ip-public-bucket1/Rhombus/Sunrise-In-Primary-Colors.mp3', '04:02', 1, 23, 11),
  new Song('2312', 'A Cloud’s visit to the Artist | Vignettes of Clouds', 'https://storage.googleapis.com/ip-public-bucket1/Vignettes-of-Clouds/A-Clouds-visit-to-the-Artist.mp3', '02:48', 1, 23, 12),
  new Song('2313', 'VI: The Slumber of Snow | JIKAN | Original Soundtrack ', 'https://storage.googleapis.com/ip-public-bucket1/Jikan/VI-The-Slumber-of-Snow.mp3', '05:15', 1, 23, 13),
  new Song('2314', 'Abzu | APOCRYPHA', 'https://storage.googleapis.com/ip-public-bucket1/Apocrypha/Abzu.mp3', '06:01', 1, 23, 14),
  
);

// -------------- ALBUM #24 --------------
const album24 = new Album(
  24,
  '01040124',
  'Utopian',
  'https://storage.googleapis.com/ip-public-bucket1/UTOPIA/UTOPIAN-coverFINAL.png',
  'May 29, 2025',
  'May 29, 2025',
  1,
  `All Sound, Composition & Music: Roderick Shoolbraid <br> &copy; All rights reserved`,
  `
  An array of collections: Retrospective and Personal. <br> We all have moments where we are brought into the presence of our 'belief'; and then we are shown the Future. <br>It is in these moments that with the grand vision and vantage we can see clearly and it only forms a lament of mist on the windows of our history, hardened to frost by Time. <br>Every moment is a beautiful thing, and this is our dream in our Utopia. <br>Loops of noises, fluids of guitars, beats of old sounds... Linear timelines of thought at diagonal intersections, forms the Lattice of the conversations. <br>Written over the first part of 2025.
  `,
  18
);
albums.push(album24);

artist1.albums.push(album24);

// Songs for Album 24
album24.songs.push(
  new Song('2401', 'Lost Postcard', 'https://storage.googleapis.com/ip-public-bucket1/UTOPIA/Lost-Postcard.mp3', '03:52', 1, 24, 1),
  new Song('2402', 'Car to a known Place', 'https://storage.googleapis.com/ip-public-bucket1/UTOPIA/Car-to-a-known-Place.mp3', '06:12', 1, 24, 2),
  new Song('2403', 'Train of Memory', 'https://storage.googleapis.com/ip-public-bucket1/UTOPIA/Train-of-Memory.mp3', '05:14', 1, 24, 3),
  new Song('2404', 'Garden Light', 'https://storage.googleapis.com/ip-public-bucket1/UTOPIA/Garden-Light.mp3', '07:32', 1, 24, 4),
  new Song('2405', 'Mutual Sunrise', 'https://storage.googleapis.com/ip-public-bucket1/UTOPIA/Mutual-Sunrise.mp3', '05:12', 1, 24, 5),
  new Song('2406', 'A distant Cloud says Hello', 'https://storage.googleapis.com/ip-public-bucket1/UTOPIA/A-distant-Cloud-says-Hello.mp3', '06:08', 1, 24, 6),
  new Song('2407', 'Photographs', 'https://storage.googleapis.com/ip-public-bucket1/UTOPIA/Photographs.mp3', '04:28', 1, 24, 7),
  new Song('2408', 'Utopian', 'https://storage.googleapis.com/ip-public-bucket1/UTOPIA/Utopian.mp3', '07:39', 1, 24, 8),
  
);



/***************************************************
 * 4) ORGANIZE DATA INTO A "data" OBJECT
 **************************************************/
const data = {
  artists: {
    [artist1.id]: artist1,
  },
  albums: {},
  songs: {},
};

// Populate data.albums and data.songs
albums.forEach((album) => {
  data.albums[album.id] = album;
  album.songs.forEach((song) => {
    data.songs[song.id] = song;
  });
});


/***************************************************
 * 5) RENDER ALBUM ART (MAIN GRID)
 **************************************************/
function loadAlbumArt() {
  const albumArtContainer = document.querySelector('.album-art');
  // Clear any existing content first
  albumArtContainer.innerHTML = '';

  // Get all albums from the data object
  const allAlbums = Object.values(data.albums);

  allAlbums.forEach(album => {
    const img = document.createElement('img');
    img.src = album.cover_url;
    img.alt = `${album.name} Cover Art`;
    img.dataset.albumId = album.id; // store album ID for later
    albumArtContainer.appendChild(img);

    // Clicking an album art => enlarge / shrink & show details
    img.addEventListener('click', (event) => {
      const clickedImg = event.currentTarget;
      if (clickedImg.classList.contains('enlarged')) {
        clickedImg.classList.remove('enlarged');
      } else {
        // Remove 'enlarged' from all
        document.querySelectorAll('.album-art img').forEach(image => {
          image.classList.remove('enlarged');
        });
        // Add to the clicked one
        clickedImg.classList.add('enlarged');
      }
      // Display album details
      displayAlbumDetails(album.id);
    });
  });
}


/***************************************************
 * 6) DISPLAY ALBUM DETAILS (SIDEBAR)
 **************************************************/
function displayAlbumDetails(albumId) {
  const album = data.albums[albumId];
  const sidebar = document.querySelector('.sidebar');

  if (album) {
    // Show the sidebar
    sidebar.style.display = 'block';
    sidebar.style.flexBasis = '25%';

    const sidebarContent = document.querySelector('.sidebar .sidebar-content');
    sidebarContent.innerHTML = '';

    // Create album details container
    const albumDetails = document.createElement('div');
    albumDetails.classList.add('albumDetails');

    // Album title
    const title = document.createElement('h2');
    title.classList.add('albumName');
    title.textContent = album.name;
    albumDetails.appendChild(title);

    // Album description
    const description = document.createElement('p');
    description.classList.add('albumDescription');
    description.innerHTML = album.description;
    albumDetails.appendChild(description);

    // Album credit
    const credit = document.createElement('p');
    credit.classList.add('albumCredit');
    credit.innerHTML = album.credit;
    albumDetails.appendChild(credit);

    // Add albumDetails to sidebar
    sidebarContent.appendChild(albumDetails);

    // Additional album info: catalogue, production date, release date
    const albumInfo = document.createElement('div');
    albumInfo.classList.add('album-info');

    const catalogueNumber = document.createElement('div');
    catalogueNumber.classList.add('catalogue-number');
    catalogueNumber.textContent = ` ${album.catalogue}`;
    albumInfo.appendChild(catalogueNumber);

    const productionDate = document.createElement('div');
    productionDate.classList.add('production-date');
    productionDate.textContent = `${album.production_date}`;
    albumInfo.appendChild(productionDate);

    const releaseDate = document.createElement('div');
    releaseDate.classList.add('release-date');
    releaseDate.textContent = `${album.release_date}`;
    albumInfo.appendChild(releaseDate);

    sidebarContent.appendChild(albumInfo);

    // SONG LIST
    const songListContainer = document.createElement('div');
    songListContainer.classList.add('songListContainer');

    const songList = document.createElement('ul');
    songList.classList.add('songList');

    album.songs.forEach(song => {
      const songItem = document.createElement('li');
      songItem.textContent = `${song.track_id}. ${song.name} `;
      // Duration span
      const durationSpan = document.createElement('span');
      durationSpan.textContent = song.duration;
      durationSpan.classList.add('song-duration');
      songItem.appendChild(durationSpan);
      // Append to songList
      songList.appendChild(songItem);

      // Click => playSong
      songItem.addEventListener('click', () => {
        playSong(song.id, albumId);
      });
    });

    songListContainer.appendChild(songList);
    sidebarContent.appendChild(songListContainer);

    // 7) PURCHASE LINK => appended if we have an entry in purchaseLinks
    if (purchaseLinks[album.id]) {
      const purchaseDiv = document.createElement('div');
      purchaseDiv.classList.add('purchaseLink');

      const purchaseAnchor = document.createElement('a');
      purchaseAnchor.href = purchaseLinks[album.id];
      purchaseAnchor.target = '_blank';
      purchaseAnchor.textContent = 'Buy this Album';

      purchaseDiv.appendChild(purchaseAnchor);
      sidebarContent.appendChild(purchaseDiv);
    }

  } else {
    // Hide sidebar if invalid ID
    sidebar.style.flexBasis = '0%';
    setTimeout(() => {
      sidebar.style.display = 'none';
    }, 500);
  }
}


/***************************************************
 * 7) AUDIO PLAYER FUNCTIONALITY
 **************************************************/
function playSong(songId, albumId) {
  const song = data.songs[songId];
  const album = data.albums[albumId];
  let isLooping = false;

  if (song && album) {
    const playerContainer = document.querySelector('.player');
    playerContainer.innerHTML = ''; // Clear previous content

    // Now Playing Title
    const nowPlaying = document.createElement('p');
    nowPlaying.textContent = `${song.name}`;
    nowPlaying.classList.add('PlayerSong');
    playerContainer.appendChild(nowPlaying);

    // Audio element
    const audio = document.createElement('audio');
    audio.src = song.audio_url;
    audio.id = 'audio-player';
    playerContainer.appendChild(audio);

    // Custom controls container
    const controls = document.createElement('div');
    controls.classList.add('custom-audio-controls');

    // PLAY
    const playBtn = document.createElement('button');
    playBtn.id = 'play';
    playBtn.classList.add('play');
    controls.appendChild(playBtn);

    // PAUSE
    const pauseBtn = document.createElement('button');
    pauseBtn.id = 'pause';
    pauseBtn.classList.add('pause');
    controls.appendChild(pauseBtn);

    // STOP
    const stopBtn = document.createElement('button');
    stopBtn.id = 'stop';
    stopBtn.classList.add('stop');
    controls.appendChild(stopBtn);

    // BACK 30
    const backBtn = document.createElement('button');
    backBtn.id = 'back-30';
    backBtn.classList.add('back30');
    controls.appendChild(backBtn);

    // FORWARD 30
    const forwardBtn = document.createElement('button');
    forwardBtn.id = 'forward-30';
    forwardBtn.classList.add('forward30');
    controls.appendChild(forwardBtn);

    // PREV TRACK
    const prevTrackBtn = document.createElement('button');
    prevTrackBtn.id = 'prev-track';
    prevTrackBtn.classList.add('back');
    controls.appendChild(prevTrackBtn);

    // NEXT TRACK
    const nextTrackBtn = document.createElement('button');
    nextTrackBtn.id = 'next-track';
    nextTrackBtn.classList.add('next');
    controls.appendChild(nextTrackBtn);

    // LOOP
    const loopBtn = document.createElement('button');
    loopBtn.id = 'loop';
    loopBtn.classList.add('loop');
    controls.appendChild(loopBtn);

    // Volume control
    const volumeControl = document.createElement('div');
    volumeControl.classList.add('volume-control');
    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.id = 'volume-slider';
    volumeSlider.min = 0;
    volumeSlider.max = 1;
    volumeSlider.step = 0.01;
    volumeSlider.value = 1;
    volumeControl.appendChild(volumeSlider);
    controls.appendChild(volumeControl);

    // Append the entire controls to player
    playerContainer.appendChild(controls);

    // Event Listeners
    playBtn.addEventListener('click', () => {
      if (audio.paused) audio.play();
    });
    pauseBtn.addEventListener('click', () => {
      if (!audio.paused) audio.pause();
    });
    stopBtn.addEventListener('click', () => {
      audio.pause();
      audio.currentTime = 0;
    });
    forwardBtn.addEventListener('click', () => {
      audio.currentTime = Math.min(audio.currentTime + 30, audio.duration);
    });
    backBtn.addEventListener('click', () => {
      audio.currentTime = Math.max(audio.currentTime - 30, 0);
    });
    nextTrackBtn.addEventListener('click', () => {
      playNextTrack(songId, album);
    });
    prevTrackBtn.addEventListener('click', () => {
      playPreviousTrack(songId, album);
    });
    loopBtn.addEventListener('click', () => {
      isLooping = !isLooping;
      loopBtn.classList.toggle('active');
    });
    volumeSlider.addEventListener('input', () => {
      audio.volume = volumeSlider.value;
    });

    // Ended => loop or next
    audio.addEventListener('ended', () => {
      if (isLooping) {
        audio.currentTime = 0;
        audio.play();
      } else {
        playNextTrack(songId, album);
      }
    });

    // Next track helper
    function playNextTrack(currentSongId, currentAlbum) {
      const currentIndex = currentAlbum.songs.findIndex(s => s.id === currentSongId);
      if (currentIndex + 1 < currentAlbum.songs.length) {
        const nextSong = currentAlbum.songs[currentIndex + 1];
        playSong(nextSong.id, albumId);
      }
    }
    // Prev track helper
    function playPreviousTrack(currentSongId, currentAlbum) {
      const currentIndex = currentAlbum.songs.findIndex(s => s.id === currentSongId);
      if (currentIndex > 0) {
        const prevSong = currentAlbum.songs[currentIndex - 1];
        playSong(prevSong.id, albumId);
      }
    }

    // PROGRESS BAR
    const progressContainer = document.createElement('div');
    progressContainer.classList.add('progress-container');
    const progressBar = document.createElement('div');
    progressBar.classList.add('progress-bar');
    progressContainer.appendChild(progressBar);
    controls.appendChild(progressContainer);

    const timeDisplay = document.createElement('div');
    timeDisplay.classList.add('time-display');
    const currentTime = document.createElement('span');
    currentTime.id = 'current-time';
    currentTime.textContent = '0:00';
    timeDisplay.appendChild(currentTime);

    const separator = document.createElement('span');
    separator.textContent = ' / ';
    timeDisplay.appendChild(separator);

    const duration = document.createElement('span');
    duration.id = 'duration';
    duration.textContent = '0:00';
    timeDisplay.appendChild(duration);

    controls.appendChild(timeDisplay);

    // Update time + progress
    audio.addEventListener('timeupdate', () => {
      const progressPercent = (audio.currentTime / audio.duration) * 100;
      progressBar.style.width = `${progressPercent}%`;
      currentTime.textContent = formatTime(audio.currentTime);
      duration.textContent = formatTime(audio.duration);
    });

    // Seek on progress bar click
    progressContainer.addEventListener('click', (e) => {
      const rect = progressContainer.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const clickRatio = offsetX / rect.width;
      audio.currentTime = clickRatio * audio.duration;
    });

    // Format time helper
    function formatTime(seconds) {
      if (isNaN(seconds)) return '0:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // On loadedmetadata => init duration
    audio.addEventListener('loadedmetadata', () => {
      duration.textContent = formatTime(audio.duration);
    });

    // Autoplay
    audio.play().catch(() => {
      // If autoplay is blocked
    });
  }
}


/***************************************************
 * 8) INIT
 **************************************************/
window.onload = loadAlbumArt;
