//purchaseHelpers.js
// src/utils/purchaseHelpers.js

import db from '../db/index.js';
import CartModel from '../models/CartModel.js';

/**
 * Records a completed Stripe purchase in the database.
 * @param {Object} params
 * @param {string|null} params.sessionId - Anonymous session ID.
 * @param {number|null} params.userId - Authenticated user ID, if available.
 * @param {string|null} params.email - Email from Stripe checkout session.
 */
export async function recordPurchase({ sessionId, userId, email }) {
  // Step 1: Get cart items based on user or session
  const cartItems = userId
    ? await CartModel.getCartByUserId(userId)
    : await CartModel.getCartBySession(sessionId);

  if (!cartItems || cartItems.length === 0) {
    throw new Error('No cart items found to record purchase.');
  }

  // Step 2: Calculate total amount
  const totalAmount = cartItems.reduce((sum, item) => {
    return sum + parseFloat(item.price) * item.quantity;
  }, 0);

  // Step 3: Insert into purchases table
  const purchaseResult = await db.query(
    `INSERT INTO purchases (user_id, stripe_session_id, total_amount, currency, email, status)
     VALUES ($1, $2, $3, $4, $5, 'completed')
     RETURNING id`,
    [userId, sessionId, totalAmount.toFixed(2), 'USD', email]
  );

  const purchaseId = purchaseResult.rows[0].id;

  // Step 4: Insert each item into purchase_items
  const insertItems = cartItems.map(item => {
    return db.query(
      `INSERT INTO purchase_items (purchase_id, product_id, quantity, price)
       VALUES ($1, $2, $3, $4)`,
      [purchaseId, item.product_id, item.quantity, item.price]
    );
  });

  await Promise.all(insertItems);

  // Step 5: Clear cart (optional)
  if (userId) {
    await CartModel.clearCartByUserId(userId);
  } else {
    await CartModel.clearCartBySession(sessionId);
  }

  return purchaseId;
}
