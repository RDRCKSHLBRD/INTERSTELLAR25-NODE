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
      console.log('🌱 Seeding database with initial data...');
      await seedInitialData();
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
    
    // You can add more seed data here
    console.log('✅ Initial data seeded successfully');
    
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

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      setupDatabase();
      break;
    case 'drop':
      dropAllTables();
      break;
    case 'reset':
      dropAllTables().then(() => setupDatabase());
      break;
    default:
      console.log('Available commands:');
      console.log('  setup [--seed]  - Create database schema and optionally seed data');
      console.log('  drop --confirm  - Drop all tables (DESTRUCTIVE!)');
      console.log('  reset --confirm - Drop and recreate schema');
      console.log('');
      console.log('Examples:');
      console.log('  node src/config/setup-db.js setup --seed');
      console.log('  node src/config/setup-db.js drop --confirm');
  }
}

module.exports = {
  setupDatabase,
  seedInitialData,
  dropAllTables
};