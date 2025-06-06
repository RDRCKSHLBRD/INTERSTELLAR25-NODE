import express from 'express';
import { query } from '../../config/database.js';

const router = express.Router();

// GET /api/songs - Get all songs
router.get('/', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT s.*, a.name as album_name, ar.name as artist_name 
      FROM songs s 
      JOIN albums a ON s.album_id = a.id 
      JOIN artists ar ON a.artist_id = ar.id 
      ORDER BY ar.name, a.release_date DESC, s.track_id
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

// GET /api/songs/:id - Get specific song with album and artist info
router.get('/:id', async (req, res, next) => {
  try {
    const songId = parseInt(req.params.id);
    
    if (isNaN(songId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid song ID'
      });
    }

    // Get song details with album and artist info
    const songResult = await query(`
      SELECT s.*, a.name as album_name, a.catalogue, ar.name as artist_name, ar.description as artist_description
      FROM songs s 
      JOIN albums a ON s.album_id = a.id 
      JOIN artists ar ON a.artist_id = ar.id 
      WHERE s.id = $1
    `, [songId]);

    if (songResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Song not found'
      });
    }

    res.json({
      success: true,
      data: songResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/songs/album/:albumId - Get all songs for a specific album
router.get('/album/:albumId', async (req, res, next) => {
  try {
    const albumId = parseInt(req.params.albumId);
    
    if (isNaN(albumId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid album ID'
      });
    }

    const songsResult = await query(`
      SELECT s.*, a.name as album_name, ar.name as artist_name
      FROM songs s 
      JOIN albums a ON s.album_id = a.id 
      JOIN artists ar ON a.artist_id = ar.id 
      WHERE s.album_id = $1 
      ORDER BY s.track_id
    `, [albumId]);

    res.json({
      success: true,
      data: songsResult.rows,
      count: songsResult.rows.length
    });
  } catch (error) {
    next(error);
  }
});

export default router;