const express = require('express');
const router = express.Router();

// Placeholder purchase/Stripe routes - we'll implement these later
router.post('/create-session', (req, res) => {
  res.json({ message: 'Stripe payment session - coming soon' });
});

router.post('/webhook', (req, res) => {
  res.json({ message: 'Stripe webhook - coming soon' });
});

module.exports = router;