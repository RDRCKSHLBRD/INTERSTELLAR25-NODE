// src/config/database.js
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();
const { Pool } = pkg;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'interstellar_packages',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(dbConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = async (text, params) => {
  const start = Date.now();
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executed:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✓ Database query test:', result.rows[0].now);
    client.release();
    return true;
  } catch (err) {
    console.error('✗ Database connection failed:', err.message);
    return false;
  }
};

export const closePool = async () => {
  try {
    await pool.end();
    console.log('✓ Database pool closed');
  } catch (err) {
    console.error('✗ Error closing database pool:', err);
  }
};


export default pool;
