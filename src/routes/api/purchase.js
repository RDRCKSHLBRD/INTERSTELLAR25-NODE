// src/routes/api/purchase.js
import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import CartModel from '../../models/CartModel.js';
import { resolveSessionId } from '../../utils/helpers.js';
import { recordPurchase } from '../../utils/purchaseHelpers.js'; // we'll create this


dotenv.config();
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// POST /api/purchase/create-session
router.post('/create-session', async (req, res) => {
  const sessionId = resolveSessionId(req);
  const userId = req.user?.id || null;

  try {
    const cartItems = userId
      ? await CartModel.getCartByUserId(userId)
      : await CartModel.getCartBySession(sessionId);

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

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

    const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  mode: 'payment',
  line_items,
  success_url: `${process.env.CLIENT_URL}/success`,
  cancel_url: `${process.env.CLIENT_URL}/cancel`,
  customer_email: req.user?.email || undefined, // <- if you already have their email
  metadata: {
    userId: userId || '',
    sessionId: sessionId
  }
});


    res.json({ id: session.id });
  } catch (error) {
    console.error('❌ Error creating Stripe session:', error);
    res.status(500).json({ error: 'Internal server error during checkout' });
  }
});



export default router;
