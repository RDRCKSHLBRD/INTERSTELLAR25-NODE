import express from 'express';
import { query } from '../../config/database.js';

const router = express.Router();

// GET /api/artists - Get all artists
router.get('/', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM artists ORDER BY name');
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/artists/:id - Get specific artist with albums
router.get('/:id', async (req, res, next) => {
  try {
    const artistId = parseInt(req.params.id);
    
    if (isNaN(artistId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid artist ID'
      });
    }

    // Get artist details
    const artistResult = await query(
      'SELECT * FROM artists WHERE id = $1',
      [artistId]
    );

    if (artistResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    }

    // Get artist's albums
    const albumsResult = await query(
      'SELECT * FROM albums WHERE artist_id = $1 ORDER BY release_date DESC',
      [artistId]
    );

    const artist = {
      ...artistResult.rows[0],
      albums: albumsResult.rows
    };

    res.json({
      success: true,
      data: artist
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/artists - Create new artist (admin only - we'll add auth later)
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Artist name is required'
      });
    }

    const result = await query(
      'INSERT INTO artists (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

export default router;