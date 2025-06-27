// src/models/CartModel.js — FIXED VERSION — Displays correct names for songs vs albums

import pool from '../config/database.js';

const CartModel = {
  /*─────────────────────────────────────────────────────────
    GET Cart by Session - FIXED to show song names correctly
  ─────────────────────────────────────────────────────────*/
async getCartBySession(sessionId) {
  try {
    const result = await pool.query(
      `
      SELECT ci.id, ci.quantity, ci.added_at,
             p.id AS product_id, p.cat_id, 
             -- ✅ FIX: Use song name if it's a song product, otherwise use product name
             CASE 
               WHEN p.song_id IS NOT NULL THEN s.name 
               ELSE p.name 
             END AS product_name,
             p.price, p.description,
             a.name AS album_name, 
             a.cover_url,
             p.song_id,
             s.name AS song_name,
             -- ✅ Add product type for frontend styling
             CASE 
               WHEN p.song_id IS NOT NULL THEN 'song'
               ELSE 'album'
             END AS product_type
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN songs s ON p.song_id = s.id
      LEFT JOIN albums a ON (p.catalogue_id = a.catalogue OR s.album_id = a.id)
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

// REPLACE the getCartByUserId method with this (add missing product_type):
async getCartByUserId(userId) {
  try {
    const result = await pool.query(
      `
      SELECT ci.id, ci.quantity, ci.added_at,
             p.id AS product_id, p.cat_id, 
             -- ✅ FIX: Use song name if it's a song product, otherwise use product name
             CASE 
               WHEN p.song_id IS NOT NULL THEN s.name 
               ELSE p.name 
             END AS product_name,
             p.price, p.description,
             a.name AS album_name, 
             a.cover_url,
             p.song_id,
             s.name AS song_name,
             -- ✅ Add product type for frontend styling
             CASE 
               WHEN p.song_id IS NOT NULL THEN 'song'
               ELSE 'album'
             END AS product_type
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN songs s ON p.song_id = s.id
      LEFT JOIN albums a ON (p.catalogue_id = a.catalogue OR s.album_id = a.id)
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

  // ... rest of the methods stay the same
  async addToCart(productId, quantity, userId, sessionId) {
  try {
    let cartId;
    
    if (userId) {
      // For logged-in users, look for user cart first
      const userCart = await pool.query(
        'SELECT id FROM carts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [userId]
      );
      
      if (userCart.rows.length) {
        cartId = userCart.rows[0].id;
      } else {
        // Create new user cart
        const created = await pool.query(
          'INSERT INTO carts (user_id) VALUES ($1) RETURNING id',
          [userId]
        );
        cartId = created.rows[0].id;
      }
    } else {
      // For anonymous users, use session
      const sessionCart = await pool.query(
        'SELECT id FROM carts WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1',
        [sessionId]
      );
      
      if (sessionCart.rows.length) {
        cartId = sessionCart.rows[0].id;
      } else {
        const created = await pool.query(
          'INSERT INTO carts (session_id) VALUES ($1) RETURNING id',
          [sessionId]
        );
        cartId = created.rows[0].id;
      }
    }

    const ins = await pool.query(
      'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
      [cartId, productId, quantity]
    );
    return ins.rows[0];
  } catch (err) {
    console.error('❌ Error adding item to cart:', err);
    throw err;
  }
},

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


async migrateSessionCartToUser(sessionId, userId) {
  try {
    console.log(`🔄 Migrating cart from session ${sessionId} to user ${userId}`);
    
    // Find session cart
    const sessionCartResult = await pool.query(  // ← CHANGED from db.query to pool.query
      'SELECT id FROM carts WHERE session_id = $1 AND user_id IS NULL',
      [sessionId]
    );
    
    if (sessionCartResult.rows.length === 0) {
      console.log('📭 No session cart to migrate');
      return;
    }
    
    const sessionCartId = sessionCartResult.rows[0].id;
    
    // Check if user already has a cart
    const userCartResult = await pool.query(  // ← CHANGED from db.query to pool.query
      'SELECT id FROM carts WHERE user_id = $1',
      [userId]
    );
    
    let userCartId;
    if (userCartResult.rows.length === 0) {
      // Create user cart
      const newCartResult = await pool.query(  // ← CHANGED from db.query to pool.query
        'INSERT INTO carts (user_id) VALUES ($1) RETURNING id',
        [userId]
      );
      userCartId = newCartResult.rows[0].id;
      console.log(`✅ Created new user cart: ${userCartId}`);
    } else {
      userCartId = userCartResult.rows[0].id;
    }
    
    // Move cart items from session cart to user cart
    await pool.query(  // ← CHANGED from db.query to pool.query
      'UPDATE cart_items SET cart_id = $1 WHERE cart_id = $2',
      [userCartId, sessionCartId]
    );
    
    // Delete empty session cart
    await pool.query('DELETE FROM carts WHERE id = $1', [sessionCartId]);  // ← CHANGED from db.query to pool.query
    
    console.log(`🎯 Cart migration complete: session → user ${userId}`);
    
  } catch (err) {
    console.error('❌ Error migrating cart:', err);
    throw err;
  }
},


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