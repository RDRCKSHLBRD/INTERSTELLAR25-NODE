// src/routes/api/purchase.js - UPDATED with Guest Checkout Support
import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import CartModel from '../../models/CartModel.js';
import { resolveSessionId } from '../../utils/helpers.js';
import { recordPurchase } from '../../utils/purchaseHelpers.js';

dotenv.config();
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/purchase/create-session
router.post('/create-session', async (req, res) => {
  const currentSessionId = resolveSessionId(req);
  
  // Get userId from session (will be null for guests)
  const userId = req.session?.userId || req.body.userId || null;
  
  // Get guest email if provided
  const guestEmail = req.body.guestEmail || null;
  
  // Determine purchase type
  const isLoggedIn = userId !== null;
  const purchaseType = isLoggedIn ? 'user' : 'guest';
  
  console.log('🧑 Purchase request:', {
    userId,
    guestEmail,
    purchaseType,
    isLoggedIn
  });

  // Validation: Guest purchases must have email
  if (!isLoggedIn && !guestEmail) {
    return res.status(400).json({ 
      error: 'Email is required for guest purchases' 
    });
  }

  // Validation: Email format check for guests
  if (guestEmail && !guestEmail.includes('@')) {
    return res.status(400).json({ 
      error: 'Please enter a valid email address' 
    });
  }

  console.log('🧠 server received sessionId:', currentSessionId);
  console.log('🧠 server received req.body:', req.body);

  try {
    // Get cart items based on user type
    let cartItems;
    if (isLoggedIn) {
      cartItems = await CartModel.getCartByUserId(userId);
    } else {
      cartItems = await CartModel.getCartBySession(currentSessionId);
    }

    // Fallback to request body if cart is empty
    if ((!cartItems || cartItems.length === 0) && req.body.cartItems?.length > 0) {
      console.warn('⚠️ DB cartItems empty — falling back to req.body.cartItems');
      cartItems = req.body.cartItems;
    }

    // Validation: Must have items to purchase
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ 
        error: 'No items in cart to purchase' 
      });
    }

    console.log('🛒 cartItems:', cartItems);

    // Create Stripe line items
    const line_items = cartItems.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.album_name || item.product_name || 'Untitled',
          description: item.description || '',
        },
        unit_amount: Math.round(parseFloat(item.price) * 100), // price in cents
      },
      quantity: item.quantity
    }));

    console.log('🧾 line_items:', line_items);

    // Use original cart session ID from request body
    const originalCartSessionId = req.body.sessionId || currentSessionId;
    console.log('🛒 originalCartSessionId:', originalCartSessionId);

    // Prepare metadata for Stripe
    const metadata = {
      cartItemsCount: cartItems?.length || 0,
      sessionId: originalCartSessionId || '',
      purchaseType: purchaseType
    };

    // Add user-specific or guest-specific metadata
    if (isLoggedIn) {
      metadata.userId = userId.toString();
    } else {
      metadata.guestEmail = guestEmail;
    }

    console.log('🔍 Metadata being sent to Stripe:', {
      ...metadata,
      client_reference_id: originalCartSessionId || null
    });

    console.log('📤 Sending to Stripe...');

    // Create Stripe session configuration
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
      
      // Metadata for webhook processing
      metadata: metadata,
      client_reference_id: originalCartSessionId || null,
      
      // Force email collection for all purchases
      customer_creation: 'always',
    };

    // Pre-fill email if available
    if (isLoggedIn) {
      // For logged-in users, let Stripe collect email (or get from user account)
      console.log('📧 Logged-in user - Stripe will collect email');
    } else {
      // For guests, pre-fill the email they provided
      sessionConfig.customer_email = guestEmail;
      console.log('📧 Pre-filling guest email:', guestEmail);
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ Stripe session created with metadata:', {
      id: session.id,
      metadata: session.metadata,
      client_reference_id: session.client_reference_id,
      customer_email: session.customer_email
    });

    res.json({ id: session.id });
    
  } catch (error) {
    console.error('❌ Error creating Stripe session:', error);
    res.status(500).json({ error: 'Internal server error during checkout' });
  }
});

export default router;