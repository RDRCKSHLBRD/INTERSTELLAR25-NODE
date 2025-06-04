const express = require('express');
const router = express.Router();

// Placeholder auth routes - we'll implement these later
router.post('/register', (req, res) => {
  res.json({ message: 'Auth registration - coming soon' });
});

router.post('/login', (req, res) => {
  res.json({ message: 'Auth login - coming soon' });
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Auth logout - coming soon' });
});

module.exports = router;