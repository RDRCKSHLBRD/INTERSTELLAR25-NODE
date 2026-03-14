// src/routes/api/songs.js — V5 (Flash Layer reads, no Postgres for browse)
import express from 'express';
import flash from '../../config/flashdb.js';

const router = express.Router();

// GET /api/songs - Get all songs
router.get('/', (req, res, next) => {
  try {
    if (!flash.isReady()) {
      return res.status(503).json({
        success: false,
        message: 'Flash database not available. Run: node scripts/flash-sync.js'
      });
    }

    const songs = flash.getAllSongs();

    res.json({
      success: true,
      data: songs,
      count: songs.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/songs/:id - Get specific song with album and artist info
router.get('/:id', (req, res, next) => {
  try {
    const songId = parseInt(req.params.id);

    if (isNaN(songId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid song ID'
      });
    }

    if (!flash.isReady()) {
      return res.status(503).json({
        success: false,
        message: 'Flash database not available'
      });
    }

    const song = flash.getSong(songId);

    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Song not found'
      });
    }

    res.json({
      success: true,
      data: song
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/songs/album/:albumId - Get all songs for a specific album
router.get('/album/:albumId', (req, res, next) => {
  try {
    const albumId = parseInt(req.params.albumId);

    if (isNaN(albumId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid album ID'
      });
    }

    if (!flash.isReady()) {
      return res.status(503).json({
        success: false,
        message: 'Flash database not available'
      });
    }

    const songs = flash.getSongsByAlbum(albumId);

    res.json({
      success: true,
      data: songs,
      count: songs.length
    });
  } catch (error) {
    next(error);
  }
});

export default router;