//purchaseWebhook.js - FIXED to clear cart after purchase
// src/routes/api/purchaseWebhook.js
import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { recordPurchase } from '../../utils/purchaseHelpers.js';
import { query } from '../../config/database.js';

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Debug logging
console.log('🔧 Webhook config check:');
console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING');
console.log('- STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'MISSING');

// ✅ ADD THESE CART CLEARING FUNCTIONS
async function clearUserCart(userId) {
  try {
    console.log(`🧹 Clearing cart for user ${userId}`);
    
    // Delete cart items for this user
    const deleteItemsQuery = `
      DELETE FROM cart_items 
      WHERE cart_id IN (
        SELECT id FROM carts WHERE user_id = $1
      )
    `;
    const itemsResult = await query(deleteItemsQuery, [userId]);
    console.log(`✅ Deleted ${itemsResult.rowCount} cart items for user ${userId}`);
    
    return itemsResult.rowCount;
  } catch (error) {
    console.error(`❌ Error clearing cart for user ${userId}:`, error);
    throw error;
  }
}

async function clearSessionCart(sessionId) {
  try {
    console.log(`🧹 Clearing cart for session ${sessionId}`);
    
    // Delete cart items for this session
    const deleteItemsQuery = `
      DELETE FROM cart_items 
      WHERE cart_id IN (
        SELECT id FROM carts WHERE session_id = $1
      )
    `;
    const itemsResult = await query(deleteItemsQuery, [sessionId]);
    console.log(`✅ Deleted ${itemsResult.rowCount} cart items for session ${sessionId}`);
    
    return itemsResult.rowCount;
  } catch (error) {
    console.error(`❌ Error clearing cart for session ${sessionId}:`, error);
    throw error;
  }
}

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
          // Record the purchase first
          const purchaseId = await recordPurchase({ 
            stripeSessionId: session.id,
            sessionId: originalSessionId,  // ✅ Use original session ID to find cart
            userId, 
            email,
            totalAmount: session.amount_total / 100, // Convert from cents
            currency: session.currency
          });
          console.log('📦 Purchase recorded successfully with ID:', purchaseId);

          // ✅ NEW: Clear the cart after successful purchase
          let clearedItems = 0;
          
          if (userId && userId !== 'null' && userId !== null) {
            // Clear user cart
            clearedItems = await clearUserCart(userId);
            console.log(`🧹 Cleared ${clearedItems} items from user ${userId} cart`);
          } else if (originalSessionId) {
            // Clear session cart
            clearedItems = await clearSessionCart(originalSessionId);
            console.log(`🧹 Cleared ${clearedItems} items from session ${originalSessionId} cart`);
          } else {
            console.warn('⚠️ No userId or sessionId found - cannot clear cart');
          }

          if (clearedItems > 0) {
            console.log('✅ Cart successfully cleared after purchase');
          } else {
            console.log('ℹ️ No cart items found to clear (cart may have been empty)');
          }

        } catch (error) {
          console.error('❌ Failed to record purchase or clear cart:', error);
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