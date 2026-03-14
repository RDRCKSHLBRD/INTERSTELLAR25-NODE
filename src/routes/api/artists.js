// src/routes/api/artists.js — V5 (Flash Layer reads, no Postgres for browse)
import express from 'express';
import flash from '../../config/flashdb.js';

const router = express.Router();

// GET /api/artists - Get all artists
router.get('/', (req, res, next) => {
  try {
    if (!flash.isReady()) {
      return res.status(503).json({
        success: false,
        message: 'Flash database not available. Run: node scripts/flash-sync.js'
      });
    }

    const artists = flash.getAllArtists();

    res.json({
      success: true,
      data: artists,
      count: artists.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/artists/:id - Get specific artist with albums
router.get('/:id', (req, res, next) => {
  try {
    const artistId = parseInt(req.params.id);

    if (isNaN(artistId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid artist ID'
      });
    }

    if (!flash.isReady()) {
      return res.status(503).json({
        success: false,
        message: 'Flash database not available'
      });
    }

    const artist = flash.getArtistFull(artistId);

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    }

    res.json({
      success: true,
      data: artist
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/artists - Create new artist (WRITE — requires Postgres)
// Keeping this as a stub that returns 503 when Postgres is off.
// When you need admin writes, start Cloud SQL and swap in database.js import.
router.post('/', (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Write operations require Postgres. Start Cloud SQL first.'
  });
});

export default router;