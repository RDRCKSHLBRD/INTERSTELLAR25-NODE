import express from 'express';
import { query } from '../../config/database.js';

const router = express.Router();

// GET /api/albums - Get all albums
router.get('/', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT a.*, ar.name as artist_name 
      FROM albums a 
      JOIN artists ar ON a.artist_id = ar.id 
      ORDER BY a.release_date DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/albums/:id - Get specific album with songs
router.get('/:id', async (req, res, next) => {
  try {
    const albumId = parseInt(req.params.id);
    
    if (isNaN(albumId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid album ID'
      });
    }

    // Get album details with artist info
    const albumResult = await query(`
      SELECT a.*, ar.name as artist_name, ar.description as artist_description
      FROM albums a 
      JOIN artists ar ON a.artist_id = ar.id 
      WHERE a.id = $1
    `, [albumId]);

    if (albumResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    // Get album songs
    const songsResult = await query(
      'SELECT * FROM songs WHERE album_id = $1 ORDER BY track_id',
      [albumId]
    );

    const album = {
      ...albumResult.rows[0],
      songs: songsResult.rows
    };

    res.json({
      success: true,
      data: album
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/albums/catalogue/:catalogue - Get album by catalogue number
router.get('/catalogue/:catalogue', async (req, res, next) => {
  try {
    const catalogue = req.params.catalogue;

    const albumResult = await query(`
      SELECT a.*, ar.name as artist_name, ar.description as artist_description
      FROM albums a 
      JOIN artists ar ON a.artist_id = ar.id 
      WHERE a.catalogue = $1
    `, [catalogue]);

    if (albumResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    // Get album songs
    const songsResult = await query(
      'SELECT * FROM songs WHERE album_id = $1 ORDER BY track_id',
      [albumResult.rows[0].id]
    );

    const album = {
      ...albumResult.rows[0],
      songs: songsResult.rows
    };

    res.json({
      success: true,
      data: album
    });
  } catch (error) {
    next(error);
  }
});

export default router;