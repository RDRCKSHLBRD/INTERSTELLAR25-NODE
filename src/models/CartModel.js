// src/models/CartModel.js — v3-a — Full CRUD CartModel — ESM compatible — 2025-06-09
import pool from '../config/database.js';

const CartModel = {
  /*─────────────────────────────────────────────────────────
    GET Cart by Session
  ─────────────────────────────────────────────────────────*/
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
          SELECT id FROM carts
          WHERE session_id = $1
          ORDER BY created_at DESC LIMIT 1
        )
        ORDER BY ci.added_at DESC
        `,
        [sessionId]
      );
      return result.rows;
    } catch (err) {
      console.error('❌ Error getting cart by session:', err);
      throw err;
    }
  },

  /*─────────────────────────────────────────────────────────
    GET Cart by UserId
  ─────────────────────────────────────────────────────────*/
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
          SELECT id FROM carts
          WHERE user_id = $1
          ORDER BY created_at DESC LIMIT 1
        )
        ORDER BY ci.added_at DESC
        `,
        [userId]
      );
      return result.rows;
    } catch (err) {
      console.error('❌ Error getting cart by userId:', err);
      throw err;
    }
  },

  /*─────────────────────────────────────────────────────────
    ADD Item to Cart
  ─────────────────────────────────────────────────────────*/
  async addToCart(productId, quantity, userId, sessionId) {
    try {
      /* ensure cart exists */
      let cartId;
      const existing = await pool.query(
        `
        SELECT id FROM carts
        WHERE ${userId ? 'user_id = $1' : 'session_id = $1'}
        ORDER BY created_at DESC LIMIT 1
        `,
        [userId || sessionId]
      );

      if (existing.rows.length) {
        cartId = existing.rows[0].id;
      } else {
        const created = await pool.query(
          `
          INSERT INTO carts (${userId ? 'user_id' : 'session_id'})
          VALUES ($1) RETURNING id
          `,
          [userId || sessionId]
        );
        cartId = created.rows[0].id;
      }

      const ins = await pool.query(
        `
        INSERT INTO cart_items (cart_id, product_id, quantity)
        VALUES ($1, $2, $3) RETURNING *
        `,
        [cartId, productId, quantity]
      );
      return ins.rows[0];
    } catch (err) {
      console.error('❌ Error adding item to cart:', err);
      throw err;
    }
  },

  /*─────────────────────────────────────────────────────────
    UPDATE Cart Item Quantity
  ─────────────────────────────────────────────────────────*/
  async updateCartItem(cartItemId, quantity, userId, sessionId) {
    try {
      const res = await pool.query(
        `
        UPDATE cart_items
        SET quantity = $1
        WHERE id = $2
          AND EXISTS (
            SELECT 1 FROM carts
            WHERE carts.id = cart_items.cart_id
              AND (carts.user_id = $3 OR carts.session_id = $4)
          )
        `,
        [quantity, cartItemId, userId, sessionId]
      );
      return res.rowCount > 0;
    } catch (err) {
      console.error('❌ Error updating cart item:', err);
      throw err;
    }
  },

  /*─────────────────────────────────────────────────────────
    REMOVE Cart Item
  ─────────────────────────────────────────────────────────*/
  async removeCartItem(cartItemId, userId, sessionId) {
    try {
      const res = await pool.query(
        `
        DELETE FROM cart_items
        WHERE id = $1
          AND EXISTS (
            SELECT 1 FROM carts
            WHERE carts.id = cart_items.cart_id
              AND (carts.user_id = $2 OR carts.session_id = $3)
          )
        `,
        [cartItemId, userId, sessionId]
      );
      return res.rowCount > 0;
    } catch (err) {
      console.error('❌ Error removing cart item:', err);
      throw err;
    }
  },

  /*─────────────────────────────────────────────────────────
    GET Product by Album
  ─────────────────────────────────────────────────────────*/
  async getProductByAlbum(albumId) {
    try {
      const { rows } = await pool.query(
        `
        SELECT p.*
        FROM   products p
        JOIN   albums   a ON p.catalogue_id = a.catalogue
        WHERE  a.id = $1
        `,
        [albumId]
      );
      return rows[0] || null;
    } catch (err) {
      console.error('❌ Error getting product by album:', err);
      throw err;
    }
  },

  /*─────────────────────────────────────────────────────────
    GET Product by Song   ← NEW
  ─────────────────────────────────────────────────────────*/
  async getProductBySong(songId) {
    try {
      const { rows } = await pool.query(
        `
        SELECT *
        FROM   products
        WHERE  song_id = $1
        LIMIT  1
        `,
        [songId]
      );
      return rows[0] || null;
    } catch (err) {
      console.error('❌ Error getting product by song:', err);
      throw err;
    }
  },

  /*─────────────────────────────────────────────────────────
    CLEAR Cart by UserId
  ─────────────────────────────────────────────────────────*/
  async clearCartByUserId(userId) {
    try {
      const result = await pool.query(
        `
        DELETE FROM cart_items 
        WHERE cart_id IN (
          SELECT id FROM carts WHERE user_id = $1
        )
        `,
        [userId]
      );
      console.log(`🗑️ Cleared ${result.rowCount} items from user ${userId} cart`);
      return result.rowCount;
    } catch (err) {
      console.error('❌ Error clearing cart by userId:', err);
      throw err;
    }
  },

  /*─────────────────────────────────────────────────────────
    CLEAR Cart by Session
  ─────────────────────────────────────────────────────────*/
  async clearCartBySession(sessionId) {
    try {
      const result = await pool.query(
        `
        DELETE FROM cart_items 
        WHERE cart_id IN (
          SELECT id FROM carts WHERE session_id = $1
        )
        `,
        [sessionId]
      );
      console.log(`🗑️ Cleared ${result.rowCount} items from session ${sessionId} cart`);
      return result.rowCount;
    } catch (err) {
      console.error('❌ Error clearing cart by session:', err);
      throw err;
    }
  }
};

export default CartModel;