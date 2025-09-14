import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate required environment variables
const requiredEnvVars = [
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  console.error('Please ensure all required variables are set.');
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
    bucket: process.env.GOOGLE_CLOUD_BUCKET || 'rdxenv3-interstellar-assets'
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

// Google Cloud Credentials Configuration
if (config.nodeEnv === 'production' && process.env.K_SERVICE) {
  // Running on Google Cloud Run - use default service account
  console.log('Using default Cloud Run service account credentials');
} else if (config.nodeEnv === 'production' && process.env.GCLOUD_SERVICE_ACCOUNT_KEY_BASE64) {
  // Use explicit credentials for other production platforms
  try {
    const credentialsJson = Buffer.from(process.env.GCLOUD_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf8');
    const tempDirPath = '/tmp';
    const tempFilePath = path.join(tempDirPath, 'gcloud-key.json');

    if (!fs.existsSync(tempDirPath)) {
      fs.mkdirSync(tempDirPath, { recursive: true });
    }

    fs.writeFileSync(tempFilePath, credentialsJson);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tempFilePath;
    console.log('Google Cloud credentials loaded from environment variable to temporary file.');
  } catch (error) {
    console.error('Error processing Google Cloud credentials from base64:', error);
    process.exit(1);
  }
} else if (config.nodeEnv === 'production') {
  // In production on non-Google platforms, require explicit credentials
  console.error('In production on non-Google Cloud platforms, GCLOUD_SERVICE_ACCOUNT_KEY_BASE64 environment variable is required.');
  process.exit(1);
} else {
  // Development mode - use Application Default Credentials
  console.log('Using Application Default Credentials for local development');
  // Do not set GOOGLE_APPLICATION_CREDENTIALS - let ADC handle it automatically
}

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

export default config;