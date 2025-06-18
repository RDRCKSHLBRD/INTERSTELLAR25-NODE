//purchaseWebhook.js
// src/routes/api/purchaseWebhook.js
import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { recordPurchase } from '../../utils/purchaseHelpers.js';

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post(
  '/',
  express.raw({ type: 'application/json' }), // ⬅️ must be raw
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('❌ Stripe signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        const userId = session.metadata?.userId || null;
        const sessionId = session.metadata?.sessionId || null;
        const email = session.customer_email || null;

        console.log('✅ Stripe checkout completed:', { sessionId, userId, email });

        try {
          await recordPurchase({ sessionId, userId, email });
          console.log('📦 Purchase recorded');
        } catch (error) {
          console.error('❌ Failed to record purchase:', error);
        }

        break;
      }

      default:
        console.log(`ℹ️ Unhandled Stripe event: ${event.type}`);
    }

    res.status(200).json({ received: true });
  }
);

export default router;
