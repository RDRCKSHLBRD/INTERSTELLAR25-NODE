const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config/environment');
const { testConnection, closePool } = require('./config/database');

// Import route modules
const artistRoutes = require('./routes/api/artists');
const albumRoutes = require('./routes/api/albums');
const songRoutes = require('./routes/api/songs');
const authRoutes = require('./routes/api/auth');
const purchaseRoutes = require('./routes/api/purchase');
const pageRoutes = require('./routes/pages');
const downloadRoutes = require('./routes/downloads');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "https://storage.googleapis.com", "data:"],
      mediaSrc: ["'self'", "https://storage.googleapis.com"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'", "https://player.vimeo.com"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use(express.static(path.join(__dirname, '../public')));

// Request logging middleware (development only)
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      environment: config.nodeEnv
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/artists', artistRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/purchase', purchaseRoutes);

// Page routes (serve HTML pages)
app.use('/', pageRoutes);

// Download routes (individual album pages)
app.use('/dl', downloadRoutes);

// API documentation (development only)
if (config.enableApiDocs) {
  app.get('/api', (req, res) => {
    res.json({
      message: 'Interstellar Packages API',
      version: '1.0.0',
      endpoints: {
        artists: '/api/artists',
        albums: '/api/albums',
        songs: '/api/songs',
        auth: '/api/auth',
        purchase: '/api/purchase',
        health: '/health'
      },
      documentation: {
        'GET /api/artists': 'Get all artists',
        'GET /api/albums': 'Get all albums',
        'GET /api/albums/:id': 'Get specific album with songs',
        'GET /api/songs': 'Get all songs',
        'GET /api/songs/:id': 'Get specific song',
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'GET /health': 'Health check'
      }
    });
  });
}

// Simple fallback for any unmatched routes
app.use((req, res) => {
  // Handle API 404s
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Serve index.html for all other routes (SPA behavior)
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    console.log('🔗 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Database connection failed. Please check your configuration.');
      process.exit(1);
    }

    // Start the server
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📊 Health check: http://localhost:${config.port}/health`);
      console.log(`🎵 Main app: http://localhost:${config.port}`);
      
      if (config.enableApiDocs) {
        console.log(`📖 API docs: http://localhost:${config.port}/api`);
      }
      
      console.log(`🌍 Environment: ${config.nodeEnv}`);
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      console.log('\n🛑 Received shutdown signal. Gracefully shutting down...');
      
      server.close(async () => {
        console.log('✅ HTTP server closed');
        
        try {
          await closePool();
          console.log('✅ Database connections closed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
if (require.main === module) {
  startServer();
}

module.exports = app;