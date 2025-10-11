import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import { Storage } from '@google-cloud/storage';

console.log('🔧 Downloads routes module loaded');


const router = express.Router();

// Directory fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Google Cloud Storage
let storage;
if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
  // Production (Render) - parse JSON from env var
  const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);
  storage = new Storage({
    credentials,
    projectId: credentials.project_id
  });
} else {
  // Development - use file path
  storage = new Storage({
    keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
  });
}

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET || 'rdxenv3-interstellar-assets');

// Guest download route - handles the email download links
router.get('/guest-downloads/:token', async (req, res) => {
  try {
    const { token } = req.params;

    console.log(`🔗 Guest download requested for token: ${token}`);

    // 1. Validate the token and get guest download info
    const guestDownloadQuery = `
      SELECT gd.*, p.total_amount, p.email, p.purchased_at 
      FROM guest_downloads gd
      JOIN purchases p ON gd.purchase_id = p.id
      WHERE gd.token = $1 AND gd.expires_at > NOW()
    `;

    const guestResult = await pool.query(guestDownloadQuery, [token]);

    if (guestResult.rows.length === 0) {
      console.log('❌ Invalid or expired token');
      return res.status(404).render('error', {
        error: 'Download link is invalid or has expired.'
      });
    }

    const guestDownload = guestResult.rows[0];
    console.log(`✅ Valid token found for email: ${guestDownload.email}`);

    // 2. Get the purchased items for this purchase
    const purchaseItemsQuery = `
      SELECT pi.*, p.name as product_name, p.catalogue_id, p.song_id
      FROM purchase_items pi
      JOIN products p ON pi.product_id = p.id
      WHERE pi.purchase_id = $1
    `;

    const itemsResult = await pool.query(purchaseItemsQuery, [guestDownload.purchase_id]);
    const purchaseItems = itemsResult.rows;

    console.log(`📦 Found ${purchaseItems.length} purchased items`);

    // 3. Get detailed info for each item (albums/songs with file URLs)
    const downloadItems = [];

    for (const item of purchaseItems) {
      if (item.song_id) {
        // This is a song purchase
        const songQuery = `
          SELECT s.*, a.name as album_name, ar.name as artist_name
          FROM songs s
          JOIN albums a ON s.album_id = a.id  
          JOIN artists ar ON a.artist_id = ar.id
          WHERE s.id = $1
        `;
        const songResult = await pool.query(songQuery, [item.song_id]);

        if (songResult.rows.length > 0) {
          const song = songResult.rows[0];
          downloadItems.push({
            type: 'song',
            id: song.id,
            name: song.name,
            artist: song.artist_name,
            album: song.album_name,
            audio_url: song.audio_url,
            cover_url: song.cover_url,  // ← ADD THIS
            price: item.price
          });
        }
      } else {
        // This is an album purchase
        const albumQuery = `
          SELECT a.*, ar.name as artist_name
          FROM albums a
          JOIN artists ar ON a.artist_id = ar.id
          WHERE a.catalogue = $1
        `;
        const albumResult = await pool.query(albumQuery, [item.catalogue_id]);

        if (albumResult.rows.length > 0) {
          const album = albumResult.rows[0];

          // Get all songs for this album
          const albumSongsQuery = `
            SELECT * FROM songs 
            WHERE album_id = $1 
            ORDER BY track_id
          `;
          const songsResult = await pool.query(albumSongsQuery, [album.id]);

          downloadItems.push({
            type: 'album',
            id: album.id,
            name: album.name,
            artist: album.artist_name,
            catalogue: album.catalogue,
            cover_url: album.cover_url,
            songs: songsResult.rows,
            price: item.price
          });
        }
      }
    }

    // 4. Update access tracking
    const updateAccessQuery = `
      UPDATE guest_downloads 
      SET accessed_at = NOW(), access_count = COALESCE(access_count, 0) + 1
      WHERE token = $1
    `;
    await pool.query(updateAccessQuery, [token]);

    console.log(`🎵 Rendering download page with ${downloadItems.length} items`);

    // 5. Render the appropriate EJS template
    const templateData = {
      title: `Your Music Download - Interstellar Packages`,
      email: guestDownload.email,
      purchaseDate: guestDownload.purchased_at,
      totalAmount: guestDownload.total_amount,
      items: downloadItems,
      expiresAt: guestDownload.expires_at,
      token: token
    };

    // Determine which template to use based on items
    if (downloadItems.length === 1 && downloadItems[0].type === 'album') {
      res.render('downloads/album-download', templateData);
    } else if (downloadItems.length === 1 && downloadItems[0].type === 'song') {
      res.render('downloads/song-download', templateData);
    } else {
      // Mixed or multiple items - use a generic download template
      res.render('downloads/album-download', templateData); // Use album template as fallback
    }

  } catch (error) {
    console.error('❌ Guest download error:', error);
    res.status(500).render('error', {
      error: 'An error occurred while accessing your download.'
    });
  }
});


console.log('✅ Registered route: GET /guest-downloads/:token');  // <- ADD THIS


// Download individual song file - generates signed URL
router.get('/download-file/:token/:songId', async (req, res) => {
  try {
    const { token, songId } = req.params;

    console.log(`🎵 Download requested - Song ID: ${songId}`);

    // Validate token first
    const guestDownloadQuery = `
      SELECT gd.*, p.id as purchase_id 
      FROM guest_downloads gd
      JOIN purchases p ON gd.purchase_id = p.id
      WHERE gd.token = $1 AND gd.expires_at > NOW()
    `;
    const guestResult = await pool.query(guestDownloadQuery, [token]);

    if (guestResult.rows.length === 0) {
      console.log('❌ Invalid or expired download token');
      return res.status(404).json({ error: 'Invalid or expired download link' });
    }

    // Get song info
    const songQuery = `SELECT * FROM songs WHERE id = $1`;
    const songResult = await pool.query(songQuery, [songId]);

    if (songResult.rows.length === 0) {
      console.log('❌ Song not found:', songId);
      return res.status(404).json({ error: 'Song not found' });
    }

    const song = songResult.rows[0];
    console.log(`✅ Generating signed URL for: ${song.name}`);

    // Extract filename from the Google Cloud Storage URL
    const urlParts = song.audio_url.split('/');
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET || 'rdxenv3-interstellar-assets';
    const bucketIndex = urlParts.findIndex(part => part === bucketName);
    const fileName = urlParts.slice(bucketIndex + 1).join('/');
    console.log(`📁 File name: ${fileName}`);

    // Generate signed URL for download
    const [signedUrl] = await bucket.file(fileName).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + (60 * 60 * 1000), // 1 hour from now
      responseDisposition: `attachment; filename="${song.name.replace(/[^a-zA-Z0-9\-_\s]/g, '')}.mp3"`,
      responseType: 'audio/mpeg'
    });

    console.log(`🔗 Signed URL generated, redirecting...`);

    // Redirect to the signed URL
    res.redirect(signedUrl);

  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Download entire album as individual files
router.get('/download-album/:token/:albumId/:format', async (req, res) => {
  try {
    const { token, albumId, format } = req.params;

    console.log(`🎵 Album download requested - Album ID: ${albumId}, Format: ${format}`);

    // Validate token first
    const guestDownloadQuery = `
      SELECT gd.*, p.id as purchase_id 
      FROM guest_downloads gd
      JOIN purchases p ON gd.purchase_id = p.id
      WHERE gd.token = $1 AND gd.expires_at > NOW()
    `;
    const guestResult = await pool.query(guestDownloadQuery, [token]);

    if (guestResult.rows.length === 0) {
      console.log('❌ Invalid or expired download token');
      return res.status(404).json({ error: 'Invalid or expired download link' });
    }

    // Get album and its songs
    const albumSongsQuery = `
      SELECT s.*, a.name as album_name 
      FROM songs s
      JOIN albums a ON s.album_id = a.id
      WHERE a.id = $1
      ORDER BY s.track_id
    `;
    const songsResult = await pool.query(albumSongsQuery, [albumId]);

    if (songsResult.rows.length === 0) {
      console.log('❌ Album not found or no songs');
      return res.status(404).json({ error: 'Album not found' });
    }

    const songs = songsResult.rows;
    const albumName = songs[0].album_name;

    // Generate signed URLs for all songs
    const downloadLinks = [];

    for (const song of songs) {
      const urlParts = song.audio_url.split('/');
      const bucketName = process.env.GOOGLE_CLOUD_BUCKET || 'rdxenv3-interstellar-assets';
      const bucketIndex = urlParts.findIndex(part => part === bucketName);
      const fileName = urlParts.slice(bucketIndex + 1).join('/');

      // For WAV, try to replace .mp3 with .wav in filename
      const actualFileName = format === 'wav' ? fileName.replace('.mp3', '.wav') : fileName;

      try {
        const [signedUrl] = await bucket.file(actualFileName).getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + (60 * 60 * 1000), // 1 hour
          responseDisposition: `attachment; filename="${song.name.replace(/[^a-zA-Z0-9\-_\s]/g, '')}.${format}"`,
          responseType: `audio/${format === 'wav' ? 'wav' : 'mpeg'}`
        });

        downloadLinks.push({
          name: song.name,
          url: signedUrl
        });
      } catch (error) {
        console.log(`⚠️ Could not generate signed URL for ${song.name} in ${format} format`);
        // Skip this song if WAV doesn't exist, but continue with others
      }
    }

    if (downloadLinks.length === 0) {
      return res.status(404).json({ error: `No ${format.toUpperCase()} files found for this album` });
    }

    console.log(`✅ Generated ${downloadLinks.length} signed URLs for album: ${albumName}`);

    // Return JSON with all download links
    res.json({
      album: albumName,
      format: format.toUpperCase(),
      totalFiles: downloadLinks.length,
      downloads: downloadLinks
    });

  } catch (error) {
    console.error('❌ Album download error:', error);
    res.status(500).json({ error: 'Album download failed' });
  }
});

// Placeholder for individual album download pages
// These will serve your existing /dl files

export default router;