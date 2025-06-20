//purchaseWebhook.js - FIXED to use correct session ID
// src/routes/api/purchaseWebhook.js
import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { recordPurchase } from '../../utils/purchaseHelpers.js';

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Debug logging
console.log('🔧 Webhook config check:');
console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING');
console.log('- STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'MISSING');

router.post(
  '/',
  express.raw({ type: 'application/json' }), // ⬅️ must be raw
  async (req, res) => {
    console.log('🔔 Webhook received!');
    console.log('- Headers:', req.headers);
    console.log('- Body length:', req.body?.length);
    
    const sig = req.headers['stripe-signature'];
    console.log('- Stripe signature:', sig ? 'PRESENT' : 'MISSING');

    if (!endpointSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).send('Webhook secret not configured');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      console.log('✅ Webhook signature verified');
      console.log('📦 Event type:', event.type);
    } catch (err) {
      console.error('❌ Stripe signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('🛒 Checkout session completed:', {
          id: session.id,
          client_reference_id: session.client_reference_id,
          metadata: session.metadata,
          customer_email: session.customer_email
        });

        const userId = session.metadata?.userId || null;
        
        // ✅ FIX: Use the original session ID from client_reference_id or metadata.sessionId
        const originalSessionId = session.metadata?.sessionId || session.client_reference_id || null;
        
        const email = session.customer_email || null;

        console.log('✅ Stripe checkout completed:', { 
          originalSessionId, 
          userId, 
          email,
          stripeSessionId: session.id 
        });

        if (!originalSessionId) {
          console.error('❌ No original session ID found in Stripe session');
          return res.status(400).send('Missing original session ID');
        }

        try {
          const purchaseId = await recordPurchase({ 
            stripeSessionId: session.id,
            sessionId: originalSessionId,  // ✅ Use original session ID to find cart
            userId, 
            email,
            totalAmount: session.amount_total / 100, // Convert from cents
            currency: session.currency
          });
          console.log('📦 Purchase recorded successfully with ID:', purchaseId);
        } catch (error) {
          console.error('❌ Failed to record purchase:', error);
          // Don't return error - let Stripe know we received the webhook
        }

        break;
      }

      default:
        console.log(`ℹ️ Unhandled Stripe event: ${event.type}`);
    }

    console.log('✅ Webhook processed successfully');
    res.status(200).json({ received: true });
  }
);

export default router;