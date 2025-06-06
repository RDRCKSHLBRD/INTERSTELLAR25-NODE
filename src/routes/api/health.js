// src/routes/api/health.js
import express from 'express';
import { query } from '../../config/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const uptime = process.uptime();
    const timestamp = new Date().toISOString();

    let dbStatus = 'unknown';
    try {
      const testResult = await query('SELECT NOW()');
      if (testResult?.rows?.length) {
        dbStatus = 'connected';
      }
    } catch (err) {
      dbStatus = 'error';
    }

    res.status(200).json({
      status: 'ok',
      uptime,
      timestamp,
      db: dbStatus
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;
