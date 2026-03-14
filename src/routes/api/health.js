// src/routes/api/health.js — V5 (flash-first, no Postgres probe when off)
import express from 'express';
import flash from '../../config/flashdb.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const uptime = process.uptime();
    const timestamp = new Date().toISOString();

    // Flash layer status
    const flashReady = flash.isReady();
    let flashMeta = null;
    if (flashReady) {
      flashMeta = flash.getFlashMeta();
    }

    res.status(200).json({
      status: flashReady ? 'ok' : 'degraded',
      uptime: Math.round(uptime),
      timestamp,
      flash: {
        ready: flashReady,
        syncedAt: flashMeta?.synced_at || null,
        v5: flashMeta?.v5_schema || null
      },
      postgres: 'off (flash-only mode)'
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