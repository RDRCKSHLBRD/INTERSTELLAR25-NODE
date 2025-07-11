import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../../config/database.js';
import CartModel from '../../models/CartModel.js';

const router = express.Router();

// POST /api/auth/register - User registration
router.post('/register', async (req, res, next) => {
  try {
    const { user_name, name_first, name_last, email, password } = req.body;

    // Validation
    if (!user_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR user_name = $2',
      [email, user_name]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await query(
      `INSERT INTO users (user_name, name_first, name_last, email, password_hash) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, user_name, name_first, name_last, email, created_at`,
      [user_name, name_first || null, name_last || null, email, password_hash]
    );

    const user = newUser.rows[0];

    // Set session
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      user_name: user.user_name,
      name_first: user.name_first,
      name_last: user.name_last,
      email: user.email
    };



if (req.session.sessionId) {
  try {
    await CartModel.migrateSessionCartToUser(req.session.sessionId, user.id);
  } catch (err) {
    console.error('Cart migration failed:', err);
    // Don't fail login if cart migration fails
  }
}


    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: req.session.user
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login - User login
// REPLACE the login route in src/routes/api/auth.js with this:

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const userResult = await query(
      'SELECT id, user_name, name_first, name_last, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // 🔧 CAPTURE SESSION ID from headers before setting session
    const sessionId = req.headers['x-session-id'] || req.session.sessionId;
    console.log(`🔍 Login attempt - sessionId from headers: ${sessionId}`);

    // Set session
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      user_name: user.user_name,
      name_first: user.name_first,
      name_last: user.name_last,
      email: user.email
    };

    // 🔄 CART MIGRATION with captured session ID
    if (sessionId) {
      try {
        console.log(`🔄 Attempting cart migration for session: ${sessionId} → user: ${user.id}`);
        await CartModel.migrateSessionCartToUser(sessionId, user.id);
        console.log(`✅ Cart migration completed for user ${user.id}`);
      } catch (err) {
        console.error('❌ Cart migration failed:', err);
        // Don't fail login if cart migration fails
      }
    } else {
      console.log('📭 No session ID found for cart migration');
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: req.session.user
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout - User logout
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Could not log out'
        });
      }
      
      res.clearCookie('connect.sid'); // Default session cookie name
      res.json({
        success: true,
        message: 'Logout successful'
      });
    });
  } else {
    res.json({
      success: true,
      message: 'No active session'
    });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Get fresh user data from database
    const userResult = await query(
      'SELECT id, user_name, name_first, name_last, email, created_at, last_login FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (userResult.rows.length === 0) {
      // Session exists but user doesn't - clear session
      req.session.destroy();
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        user_name: user.user_name,
        name_first: user.name_first,
        name_last: user.name_last,
        email: user.email,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/auth/status - Quick auth status check
router.get('/status', (req, res) => {
  res.json({
    success: true,
    authenticated: !!req.session.userId,
    userId: req.session.userId || null
  });
});

export default router;