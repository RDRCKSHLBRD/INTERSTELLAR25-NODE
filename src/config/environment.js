require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  console.error('Please check your .env file');
  process.exit(1);
}

const config = {
  // Server configuration
  port: parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    url: process.env.DATABASE_URL
  },
  
  // Security configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  session: {
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  
  // Stripe configuration
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },
  
  // Google Cloud Storage
  googleCloud: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    keyFile: process.env.GOOGLE_CLOUD_KEY_FILE,
    bucket: process.env.GOOGLE_CLOUD_BUCKET || 'ip-public-bucket1'
  },
  
  // CORS settings
  cors: {
    origins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['http://localhost:3000', 'http://localhost:3001']
  },
  
  // File upload settings
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3']
  }
};

// Development-specific settings
if (config.nodeEnv === 'development') {
  config.logLevel = 'debug';
  config.enableApiDocs = true;
}

// Production-specific settings
if (config.nodeEnv === 'production') {
  config.logLevel = 'info';
  config.enableApiDocs = false;
  
  // Additional security in production
  config.security = {
    enableHelmet: true,
    enableRateLimit: true,
    rateLimitMax: 100, // requests per window
    rateLimitWindow: 15 * 60 * 1000 // 15 minutes
  };
}

module.exports = config;