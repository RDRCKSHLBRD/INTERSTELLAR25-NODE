const express = require('express');
const path = require('path');
const router = express.Router();

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

module.exports = router;