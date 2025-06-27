// src/routes/api/cartRoute.js — v3 (Full CRUD, ESM compatible) — 2025‑06‑08

import express from 'express';
import CartModel from '../../models/CartModel.js';
import { resolveSessionId } from '../../utils/helpers.js';

const router = express.Router();

// ------------------------
// GET /api/cart/session
// ------------------------
router.get('/session', async (req, res) => {
  const sessionId = resolveSessionId(req);

  try {
    const cart = await CartModel.getCartBySession(sessionId);
    res.json({ success: true, cart });
  } catch (error) {
    console.error('❌ Error fetching cart for session:', error);
    res.status(500).json({ error: 'Failed to fetch cart for session' });
  }
});

// ------------------------
// GET /api/cart/:userId
// ------------------------
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const cart = await CartModel.getCartByUserId(userId);
    res.json({ success: true, cart });
  } catch (error) {
    console.error('❌ Error fetching cart for user:', error);
    res.status(500).json({ error: 'Failed to fetch cart for user' });
  }
});

// ------------------------
// POST /api/cart/add
// ------------------------
// REPLACE the /add route in src/routes/api/cartRoute.js with this:

router.post('/add', async (req, res) => {
  const sessionId = resolveSessionId(req);
  
  // 🔧 GET USER ID FROM SESSION instead of req.user
  const userId = req.session?.userId || null;
  
  const { productId, quantity } = req.body;

  console.log(`🛒 Adding to cart - userId: ${userId}, sessionId: ${sessionId}, productId: ${productId}`);

  try {
    const cartItem = await CartModel.addToCart(productId, quantity, userId, sessionId);
    res.json({ 
      success: true, 
      cartItem,
      message: 'Item added to cart successfully'
    });
  } catch (error) {
    console.error('❌ Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// ALSO UPDATE the other routes to use session userId:

router.patch('/update/:cartItemId', async (req, res) => {
  const { cartItemId } = req.params;
  const sessionId = resolveSessionId(req);
  const userId = req.session?.userId || null;  // 🔧 FIXED
  const { quantity } = req.body;

  console.log(`[PATCH /update/${cartItemId}] sessionId=${sessionId} userId=${userId} quantity=${quantity}`);

  if (!cartItemId || isNaN(cartItemId) || !quantity || isNaN(quantity)) {
    return res.status(400).json({ error: 'Invalid cartItemId or quantity' });
  }

  try {
    const success = await CartModel.updateCartItem(cartItemId, quantity, userId, sessionId);

    if (success) {
      res.json({ success: true, message: 'Cart item updated' });
    } else {
      res.status(404).json({ error: 'Cart item not found or not authorized' });
    }
  } catch (error) {
    console.error('❌ Error updating cart item:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

//DELETE

router.delete('/remove/:cartItemId', async (req, res) => {
  const { cartItemId } = req.params;
  const sessionId = resolveSessionId(req);
  const userId = req.session?.userId || null;  // 🔧 FIXED

  console.log(`[DELETE /remove/${cartItemId}] sessionId=${sessionId} userId=${userId}`);

  if (!cartItemId || isNaN(cartItemId)) {
    return res.status(400).json({ error: 'Invalid cartItemId' });
  }

  try {
    const success = await CartModel.removeCartItem(cartItemId, userId, sessionId);

    if (success) {
      res.json({ success: true, message: 'Cart item removed' });
    } else {
      res.status(404).json({ error: 'Cart item not found or not authorized' });
    }
  } catch (error) {
    console.error('❌ Error removing cart item:', error);
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

// ------------------------
// GET /api/cart/product/album/:albumId
// ------------------------
router.get('/product/album/:albumId', async (req, res) => {
  const { albumId } = req.params;

  try {
    const product = await CartModel.getProductByAlbum(albumId);

    if (product) {
      res.json({ success: true, product });
    } else {
      res.status(404).json({ error: 'Product not found for this album' });
    }
  } catch (error) {
    console.error('❌ Error fetching product by album:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// GET /api/cart/product/song/:songId
router.get('/product/song/:songId', async (req, res) => {
  try {
    const product = await CartModel.getProductBySong(req.params.songId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found for this song' });
    }
    res.json({ product });
  } catch (err) {
    console.error('❌ product-by-song route error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

export default router;  // ✅ ESM compatible
