const fs = require('fs').promises;
const path = require('path');
const { query, testConnection } = require('./database');

async function setupDatabase() {
  console.log('🚀 Setting up database...');
  
  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Cannot connect to database');
    }
    
    // Read and execute schema file
    const schemaPath = path.join(__dirname, '../../migrations/001_initial_schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    console.log('📋 Executing database schema...');
    await query(schema);
    
    console.log('✅ Database schema created successfully!');
    
    // Check if we should seed data
    const seedData = process.argv.includes('--seed');
    if (seedData) {
      console.log('🌱 Seeding database with complete data...');
      await seedCompleteData();
    }
    
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

async function seedCompleteData() {
  try {
    console.log('🎨 Inserting artists...');
    await executeSQLFile('artists.sql');
    
    console.log('📀 Inserting albums...');
    await executeSQLFile('albums.sql');
    
    console.log('🎵 Inserting songs (part 1/3)...');
    await executeSQLFile('songs.sql');
    
    console.log('🎵 Inserting songs (part 2/3)...');
    await executeSQLFile('songs_part2.sql');
    
    console.log('🎵 Inserting songs (part 3/3)...');
    await executeSQLFile('songs_part3.sql');
    
    console.log('💰 Inserting products...');
    await executeSQLFile('products.sql');
    
    // Verification
    console.log('🔍 Verifying data...');
    await verifyData();
    
    console.log('✅ Complete data seeded successfully');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  }
}

async function executeSQLFile(filename) {
  try {
    const filePath = path.join(__dirname, '../../migrations', filename);
    const sql = await fs.readFile(filePath, 'utf8');
    await query(sql);
    console.log(`  ✅ ${filename} executed successfully`);
  } catch (error) {
    console.error(`  ❌ Failed to execute ${filename}:`, error.message);
    throw error;
  }
}

async function verifyData() {
  try {
    const artistCount = await query('SELECT COUNT(*) as count FROM artists');
    const albumCount = await query('SELECT COUNT(*) as count FROM albums');
    const songCount = await query('SELECT COUNT(*) as count FROM songs');
    const productCount = await query('SELECT COUNT(*) as count FROM products');
    
    console.log('📊 Database Summary:');
    console.log(`  Artists: ${artistCount.rows[0].count}`);
    console.log(`  Albums: ${albumCount.rows[0].count}`);
    console.log(`  Songs: ${songCount.rows[0].count}`);
    console.log(`  Products: ${productCount.rows[0].count}`);
    
    // Verify Robot's Dream is included
    const robotsDream = await query(
      "SELECT id, name FROM songs WHERE id = '1505'"
    );
    
    if (robotsDream.rows.length > 0) {
      console.log(`  ✅ Robot's Dream found: ${robotsDream.rows[0].name}`);
    } else {
      console.log(`  ⚠️  Robot's Dream not found!`);
    }
    
    // Verify Album 15 has 7 songs
    const album15Songs = await query(
      'SELECT COUNT(*) as count FROM songs WHERE album_id = 15'
    );
    
    console.log(`  Album 15 songs: ${album15Songs.rows[0].count} (should be 7)`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Legacy function for minimal seeding (kept for compatibility)
async function seedInitialData() {
  try {
    // Check if artist already exists
    const artistCheck = await query('SELECT id FROM artists WHERE name = $1', ['Roderick Shoolbraid']);
    
    if (artistCheck.rows.length === 0) {
      console.log('Creating artist: Roderick Shoolbraid');
      await query(
        'INSERT INTO artists (name, description) VALUES ($1, $2)',
        ['Roderick Shoolbraid', 'Electronic Ambient Musician']
      );
    }
    
    console.log('✅ Initial data seeded successfully');
    console.log('💡 Use --seed-complete for full catalog');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  }
}

// Helper function to drop all tables (use with caution!)
async function dropAllTables() {
  const confirmed = process.argv.includes('--confirm');
  
  if (!confirmed) {
    console.log('⚠️  To drop all tables, run with --confirm flag');
    console.log('⚠️  This will DELETE ALL DATA!');
    return;
  }
  
  try {
    console.log('🗑️  Dropping all tables...');
    
    const dropTables = `
      DROP TABLE IF EXISTS user_sessions CASCADE;
      DROP TABLE IF EXISTS purchase_items CASCADE;
      DROP TABLE IF EXISTS purchases CASCADE;
      DROP TABLE IF EXISTS cart_items CASCADE;
      DROP TABLE IF EXISTS carts CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS playlist_songs CASCADE;
      DROP TABLE IF EXISTS playlists CASCADE;
      DROP TABLE IF EXISTS songs CASCADE;
      DROP TABLE IF EXISTS albums CASCADE;
      DROP TABLE IF EXISTS artists CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
      DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
    `;
    
    await query(dropTables);
    console.log('✅ All tables dropped');
    
  } catch (error) {
    console.error('❌ Failed to drop tables:', error.message);
    throw error;
  }
}

// Complete reset with full data
async function resetWithCompleteData() {
  const confirmed = process.argv.includes('--confirm');
  
  if (!confirmed) {
    console.log('⚠️  To reset with complete data, run with --confirm flag');
    console.log('⚠️  This will DELETE ALL DATA and reload everything!');
    return;
  }
  
  try {
    await dropAllTables();
    console.log('🔄 Recreating database with complete data...');
    await setupDatabase();
    await seedCompleteData();
    console.log('🎉 Complete reset finished!');
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    throw error;
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      setupDatabase();
      break;
    case 'seed-complete':
      seedCompleteData();
      break;
    case 'drop':
      dropAllTables();
      break;
    case 'reset':
      dropAllTables().then(() => setupDatabase());
      break;
    case 'reset-complete':
      resetWithCompleteData();
      break;
    case 'verify':
      verifyData();
      break;
    default:
      console.log('Available commands:');
      console.log('  setup [--seed]           - Create database schema and optionally seed minimal data');
      console.log('  seed-complete            - Seed complete catalog (24 albums, ~230 songs)');
      console.log('  drop --confirm           - Drop all tables (DESTRUCTIVE!)');
      console.log('  reset [--confirm]        - Drop and recreate schema');
      console.log('  reset-complete --confirm - Drop and recreate with complete data');
      console.log('  verify                   - Verify database contents');
      console.log('');
      console.log('Examples:');
      console.log('  node src/config/setup-db.js setup --seed');
      console.log('  node src/config/setup-db.js seed-complete');
      console.log('  node src/config/setup-db.js reset-complete --confirm');
      console.log('  node src/config/setup-db.js verify');
  }
}

module.exports = {
  setupDatabase,
  seedInitialData,
  seedCompleteData,
  dropAllTables,
  resetWithCompleteData,
  verifyData
};