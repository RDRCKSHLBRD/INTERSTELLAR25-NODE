import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Directory fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static HTML pages

//HOME
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});


//FILMOGRAPHY
router.get('/filmography', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/filmography.html'));
});


//CONTACT
router.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/contact.html'));
});


// Success page
router.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/success.html'));
});

// Cancel page  
router.get('/cancel', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/cancel.html'));
});


// ALBUM PAGE — single template, data-driven
router.get('/album/:catalogue', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/album.html'));
});
 
// ARTIST PAGES — boilerplate for alternate artist names
router.get('/artist/rodux', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/artist-rodux.html'));
});
router.get('/artist/betacarotine', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/artist-betacarotine.html'));
});
router.get('/artist/3ofcups', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/artist-3ofcups.html'));
});
 








export default router;