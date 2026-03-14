// src/routes/api/albums.js — V5 (Flash Layer reads, no Postgres for browse)
import express from 'express';
import flash from '../../config/flashdb.js';

const router = express.Router();

// GET /api/albums - Get all albums
router.get('/', (req, res, next) => {
  try {
    if (!flash.isReady()) {
      return res.status(503).json({
        success: false,
        message: 'Flash database not available. Run: node scripts/flash-sync.js'
      });
    }

    const albums = flash.getAllAlbums();

    res.json({
      success: true,
      data: albums,
      count: albums.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/albums/:id - Get specific album with songs
router.get('/:id', (req, res, next) => {
  try {
    const albumId = parseInt(req.params.id);

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

    const album = flash.getAlbumFull(albumId);

    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    res.json({
      success: true,
      data: album
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/albums/catalogue/:catalogue - Get album by catalogue number
router.get('/catalogue/:catalogue', (req, res, next) => {
  try {
    const catalogue = req.params.catalogue;

    if (!flash.isReady()) {
      return res.status(503).json({
        success: false,
        message: 'Flash database not available'
      });
    }

    const album = flash.getAlbumFullByCatalogue(catalogue);

    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    res.json({
      success: true,
      data: album
    });
  } catch (error) {
    next(error);
  }
});

export default router;