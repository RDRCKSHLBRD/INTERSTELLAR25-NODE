// src/routes/api/purchase.js - FIXED to pass correct session ID AND userId
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

    console.log('📤 Sending to Stripe...');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
      customer_email: req.user?.email || undefined,
      client_reference_id: originalCartSessionId,  // ✅ Use original cart session ID
      metadata: {
        userId: userId ? String(userId) : '',  // 🔧 ENSURE STRING AND ACTUAL USER ID
        sessionId: originalCartSessionId       // ✅ Use original cart session ID
      }
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('❌ Error creating Stripe session:', error);
    res.status(500).json({ error: 'Internal server error during checkout' });
  }
});

export default router;