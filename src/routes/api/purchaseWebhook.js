// src/routes/api/purchaseWebhook.js - FINAL with Real Email Service
import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { recordPurchase } from '../../utils/purchaseHelpers.js';
import { sendGuestDownloadEmail } from '../../utils/emailService.js';
import { query } from '../../config/database.js';

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Debug logging
console.log('🔧 Webhook config check:');
console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING');
console.log('- STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'MISSING');
console.log('- EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'MISSING');
console.log('- EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? 'SET' : 'MISSING');

// Cart clearing functions
async function clearUserCart(userId) {
  try {
    console.log(`🧹 Clearing cart for user ${userId}`);
    
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

// Generate guest download token
async function generateGuestDownloadToken(email, purchaseId) {
  try {
    console.log(`🎫 Generating guest download token for ${email}, purchase ${purchaseId}`);
    
    // Generate secure token
    const tokenData = `${email}-${purchaseId}-${Date.now()}-${Math.random()}`;
    const token = crypto.createHash('sha256').update(tokenData).digest('hex');
    
    // Set expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Insert into guest_downloads table
    const insertQuery = `
      INSERT INTO guest_downloads (email, purchase_id, token, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, token
    `;
    
    const result = await query(insertQuery, [email, purchaseId, token, expiresAt]);
    
    console.log(`✅ Guest download token created: ${result.rows[0].id}`);
    return {
      id: result.rows[0].id,
      token: result.rows[0].token,
      expiresAt: expiresAt
    };
    
  } catch (error) {
    console.error(`❌ Error generating guest download token:`, error);
    throw error;
  }
}

// Get purchased items details for email
async function getPurchasedItemsDetails(purchaseId) {
  try {
    const query_text = `
      SELECT 
        pi.quantity,
        pi.price,
        p.name,
        p.catalogue_id,
        p.song_id,
        CASE 
          WHEN p.catalogue_id IS NOT NULL THEN 'album'
          WHEN p.song_id IS NOT NULL THEN 'song'
          ELSE 'unknown'
        END as item_type
      FROM purchase_items pi
      JOIN products p ON pi.product_id = p.id
      WHERE pi.purchase_id = $1
      ORDER BY pi.id
    `;
    
    const result = await query(query_text, [purchaseId]);
    
    return result.rows.map(item => ({
      name: item.name,
      price: parseFloat(item.price).toFixed(2),
      quantity: item.quantity,
      type: item.item_type
    }));
    
  } catch (error) {
    console.error(`❌ Error getting purchased items for purchase ${purchaseId}:`, error);
    return [];
  }
}

router.post(
  '/',
  express.raw({ type: 'application/json' }),
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
          customer_email: session.customer_email,
          customer_details: session.customer_details
        });

        // Extract purchase information
        const userId = session.metadata?.userId || null;
        const purchaseType = session.metadata?.purchaseType || 'user';
        const originalSessionId = session.metadata?.sessionId || session.client_reference_id || null;
        
        // Get email from Stripe (prioritize customer_details.email over customer_email)
        const stripeEmail = session.customer_details?.email || session.customer_email || null;
        
        // Determine if this is a guest purchase
        const isGuestPurchase = !userId || userId === 'null' || purchaseType === 'guest';
        
        console.log('✅ Stripe checkout completed:', { 
          originalSessionId, 
          userId, 
          stripeEmail,
          purchaseType,
          isGuestPurchase,
          stripeSessionId: session.id 
        });

        if (!originalSessionId) {
          console.error('❌ No original session ID found in Stripe session');
          return res.status(400).send('Missing original session ID');
        }

        // For guest purchases, email is required
        if (isGuestPurchase && !stripeEmail) {
          console.error('❌ Guest purchase missing email from Stripe');
          return res.status(400).send('Guest purchase missing email');
        }

        try {
          // Record the purchase
          const purchaseData = { 
            stripeSessionId: session.id,
            sessionId: originalSessionId,
            userId: isGuestPurchase ? null : userId,
            email: stripeEmail,
            totalAmount: session.amount_total / 100,
            currency: session.currency,
            purchaseType: isGuestPurchase ? 'guest' : 'user'
          };
          
          const purchaseId = await recordPurchase(purchaseData);
          console.log('📦 Purchase recorded successfully with ID:', purchaseId);

          // Clear the cart
          let clearedItems = 0;
          
          if (!isGuestPurchase && userId) {
            // Clear user cart
            clearedItems = await clearUserCart(userId);
            console.log(`🧹 Cleared ${clearedItems} items from user ${userId} cart`);
          } else if (originalSessionId) {
            // Clear session cart (for guests)
            clearedItems = await clearSessionCart(originalSessionId);
            console.log(`🧹 Cleared ${clearedItems} items from session ${originalSessionId} cart`);
          }

          // ✅ Handle guest downloads with REAL email service
          if (isGuestPurchase && stripeEmail) {
            console.log(`👻 Processing guest purchase for: ${stripeEmail}`);
            
            try {
              // Generate download token
              const downloadToken = await generateGuestDownloadToken(stripeEmail, purchaseId);
              
              // Get purchased items details for email
              const purchasedItems = await getPurchasedItemsDetails(purchaseId);
              
              // Send download email with REAL email service
              const emailResult = await sendGuestDownloadEmail({
                email: stripeEmail,
                downloadToken: downloadToken,
                purchaseDetails: {
                  purchaseId: purchaseId,
                  totalAmount: session.amount_total / 100,
                  currency: session.currency
                },
                purchasedItems: purchasedItems
              });
              
              console.log(`✅ Guest download email sent successfully to ${stripeEmail}`);
              console.log(`📧 Email message ID: ${emailResult.messageId}`);
              console.log(`🔗 Download URL: ${emailResult.downloadUrl}`);
              
            } catch (emailError) {
              console.error(`❌ Failed to send guest download email to ${stripeEmail}:`, emailError);
              // Don't fail the webhook - purchase was still recorded
            }
          }

          if (clearedItems > 0) {
            console.log('✅ Cart successfully cleared after purchase');
          } else {
            console.log('ℹ️ No cart items found to clear (cart may have been empty)');
          }

        } catch (error) {
          console.error('❌ Failed to record purchase or process download:', error);
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