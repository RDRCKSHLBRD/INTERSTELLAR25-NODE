// server.mjs – ESM version of Express server for Interstellar Packages

import express from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/environment.js';
import { testConnection, closePool } from './config/database.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import route modules
import artistRoutes from './routes/api/artists.js';
import albumRoutes from './routes/api/albums.js';
import songRoutes from './routes/api/songs.js';
import authRoutes from './routes/api/auth.js';
import cartRoutes from './routes/api/cartRoute.js';
import purchaseWebhook from './routes/api/purchaseWebhook.js';
import purchaseRoutes from './routes/api/purchase.js';
import pageRoutes from './routes/pages.js';
import downloadRoutes from './routes/downloads.js';
import healthRoutes from './routes/api/health.js';

// Import middleware
import errorHandler from './middleware/errorHandler.js';

const app = express();


// EJS ::

// EJS Configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make session data available to all templates
app.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  res.locals.authenticated = !!req.session?.userId;
  next();
});

// Security middleware
// REPLACE THIS SECTION IN src/server.js:

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "https://js.stripe.com"],
        imgSrc: ["'self'", "https://storage.googleapis.com", "data:"],
        mediaSrc: ["'self'", "https://storage.googleapis.com"],
        connectSrc: ["'self'", "https://api.stripe.com", "https://checkout.stripe.com","https://storage.googleapis.com"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'self'", "https://player.vimeo.com", "https://js.stripe.com", "https://hooks.stripe.com"]
      }
    }
  })
);

// Session configuration (must be before CORS and routes)
app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === 'production', // HTTPS only in production
      httpOnly: true, // Prevent XSS attacks
      maxAge: config.session.maxAge, // 7 days from config
      sameSite: 'lax' // CSRF protection
    },
    name: 'interstellar.sid' // Custom session cookie name
  })
);

// CORS configuration (must be after session for credentials)
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true, // Important for sessions!
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use('/api/purchase/webhook', purchaseWebhook);


// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use(express.static(path.join(__dirname, '../public')));

// Request logging middleware (development only)
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.session?.userId) {
      console.log(`👤 User: ${req.session.userId} (${req.session.user?.user_name})`);
    }
    next();
  });
}

// API Routes
app.use('/api/artists', artistRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/health', healthRoutes);

// Page routes (serve HTML pages)
app.use('/', pageRoutes);

// Download routes (individual album pages)
app.use('/', downloadRoutes);

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
        health: '/api/health'
      },
      authentication: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
        status: 'GET /api/auth/status'
      }
    });
  });
}

// Simple fallback for any unmatched routes
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    console.log('🔗 Testing database connection...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ Database connection failed. Please check your configuration.');
      process.exit(1);
    }

    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📊 Health check: http://localhost:${config.port}/api/health`);
      console.log(`🎵 Main app: http://localhost:${config.port}`);
      console.log(`🔐 Auth endpoints: http://localhost:${config.port}/api/auth`);

      if (config.enableApiDocs) {
        console.log(`📖 API docs: http://localhost:${config.port}/api`);
      }

      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`🍪 Session settings: ${config.nodeEnv === 'production' ? 'Secure cookies' : 'Development cookies'}`);
    });

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

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;