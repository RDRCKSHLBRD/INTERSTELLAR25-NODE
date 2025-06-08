// src/routes/api/cartRoute.js  –  DEBUG build v2
import express from 'express';
import { query } from '../../config/database.js';
import { validateCartItem } from '../../middleware/validation.js';

const router = express.Router();

/* ------------------------------------------------------------- *
 *  Utility: resolve the sessionId for an anonymous user
 * ------------------------------------------------------------- */
function resolveSessionId(req) {
  // what the browser invented
  const headerId  = req.headers['x-session-id'];
  const bodyId    = req.body?.sessionId;          // for POST /add
  // what express-session generated (cookie)
  const cookieId  = req.session?.id;

  const chosen = headerId || bodyId || cookieId;  // <<< header first!
  console.log('[resolveSessionId] header:', headerId,
              '| body:', bodyId,
              '| cookie:', cookieId,
              '→ chosen:', chosen);
  return chosen;
}

/* ------------------------------------------------------------- *
 *  GET CART – anonymous session
 * ------------------------------------------------------------- */
router.get('/session', async (req, res) => {
  try {
    const sessionId = resolveSessionId(req);
    if (!sessionId) return res.status(400).json({ error: 'Session ID required' });

    /* ---------- find or create cart -------------------------------- */
    const cartRes = await query(
      'SELECT * FROM carts WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1',
      [sessionId]
    );

    let cartId;
    if (cartRes.rows.length === 0) {
      const { rows } = await query(
        'INSERT INTO carts (session_id) VALUES ($1) RETURNING id',
        [sessionId]
      );
      cartId = rows[0].id;
      console.log('[GET /session] ✚ new cart', cartId);
    } else {
      cartId = cartRes.rows[0].id;
      console.log('[GET /session] ✔ existing cart', cartId);
    }

    /* ---------- grab items ---------------------------------------- */
    const { rows: itemRows } = await query(`
      SELECT ci.id, ci.quantity, ci.added_at,
             p.id   AS product_id, p.cat_id, p.name AS product_name,
             p.price, p.description,
             a.name AS album_name, a.cover_url
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
   LEFT JOIN albums   a ON p.catalogue_id = a.catalogue
       WHERE ci.cart_id = $1
    ORDER BY ci.added_at DESC
    `, [cartId]);

    const items = itemRows.map(r => ({
      id: r.id,
      quantity: r.quantity,
      added_at: r.added_at,
      product: {
        id: r.product_id,
        cat_id: r.cat_id,
        name: r.product_name,
        price: r.price,
        description: r.description
      },
      album: { name: r.album_name, cover_url: r.cover_url }
    }));

    const itemCount   = items.reduce((s, i) => s + i.quantity, 0);
    const totalAmount = items.reduce((s, i) => s + (+i.product.price * i.quantity), 0);

    res.json({ cartId, items, itemCount, totalAmount: +totalAmount.toFixed(2) });
  } catch (err) {
    console.error('[GET /session] ERROR', err);
    res.status(500).json({ error: 'Failed to get cart' });
  }
});

/* ------------------------------------------------------------- *
 *  GET CART – logged-in user
 * ------------------------------------------------------------- */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const cartRes = await query(
      'SELECT * FROM carts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    let cartId;
    if (cartRes.rows.length === 0) {
      const { rows } = await query(
        'INSERT INTO carts (user_id) VALUES ($1) RETURNING id',
        [userId]
      );
      cartId = rows[0].id;
      console.log('[GET /:userId] ✚ new cart', cartId);
    } else {
      cartId = cartRes.rows[0].id;
      console.log('[GET /:userId] ✔ existing cart', cartId);
    }

    const { rows: itemRows } = await query(`
      SELECT ci.id, ci.quantity, ci.added_at,
             p.id AS product_id, p.cat_id, p.name AS product_name,
             p.price, p.description,
             a.name AS album_name, a.cover_url
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
   LEFT JOIN albums   a ON p.catalogue_id = a.catalogue
       WHERE ci.cart_id = $1
    ORDER BY ci.added_at DESC
    `, [cartId]);

    const items = itemRows.map(r => ({
      id: r.id,
      quantity: r.quantity,
      added_at: r.added_at,
      product: {
        id: r.product_id,
        cat_id: r.cat_id,
        name: r.product_name,
        price: r.price,
        description: r.description
      },
      album: { name: r.album_name, cover_url: r.cover_url }
    }));

    const itemCount   = items.reduce((s, i) => s + i.quantity, 0);
    const totalAmount = items.reduce((s, i) => s + (+i.product.price * i.quantity), 0);

    res.json({ cartId, items, itemCount, totalAmount: +totalAmount.toFixed(2) });
  } catch (err) {
    console.error('[GET /:userId] ERROR', err);
    res.status(500).json({ error: 'Failed to get cart' });
  }
});

/* ------------------------------------------------------------- *
 *  POST /add
 * ------------------------------------------------------------- */
router.post('/add', validateCartItem, async (req, res) => {
  try {
    const { userId, productId, quantity = 1 } = req.body;
    const sessionId = resolveSessionId(req);
    console.log('[POST /add] userId:', userId, 'sessionId:', sessionId,
                'productId:', productId, 'qty:', quantity);

    if (!userId && !sessionId)
      return res.status(400).json({ error: 'User ID or session ID required' });

    /* ensure product exists & active */
    const { rows: prodRows } = await query(
      'SELECT * FROM products WHERE id = $1 AND active = true',
      [productId]
    );
    if (prodRows.length === 0)
      return res.status(404).json({ error: 'Product not found' });

    /* find or create cart row */
    let cartId;
    if (userId) {
      const { rows } = await query(
        'SELECT id FROM carts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [userId]
      );
      cartId = rows[0]?.id;
      if (!cartId) {
        ({ rows: [{ id: cartId }] } = await query(
          'INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [userId]
        ));
      }
    } else {
      const { rows } = await query(
        'SELECT id FROM carts WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1',
        [sessionId]
      );
      cartId = rows[0]?.id;
      if (!cartId) {
        ({ rows: [{ id: cartId }] } = await query(
          'INSERT INTO carts (session_id) VALUES ($1) RETURNING id', [sessionId]
        ));
      }
    }

    /* upsert item */
    const { rows: exists } = await query(
      'SELECT quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cartId, productId]
    );
    if (exists.length) {
      await query(
        'UPDATE cart_items SET quantity = quantity + $1 WHERE cart_id = $2 AND product_id = $3',
        [quantity, cartId, productId]
      );
    } else {
      await query(
        'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)',
        [cartId, productId, quantity]
      );
    }

    await query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cartId]);
    res.json({ success: true, message: `${prodRows[0].name} added to cart` });
  } catch (err) {
    console.error('[POST /add] ERROR', err);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

/* ------------------------------------------------------------- *
 *  GET product for album (unchanged)
 * ------------------------------------------------------------- */
router.get('/product/album/:albumId', async (req, res) => {
  try {
    const { albumId } = req.params;
    const { rows } = await query(`
      SELECT p.id AS product_id, p.cat_id, p.name AS product_name,
             p.price, p.description,
             a.id AS album_id, a.name AS album_name, a.cover_url
        FROM albums a
        JOIN products p ON a.catalogue = p.catalogue_id
       WHERE a.id = $1 AND p.active = true
       LIMIT 1`, [albumId]);
    if (!rows.length) return res.status(404).json({ error: 'Product not found for this album' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[GET /product/album/:albumId] ERROR', err);
    res.status(500).json({ error: 'Failed to get product for album' });
  }
});

export default router;
