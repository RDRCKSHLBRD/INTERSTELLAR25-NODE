const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5434,
  database: process.env.DB_NAME || 'interstellar_packages',
  user: process.env.DB_USER || 'interstellar_user',
  password: process.env.DB_PASSWORD,
});

// Stripe purchase links mapping
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
  23: "https://buy.stripe.com/example_Album23",
  24: "https://buy.stripe.com/example_Album24"
};

// Data extraction functions
function extractDataFromScript() {
  console.log('📊 Extracting data from script.js...');
  
  // Fixed path: from src/utils/ go up two levels to project root
  const scriptPath = path.join(__dirname, '../../public/js/script.js');
  
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`script.js not found at ${scriptPath}`);
  }
  
  const scriptContent = fs.readFileSync(scriptPath, 'utf8');
  
  // Extract album data using a more robust approach
  const albumMatches = scriptContent.matchAll(/const album(\d+) = new Album\(([\s\S]*?)\);[\s]*albums\.push\(album\d+\);/g);
  const albums = [];
  
  for (const match of albumMatches) {
    const albumNumber = parseInt(match[1]);
    const albumData = match[2];
    
    // Parse album constructor parameters
    const params = parseAlbumParametersRobust(albumData, albumNumber);
    if (params) {
      albums.push({
        id: albumNumber,
        ...params
      });
    }
  }
  
  // Extract songs for each album
  const songsMatches = scriptContent.matchAll(/album(\d+)\.songs\.push\(([\s\S]*?)\);/g);
  const songs = [];
  
  for (const match of songsMatches) {
    const albumId = parseInt(match[1]);
    const songsData = match[2];
    
    // Parse song objects
    const songObjects = parseSongObjects(songsData, albumId);
    songs.push(...songObjects);
  }
  
  return { albums, songs };
}

function parseAlbumParametersRobust(paramString, albumNumber) {
  try {
    console.log(`🔍 Parsing album ${albumNumber}...`);
    
    // Try to use eval in a controlled way to parse the parameters
    // This is more reliable for complex strings with template literals
    const cleanParamString = paramString.trim();
    
    // Create a mock Album constructor to capture the parameters
    let capturedParams = null;
    const mockAlbum = function(...args) {
      capturedParams = args;
    };
    
    // Evaluate the parameter string safely
    try {
      eval(`mockAlbum(${cleanParamString})`);
    } catch (error) {
      console.log(`⚠️  Fallback parsing for album ${albumNumber}`);
      // Fallback to manual parsing for problematic albums
      return parseAlbumParametersManual(paramString, albumNumber);
    }
    
    if (capturedParams && capturedParams.length >= 10) {
      return {
        catalogue: String(capturedParams[1] || `0104010${albumNumber}`),
        name: String(capturedParams[2] || `Album ${albumNumber}`),
        cover_url: String(capturedParams[3] || ''),
        production_date: String(capturedParams[4] || ''),
        release_date: String(capturedParams[5] || ''),
        artist_id: parseInt(capturedParams[6]) || 1,
        credit: String(capturedParams[7] || ''),
        description: String(capturedParams[8] || ''),
        tracks: parseInt(capturedParams[9]) || 0
      };
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error parsing album ${albumNumber}:`, error.message);
    return parseAlbumParametersManual(paramString, albumNumber);
  }
}

function parseAlbumParametersManual(paramString, albumNumber) {
  // Manual fallback for problematic albums
  console.log(`🔧 Manual parsing fallback for album ${albumNumber}`);
  
  // Extract basic info that we can rely on
  const albumData = {
    catalogue: `0104010${albumNumber.toString().padStart(2, '0')}`,
    name: `Album ${albumNumber}`,
    cover_url: '',
    production_date: '2023',
    release_date: '2023', 
    artist_id: 1,
    credit: 'All Sound & Composition: Roderick Shoolbraid',
    description: `Album ${albumNumber} description`,
    tracks: 0
  };
  
  // Try to extract some basic info with regex
  const nameMatch = paramString.match(/'([^']+)'/);
  if (nameMatch) {
    albumData.name = nameMatch[1];
  }
  
  const urlMatch = paramString.match(/https:\/\/storage\.googleapis\.com[^'"]*/);
  if (urlMatch) {
    albumData.cover_url = urlMatch[0];
  }
  
  // Try to extract track count from the end
  const trackMatch = paramString.match(/(\d+)[\s]*$/);
  if (trackMatch) {
    albumData.tracks = parseInt(trackMatch[1]);
  }
  
  console.log(`✅ Manual parse result for album ${albumNumber}: "${albumData.name}" (${albumData.tracks} tracks)`);
  return albumData;
}

function parseSongObjects(songsString, albumId) {
  const songs = [];
  
  // Match Song constructor calls
  const songMatches = songsString.matchAll(/new Song\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+),\s*(\d+)\)/g);
  
  for (const match of songMatches) {
    songs.push({
      id: match[1],
      name: match[2],
      audio_url: match[3],
      duration: match[4],
      artist_id: parseInt(match[5]),
      album_id: parseInt(match[6]),
      track_id: parseInt(match[7])
    });
  }
  
  return songs;
}

// Database insertion functions
async function insertArtist() {
  console.log('👨‍🎨 Inserting artist...');
  
  const artist = {
    id: 1,
    name: 'Roderick Shoolbraid',
    description: 'Electronic Ambient Musician'
  };
  
  const query = `
    INSERT INTO artists (id, name, description) 
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id
  `;
  
  const result = await pool.query(query, [artist.id, artist.name, artist.description]);
  console.log(`✅ Artist inserted/updated with ID: ${result.rows[0].id}`);
}

async function insertAlbums(albums) {
  console.log(`📀 Inserting ${albums.length} albums...`);
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (let i = 0; i < albums.length; i++) {
      const album = albums[i];
      
      // Validate and clean album data
      const albumData = {
        id: album.id || (i + 1),
        catalogue: album.catalogue || `0104010${(i + 1).toString().padStart(2, '0')}`,
        name: album.name || `Album ${i + 1}`,
        cover_url: album.cover_url || '',
        production_date: album.production_date || '',
        release_date: album.release_date || '',
        artist_id: album.artist_id || 1,
        credit: album.credit || '',
        description: album.description || '',
        tracks: album.tracks || 0
      };
      
      console.log(`📀 Inserting album ${albumData.id}: "${albumData.name}" (${albumData.tracks} tracks)`);
      
      const query = `
        INSERT INTO albums (
          id, catalogue, name, cover_url, production_date, 
          release_date, artist_id, credit, description, tracks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          catalogue = EXCLUDED.catalogue,
          name = EXCLUDED.name,
          cover_url = EXCLUDED.cover_url,
          production_date = EXCLUDED.production_date,
          release_date = EXCLUDED.release_date,
          artist_id = EXCLUDED.artist_id,
          credit = EXCLUDED.credit,
          description = EXCLUDED.description,
          tracks = EXCLUDED.tracks,
          updated_at = CURRENT_TIMESTAMP
      `;
      
      await client.query(query, [
        albumData.id, albumData.catalogue, albumData.name, albumData.cover_url,
        albumData.production_date, albumData.release_date, albumData.artist_id,
        albumData.credit, albumData.description, albumData.tracks
      ]);
    }
    
    await client.query('COMMIT');
    console.log(`✅ Successfully inserted/updated ${albums.length} albums`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function insertSongs(songs) {
  console.log(`🎵 Inserting ${songs.length} songs...`);
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const song of songs) {
      const query = `
        INSERT INTO songs (
          id, name, audio_url, duration, artist_id, album_id, track_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          audio_url = EXCLUDED.audio_url,
          duration = EXCLUDED.duration,
          artist_id = EXCLUDED.artist_id,
          album_id = EXCLUDED.album_id,
          track_id = EXCLUDED.track_id,
          updated_at = CURRENT_TIMESTAMP
      `;
      
      await client.query(query, [
        song.id, song.name, song.audio_url, song.duration,
        song.artist_id, song.album_id, song.track_id
      ]);
    }
    
    await client.query('COMMIT');
    console.log(`✅ Successfully inserted/updated ${songs.length} songs`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function insertProducts(albums) {
  console.log(`💰 Inserting products...`);
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const album of albums) {
      const purchaseLink = purchaseLinks[album.id];
      
      if (purchaseLink) {
        // First, check if product already exists
        const existingProduct = await client.query(
          'SELECT id FROM products WHERE cat_id = $1',
          [album.catalogue]
        );
        
        if (existingProduct.rows.length > 0) {
          // Update existing product
          const updateQuery = `
            UPDATE products SET
              price = $1,
              name = $2,
              catalogue_id = $3,
              description = $4,
              stripe_product_id = $5,
              active = $6,
              updated_at = CURRENT_TIMESTAMP
            WHERE cat_id = $7
          `;
          
          await client.query(updateQuery, [
            12.00,                   // price (default)
            album.name,              // name
            album.catalogue,         // catalogue_id (references albums.catalogue)
            `Digital download of ${album.name}`, // description
            purchaseLink,            // stripe_product_id (using the URL for now)
            true,                    // active
            album.catalogue          // cat_id (WHERE clause)
          ]);
        } else {
          // Insert new product
          const insertQuery = `
            INSERT INTO products (
              cat_id, price, name, catalogue_id, description, 
              stripe_product_id, active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `;
          
          await client.query(insertQuery, [
            album.catalogue,          // cat_id
            12.00,                   // price (default)
            album.name,              // name
            album.catalogue,         // catalogue_id (references albums.catalogue)
            `Digital download of ${album.name}`, // description
            purchaseLink,            // stripe_product_id (using the URL for now)
            true                     // active
          ]);
        }
      }
    }
    
    await client.query('COMMIT');
    console.log(`✅ Successfully inserted/updated products`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Verification functions
async function verifyMigration() {
  console.log('🔍 Verifying migration...');
  
  const artistCount = await pool.query('SELECT COUNT(*) FROM artists');
  const albumCount = await pool.query('SELECT COUNT(*) FROM albums');
  const songCount = await pool.query('SELECT COUNT(*) FROM songs');
  const productCount = await pool.query('SELECT COUNT(*) FROM products');
  
  console.log(`📊 Migration Results:`);
  console.log(`   Artists: ${artistCount.rows[0].count}`);
  console.log(`   Albums: ${albumCount.rows[0].count}`);
  console.log(`   Songs: ${songCount.rows[0].count}`);
  console.log(`   Products: ${productCount.rows[0].count}`);
  
  // Sample data verification
  const sampleAlbum = await pool.query(
    'SELECT * FROM albums WHERE catalogue = $1', 
    ['00040101']
  );
  
  if (sampleAlbum.rows.length > 0) {
    console.log(`✅ Sample album verification: "${sampleAlbum.rows[0].name}" found`);
  }
  
  const sampleSongs = await pool.query(
    'SELECT COUNT(*) FROM songs WHERE album_id = $1',
    [1]
  );
  
  console.log(`✅ Sample songs verification: ${sampleSongs.rows[0].count} songs found for album 1`);
}

// Main migration function
async function runMigration() {
  try {
    console.log('🚀 Starting data migration...');
    console.log('=' .repeat(50));
    
    // Extract data from script.js
    const { albums, songs } = extractDataFromScript();
    
    console.log(`📊 Extracted data:`);
    console.log(`   Albums: ${albums.length}`);
    console.log(`   Songs: ${songs.length}`);
    console.log('');
    
    // Insert data into database
    await insertArtist();
    await insertAlbums(albums);
    await insertSongs(songs);
    await insertProducts(albums);
    
    // Verify migration
    await verifyMigration();
    
    console.log('');
    console.log('🎉 Migration completed successfully!');
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration().catch(error => {
    console.error('Migration error:', error);
    process.exit(1);
  });
}

module.exports = { runMigration };