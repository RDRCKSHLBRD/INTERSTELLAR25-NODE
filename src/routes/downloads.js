const express = require('express');
const path = require('path');
const router = express.Router();

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

module.exports = router;