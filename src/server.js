// server.mjs – ESM version of Express server for Interstellar Packages

import express from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/environment.js';
import { testConnection, closePool } from './config/database.js';
import { Storage } from '@google-cloud/storage';

const isProd = config.nodeEnv === 'production';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = new Storage();
const bucketName = 'rdxenv3-interstellar-assets';

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



// Cloud Run/HTTPS proxy awareness (MUST be before session)
if (isProd) app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet({

    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,


    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        // 👇 CSP PATCH: Corrected array syntax and included the inline script hash.
        scriptSrc: [
          "'self'", 
          "https://js.stripe.com",
          "'sha256-LirTtLksfeCbNz2wk0GaS/SuK6zjbd3U6QCrbRECK5Y='" 
        ],
        imgSrc: ["'self'", "https://storage.googleapis.com", "data:"],
        mediaSrc: ["'self'", "https://storage.googleapis.com"],
        connectSrc: ["'self'", "https://api.stripe.com", "https://checkout.stripe.com", "https://storage.googleapis.com"],
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
     secure: isProd,               // HTTPS only in production
      httpOnly: true, // Prevent XSS attacks
      maxAge: config.session.maxAge, // 7 days from config
      // 👇 AUTH PATCH: Use 'lax' in dev for SameSite to ensure the cookie is sent.
      sameSite: isProd ? 'none' : 'lax'
    },
    name: 'interstellar.sid' // keep; or switch to "__Secure-interstellar" if you add a Domain
  })
);



// Make session data available to all templates (AFTER session)
app.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  res.locals.authenticated = !!req.session?.userId;
  next();
});




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
app.use('/system', express.static(path.join(__dirname, '../system')));
app.use('/config.json', express.static(path.join(__dirname, '../config.json')));
app.use('/config', express.static(path.join(__dirname, '../config')));  // ← ADD THIS LINE


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







// Authenticated audio serving route
app.get(/^\/api\/audio\/(.*)$/, async (req, res) => {
  try {
    const audioPath = req.params[0];
    const file = storage.bucket(bucketName).file(audioPath);
    const [exists] = await file.exists();

    if (!exists) {
      return res.status(404).send('Audio not found');
    }

    const [metadata] = await file.getMetadata();
    res.set({
      'Content-Type': metadata.contentType || 'audio/mpeg',
      'Cache-Control': 'public, max-age=3600',
      'Content-Length': metadata.size,
      'Accept-Ranges': 'bytes'
    });

    const stream = file.createReadStream();
    stream.pipe(res);
  } catch (error) {
    console.error('Audio serving error:', error);
    res.status(500).send('Server error');
  }
});

// Authenticated image serving route
app.get(/^\/api\/image\/(.*)$/, async (req, res) => {
  try {
    const imagePath = req.params[0];
    const file = storage.bucket(bucketName).file(imagePath);
    const [exists] = await file.exists();

    if (!exists) {
      return res.status(404).send('Image not found');
    }

    const [metadata] = await file.getMetadata();
    res.set({
      'Content-Type': metadata.contentType || 'image/png',
      'Cache-Control': 'public, max-age=86400'
    });

    const stream = file.createReadStream();
    stream.pipe(res);
  } catch (error) {
    console.error('Image serving error:', error);
    res.status(500).send('Server error');
  }
});

// API Routes
app.use('/api/artists', artistRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/health', healthRoutes);

// Config endpoint for frontend
app.get('/api/config', (req, res) => {
  res.json({
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

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

    const server = app.listen(config.port, "0.0.0.0", () => {
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