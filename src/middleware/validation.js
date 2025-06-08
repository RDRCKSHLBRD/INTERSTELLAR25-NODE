// src/middleware/validation.js
// Validation middleware for API requests

// Validate cart data
export const validateCart = (req, res, next) => {
  const { userId, sessionId } = req.body;
  
  if (!userId && !sessionId) {
    return res.status(400).json({
      error: 'Either userId or sessionId is required'
    });
  }
  
  next();
};

// Validate cart item data
export const validateCartItem = (req, res, next) => {
  const { productId, quantity } = req.body;
  
  // Check required fields
  if (!productId) {
    return res.status(400).json({
      error: 'Product ID is required'
    });
  }
  
  // Validate quantity if provided
  if (quantity !== undefined) {
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({
        error: 'Quantity must be a positive integer'
      });
    }
    
    if (qty > 999) {
      return res.status(400).json({
        error: 'Quantity cannot exceed 999'
      });
    }
  }
  
  next();
};

// Validate product data
export const validateProduct = (req, res, next) => {
  const { name, price, cat_id } = req.body;
  
  if (!name || !price || !cat_id) {
    return res.status(400).json({
      error: 'Name, price, and cat_id are required'
    });
  }
  
  const priceNum = parseFloat(price);
  if (isNaN(priceNum) || priceNum < 0) {
    return res.status(400).json({
      error: 'Price must be a valid positive number'
    });
  }
  
  next();
};

// Validate user registration data
export const validateRegistration = (req, res, next) => {
  const { user_name, email, password } = req.body;
  
  if (!user_name || !email || !password) {
    return res.status(400).json({
      error: 'Username, email, and password are required'
    });
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Invalid email format'
    });
  }
  
  // Password strength validation
  if (password.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters long'
    });
  }
  
  next();
};

// Validate login data
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required'
    });
  }
  
  next();
};

// General ID validation
export const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({
        error: `${paramName} is required`
      });
    }
    
    const numId = parseInt(id);
    if (isNaN(numId) || numId < 1) {
      return res.status(400).json({
        error: `${paramName} must be a positive integer`
      });
    }
    
    next();
  };
};