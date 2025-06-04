const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./config/database');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({
      status: 'OK',
      database: dbConnected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// Basic API routes
app.use('/api/artists', require('./routes/api/artists'));
app.use('/api/albums', require('./routes/api/albums'));
app.use('/api/songs', require('./routes/api/songs'));

// Simple fallback for SPA
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  const dbConnected = await testConnection();
  console.log(`📊 Database: ${dbConnected ? 'connected' : 'disconnected'}`);
  console.log(`🎵 Visit: http://localhost:${PORT}`);
});

module.exports = app;