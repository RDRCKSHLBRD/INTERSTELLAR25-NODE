// src/middleware/rateLimiter.js — V1.1 (CORRECTED)
// Rate-limiting strategy for Interstellar V7.3
// Phases: IP-based general limits + session-aware cart limits
// No full auth required (works with session/anonymous users)
// 
// FIXED: Merged duplicate 'skip' property into single function

import rateLimit from 'express-rate-limit';

// ============================================================================
// GENERAL API LIMITER — Read operations (albums, artists, songs, etc)
// ============================================================================
// 100 requests per 15 minutes per IP
// Allows moderate browsing, blocks bots doing mass scraping

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,           // 15 minutes
  max: 100,                            // 100 requests per window
  keyGenerator: (req) => req.ip,       // Key by IP address
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  },
  // ✅ FIXED: Single skip function combining both conditions
  skip: (req) => 
    process.env.NODE_ENV === 'development' || 
    ['HEAD', 'OPTIONS'].includes(req.method),
  standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,   // Disable `X-RateLimit-*` headers
});

// ============================================================================
// CART LIMITER — Write operations (add, update, remove cart items)
// ============================================================================
// 20 requests per minute per (IP + sessionId)
// Blocks bulk cart manipulation / checkout spam

export const cartLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,             // 1 minute
  max: 20,                             // 20 cart ops per window
  keyGenerator: (req) => {
    // Key combines IP + session user ID to prevent session switching spam
    const ip = req.ip;
    const sessionId = req.session?.id || 'anon';
    const userId = req.session?.userId || 'null';
    return `${ip}:${userId}:${sessionId}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Cart rate limit exceeded',
      message: 'Too many cart operations. Please wait before trying again.',
      retryAfter: req.rateLimit.resetTime
    });
  },
  // ✅ FIXED: Single skip function combining both conditions
  skip: (req) => 
    process.env.NODE_ENV === 'development' || 
    ['HEAD', 'OPTIONS'].includes(req.method),
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// AUTHENTICATION LIMITER — Login/signup attempts
// ============================================================================
// 5 attempts per 15 minutes per IP
// Prevents credential brute-force attacks
// (Ready for Phase 3 when auth is added)

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,            // 15 minutes
  max: 5,                              // 5 auth attempts per window
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many auth attempts',
      message: 'Account temporarily locked. Try again in 15 minutes.',
      retryAfter: req.rateLimit.resetTime
    });
  },
  // ✅ FIXED: Single skip function
  skip: (req) => 
    process.env.NODE_ENV === 'development' || 
    ['HEAD', 'OPTIONS'].includes(req.method),
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// ACCOUNT CREATION LIMITER — User/artist registration
// ============================================================================
// 3 account creations per hour per IP
// Prevents bot account farm spam (for POST /api/artists, etc)

export const accountCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,            // 1 hour
  max: 3,                              // 3 new accounts per window
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many account creation attempts',
      message: 'Account creation limit exceeded. Try again in 1 hour.',
      retryAfter: req.rateLimit.resetTime
    });
  },
  // ✅ FIXED: Single skip function
  skip: (req) => 
    process.env.NODE_ENV === 'development' || 
    ['HEAD', 'OPTIONS'].includes(req.method),
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// CHECKOUT LIMITER — Stripe payment attempts
// ============================================================================
// 5 checkout attempts per 10 minutes per session
// Prevents payment spam / failed checkout loops

export const checkoutLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,            // 10 minutes
  max: 5,                              // 5 checkouts per window
  keyGenerator: (req) => {
    const ip = req.ip;
    const userId = req.session?.userId || req.headers['x-session-id'] || 'anon';
    return `${ip}:${userId}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Checkout rate limit exceeded',
      message: 'Too many checkout attempts. Please wait before trying again.',
      retryAfter: req.rateLimit.resetTime
    });
  },
  // ✅ FIXED: Single skip function
  skip: (req) => 
    process.env.NODE_ENV === 'development' || 
    ['HEAD', 'OPTIONS'].includes(req.method),
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// CONTACT FORM LIMITER — Nodemailer submissions
// ============================================================================
// 3 emails per 24 hours per IP
// Prevents spam email bombing via contact form

export const contactFormLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,       // 24 hours
  max: 3,                              // 3 emails per window
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Contact form rate limit exceeded',
      message: 'You have reached the contact form submission limit. Try again tomorrow.',
      retryAfter: req.rateLimit.resetTime
    });
  },
  // ✅ FIXED: Single skip function
  skip: (req) => 
    process.env.NODE_ENV === 'development' || 
    ['HEAD', 'OPTIONS'].includes(req.method),
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// APPLY-LIMITERS FUNCTION — Attach to Express app
// ============================================================================
// Usage in src/server.mjs:
//   applyRateLimiters(app);

export function applyRateLimiters(app) {
  // General API reads (albums, artists, songs)
  app.use('/api/albums/', generalLimiter);
  app.use('/api/artists/', generalLimiter);
  app.use('/api/songs/', generalLimiter);

  // Cart operations (cart is already protected by auth check in cartRoute.js)
  app.use('/api/cart/add', cartLimiter);
  app.use('/api/cart/update/', cartLimiter);
  app.use('/api/cart/remove/', cartLimiter);

  // Auth (ready for Phase 3)
  // app.use('/api/auth/login', authLimiter);
  // app.use('/api/auth/signup', authLimiter);

  // Account creation (ready for Phase 3)
  // app.use('/api/artists', accountCreationLimiter);

  // Checkout (ready for Stripe integration)
  // app.use('/api/purchase/create', checkoutLimiter);

  // Contact form (ready for Phase 2)
  // app.use('/api/contact', contactFormLimiter);

  console.log('✅ Rate limiters applied (development mode skips limits)');
}

// ============================================================================
// MONITORING & LOGGING (Optional — attach to limiters for insight)
// ============================================================================
// If you want to log rate-limit hits, add this to server.mjs after applyRateLimiters():

export function enableRateLimitLogging(app) {
  app.use((req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode === 429) {
        console.warn(
          `⚠️  Rate limited: ${req.method} ${req.path} ` +
          `- IP: ${req.ip} - User: ${req.session?.userId || 'anon'}`
        );
      }
    });
    next();
  });
}

// Usage in server.mjs (optional):
//   if (config.nodeEnv === 'production') {
//     enableRateLimitLogging(app);
//   }