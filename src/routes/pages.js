import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Directory fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static HTML pages
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

router.get('/filmography', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/filmography.html'));
});

router.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/contact.html'));
});

export default router;