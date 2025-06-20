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

export default router;