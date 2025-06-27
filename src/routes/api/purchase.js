// src/routes/api/purchase.js - FIXED email and metadata issues
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
  
  // 🔧 FIX: Get userId from session, not req.user
  const userId = req.session?.userId || req.body.userId || null;
  console.log('🧑 userId for Stripe metadata:', userId);  // Debug log

  console.log('🧠 server received sessionId:', currentSessionId);
  console.log('🧠 server received req.body:', req.body);

  try {
    let cartItems = userId
      ? await CartModel.getCartByUserId(userId)
      : await CartModel.getCartBySession(currentSessionId);

    if ((!cartItems || cartItems.length === 0) && req.body.cartItems?.length > 0) {
      console.warn('⚠️ DB cartItems empty — falling back to req.body.cartItems');
      cartItems = req.body.cartItems;
    }

    console.log('🛒 cartItems:', cartItems);

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
    console.log('📦 Resolved cartItems:', cartItems);
    console.log('🧾 Prepared line_items:', line_items);
    console.log('🧑 userId:', userId);
    console.log('🧮 currentSessionId:', currentSessionId);

    // ✅ FIX: Use the ORIGINAL cart session ID from the request body
    const originalCartSessionId = req.body.sessionId || currentSessionId;
    console.log('🛒 originalCartSessionId:', originalCartSessionId);

    // DEBUGGING: Add this log BEFORE creating the session:
    console.log('🔍 Metadata being sent to Stripe:', {
      userId: userId?.toString() || '',
      sessionId: originalCartSessionId || '',
      client_reference_id: originalCartSessionId || null,
      email: req.body.email || 'will be collected by Stripe'
    });

    console.log('📤 Sending to Stripe...');

    // ✅ FIXED: Proper email handling and metadata
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
      
      // ✅ CRITICAL: Add metadata for webhook
      metadata: {
        userId: userId?.toString() || '',
        sessionId: originalCartSessionId || '',
        cartItemsCount: cartItems?.length || 0
      },
      
      // ✅ CRITICAL: Also set client_reference_id as backup
      client_reference_id: originalCartSessionId || null,
      
      // ✅ Force email collection by Stripe
      customer_creation: 'always', // This ensures we get customer email
    };

    // ✅ Only add customer_email if we have a valid email
    const userEmail = req.body.email;
    if (userEmail && userEmail.includes('@') && userEmail.trim() !== '') {
      sessionConfig.customer_email = userEmail;
      console.log('📧 Pre-filling email:', userEmail);
    } else {
      console.log('📧 No email provided - Stripe will collect during checkout');
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // DEBUGGING: Add this log AFTER creating the session:
    console.log('✅ Stripe session created with metadata:', {
      id: session.id,
      metadata: session.metadata,
      client_reference_id: session.client_reference_id
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('❌ Error creating Stripe session:', error);
    res.status(500).json({ error: 'Internal server error during checkout' });
  }
});

export default router;