// src/models/CartModel.js — v3 — Full CRUD CartModel — ESM compatible — 2025‑06‑08

import pool from '../config/database.js';

const CartModel = {
  // ------------------------
  // GET Cart by Session
  // ------------------------
  async getCartBySession(sessionId) {
    try {
      const result = await pool.query(
        `
        SELECT ci.id, ci.quantity, ci.added_at,
               p.id   AS product_id, p.cat_id, p.name AS product_name,
               p.price, p.description,
               a.name AS album_name, a.cover_url
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        LEFT JOIN albums a ON p.catalogue_id = a.catalogue
        WHERE ci.cart_id = (
          SELECT id FROM carts WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1
        )
        ORDER BY ci.added_at DESC
        `,
        [sessionId]
      );

      return result.rows;
    } catch (error) {
      console.error('❌ Error getting cart by session:', error);
      throw error;
    }
  },

  // ------------------------
  // GET Cart by UserId
  // ------------------------
  async getCartByUserId(userId) {
    try {
      const result = await pool.query(
        `
        SELECT ci.id, ci.quantity, ci.added_at,
               p.id   AS product_id, p.cat_id, p.name AS product_name,
               p.price, p.description,
               a.name AS album_name, a.cover_url
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        LEFT JOIN albums a ON p.catalogue_id = a.catalogue
        WHERE ci.cart_id = (
          SELECT id FROM carts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1
        )
        ORDER BY ci.added_at DESC
        `,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('❌ Error getting cart by userId:', error);
      throw error;
    }
  },

  // ------------------------
  // ADD Item to Cart
  // ------------------------
  async addToCart(productId, quantity, userId, sessionId) {
    try {
      // Ensure cart exists
      let cartId;

      const existingCartRes = await pool.query(
        `
        SELECT id FROM carts
        WHERE ${userId ? 'user_id = $1' : 'session_id = $1'}
        ORDER BY created_at DESC LIMIT 1
        `,
        [userId || sessionId]
      );

      if (existingCartRes.rows.length > 0) {
        cartId = existingCartRes.rows[0].id;
      } else {
        // Create new cart
        const newCartRes = await pool.query(
          `
          INSERT INTO carts (${userId ? 'user_id' : 'session_id'})
          VALUES ($1)
          RETURNING id
          `,
          [userId || sessionId]
        );
        cartId = newCartRes.rows[0].id;
      }

      // Insert item
      const cartItemRes = await pool.query(
        `
        INSERT INTO cart_items (cart_id, product_id, quantity)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [cartId, productId, quantity]
      );

      return cartItemRes.rows[0];
    } catch (error) {
      console.error('❌ Error adding item to cart:', error);
      throw error;
    }
  },

  // ------------------------
  // UPDATE Cart Item Quantity
  // ------------------------
  async updateCartItem(cartItemId, quantity, userId, sessionId) {
    try {
      const result = await pool.query(
        `
        UPDATE cart_items
        SET quantity = $1
        WHERE id = $2
        AND EXISTS (
          SELECT 1
          FROM carts
          WHERE carts.id = cart_items.cart_id
          AND (carts.user_id = $3 OR carts.session_id = $4)
        )
        `,
        [quantity, cartItemId, userId, sessionId]
      );

      return result.rowCount > 0;
    } catch (error) {
      console.error('❌ Error updating cart item:', error);
      throw error;
    }
  },

  // ------------------------
  // REMOVE Cart Item
  // ------------------------
  async removeCartItem(cartItemId, userId, sessionId) {
    try {
      const result = await pool.query(
        `
        DELETE FROM cart_items
        WHERE id = $1
        AND EXISTS (
          SELECT 1
          FROM carts
          WHERE carts.id = cart_items.cart_id
          AND (carts.user_id = $2 OR carts.session_id = $3)
        )
        `,
        [cartItemId, userId, sessionId]
      );

      return result.rowCount > 0;
    } catch (error) {
      console.error('❌ Error removing cart item:', error);
      throw error;
    }
  },

  // ------------------------
  // GET Product by Album
  // ------------------------
  async getProductByAlbum(albumId) {
    try {
      const result = await pool.query(
        `
        SELECT p.*
        FROM products p
        JOIN albums a ON p.catalogue_id = a.catalogue
        WHERE a.id = $1
        `,
        [albumId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('❌ Error getting product by album:', error);
      throw error;
    }
  },
};

// Export ESM style:
export default CartModel;
