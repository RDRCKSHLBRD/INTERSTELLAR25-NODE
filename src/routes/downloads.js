import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Directory fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Placeholder for individual album download pages
// These will serve your existing /dl files

router.get('/charlotta', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/downloads/charlotta.html'));
});

router.get('/domes', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/downloads/domes.html'));
});

router.get('/glass-city', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/downloads/glass-city.html'));
});

router.get('/object-particle', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/downloads/object-particle.html'));
});

export default router;