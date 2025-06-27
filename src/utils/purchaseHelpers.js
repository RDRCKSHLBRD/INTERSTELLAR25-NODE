//purchaseHelpers.js - Updated to handle Stripe session ID
// src/utils/purchaseHelpers.js

import pool from '../config/database.js';
import CartModel from '../models/CartModel.js';

/**
 * Records a completed Stripe purchase in the database.
 * @param {Object} params
 * @param {string} params.stripeSessionId - Stripe checkout session ID
 * @param {string|null} params.sessionId - Original cart session ID
 * @param {number|null} params.userId - Authenticated user ID, if available
 * @param {string|null} params.email - Email from Stripe checkout session
 * @param {number} params.totalAmount - Total amount from Stripe (already converted from cents)
 * @param {string} params.currency - Currency code
 */
export async function recordPurchase({ 
  stripeSessionId, 
  sessionId, 
  userId, 
  email, 
  totalAmount, 
  currency = 'usd' 
}) {
  console.log('🔍 Looking for cart items with:', { sessionId, userId });

  // Step 1: Get cart items based on user or session
  const cartItems = userId
    ? await CartModel.getCartByUserId(userId)
    : await CartModel.getCartBySession(sessionId);

  console.log('🛒 Found cart items:', cartItems?.length || 0);

  if (!cartItems || cartItems.length === 0) {
    throw new Error(`No cart items found for ${userId ? `user ${userId}` : `session ${sessionId}`}.`);
  }

  // Step 2: Calculate total amount (fallback if not provided)
  const calculatedTotal = totalAmount || cartItems.reduce((sum, item) => {
    return sum + parseFloat(item.price) * item.quantity;
  }, 0);

  console.log('💰 Recording purchase:', {
    stripeSessionId,
    userId,
    totalAmount: calculatedTotal,
    currency,
    email,
    itemCount: cartItems.length
  });

  // Step 3: Insert into purchases table
  const purchaseResult = await pool.query(
    `INSERT INTO purchases (
      user_id, 
      stripe_session_id, 
      total_amount, 
      currency, 
      email, 
      status,
      purchased_at
    ) VALUES ($1, $2, $3, $4, $5, 'completed', NOW())
    RETURNING id`,
    [userId, stripeSessionId, calculatedTotal.toFixed(2), currency.toUpperCase(), email]
  );

  const purchaseId = purchaseResult.rows[0].id;
  console.log('✅ Purchase record created with ID:', purchaseId);

  // Step 4: Insert each item into purchase_items
  const insertItems = cartItems.map(item => {
    console.log('📦 Adding purchase item:', {
      purchaseId,
      productId: item.product_id,
      quantity: item.quantity,
      price: item.price
    });

    return pool.query(
      `INSERT INTO purchase_items (purchase_id, product_id, quantity, price)
       VALUES ($1, $2, $3, $4)`,
      [purchaseId, item.product_id, item.quantity, item.price]
    );
  });

  await Promise.all(insertItems);
  console.log('✅ All purchase items recorded');

  // Step 5: Clear cart
  if (userId) {
    console.log('🗑️ Clearing cart for user:', userId);
    await CartModel.clearCartByUserId(userId);
  } else {
    console.log('🗑️ Clearing cart for session:', sessionId);
    await CartModel.clearCartBySession(sessionId);
  }

  console.log('✅ Cart cleared successfully');
  return purchaseId;
}