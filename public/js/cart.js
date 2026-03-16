// cart.js V6.2 — Database-Driven Shopping Cart Manager (localStorage Cache)
// RODUX principle: JS builds DOM with classnames only. No inline styles.
// CSS (cart.css) is the rendering engine.
//
// CACHE STRATEGY:
//   - localStorage holds cart summary (items, count, total) for instant badge display
//   - On page load: read cache only, zero Postgres calls
//   - On user action (open cart, add item, login): hit Postgres, sync cache
//   - DB is always source of truth; cache is display-only
//   - Bots browsing the catalogue never touch the database

const CART_CACHE_KEY = 'interstellar.cartCache';

class CartManager {
  constructor() {
    this.cart = { items: [], itemCount: 0, totalAmount: 0, cartId: null };
    this.isVisible = false;
    this.cartSidebar = null;
    this.backdrop = null;
    this.isLoggedIn = false;
    this.userId = null;
    this._initialized = false;
    this.sessionId = localStorage.getItem('interstellar.sessionId') || this._newSessionId();
    localStorage.setItem('interstellar.sessionId', this.sessionId);

    this._restoreFromCache();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => { this.setupEventListeners(); this.updateCartCount(); });
    } else {
      this.setupEventListeners();
      this.updateCartCount();
    }
  }

  _newSessionId() { return 'session_' + Math.random().toString(36).substr(2, 9) + Date.now(); }

  // ── localStorage Cache ──────────────────────────────────────

  _saveToCache() {
    try {
      localStorage.setItem(CART_CACHE_KEY, JSON.stringify({
        items: this.cart.items, itemCount: this.cart.itemCount,
        totalAmount: this.cart.totalAmount, ts: Date.now()
      }));
    } catch (_) {}
  }

  _restoreFromCache() {
    try {
      const raw = localStorage.getItem(CART_CACHE_KEY);
      if (!raw) return;
      const c = JSON.parse(raw);
      if (c.ts && (Date.now() - c.ts) > 86400000) { localStorage.removeItem(CART_CACHE_KEY); return; }
      this.cart = { items: c.items || [], itemCount: c.itemCount || 0, totalAmount: c.totalAmount || 0, cartId: null };
    } catch (_) { localStorage.removeItem(CART_CACHE_KEY); }
  }

  _clearCache() { localStorage.removeItem(CART_CACHE_KEY); }

  // ── Lazy Init ───────────────────────────────────────────────

  async _ensureInitialized() {
    if (this._initialized) return;
    this._initialized = true;
    await this.checkAuthStatus();
    await this.loadCartFromDatabase();
    this.updateCartCount();
  }

  // ── Auth ────────────────────────────────────────────────────

  async checkAuthStatus() {
    try {
      if (window.authManager && window.authManager.isLoggedIn()) {
        this.isLoggedIn = true;
        this.userId = window.authManager.getCurrentUser()?.id;
        return;
      }
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) { this.isLoggedIn = true; this.userId = data.user.id; }
      } else { this.isLoggedIn = false; this.userId = null; }
    } catch (_) { this.isLoggedIn = false; }
  }

  // ── Events ──────────────────────────────────────────────────

  setupEventListeners() {
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) cartBtn.addEventListener('click', () => this.toggleCartSidebar());

    window.addEventListener('userLoggedIn', async (e) => {
      this.isLoggedIn = true; this.userId = e.detail.user.id; this._initialized = true;
      await this.loadCartFromDatabase(); this.updateCartCount();
    });

    window.addEventListener('userLoggedOut', async () => {
      this.isLoggedIn = false; this.userId = null;
      this.sessionId = this._newSessionId();
      localStorage.setItem('interstellar.sessionId', this.sessionId);
      this._initialized = true;
      this.cart = { items: [], itemCount: 0, totalAmount: 0, cartId: null };
      this._saveToCache(); this.updateCartCount();
    });

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.isVisible) this.hideCartSidebar(); });
  }

  // ── Database ────────────────────────────────────────────────

  async loadCartFromDatabase() {
    try {
      const cartUrl = (this.isLoggedIn && this.userId) ? `/api/cart/${this.userId}` : '/api/cart/session';
      const headers = { 'Content-Type': 'application/json' };
      if (!this.isLoggedIn) headers['x-session-id'] = this.sessionId;

      const response = await fetch(cartUrl, { headers, credentials: 'include' });

      if (response.ok) {
        const data = await response.json();
        const cartItems = Array.isArray(data) ? data : (data.cart || data.items || []);
        this.cart = {
          items: cartItems, itemCount: cartItems.length,
          totalAmount: cartItems.reduce((sum, i) => sum + (parseFloat(i.price || 0) * (i.quantity || 1)), 0),
          cartId: null
        };
      } else {
        this.cart = { items: [], itemCount: 0, totalAmount: 0, cartId: null };
      }
      this._saveToCache();
    } catch (error) {
      console.error('❌ Failed to load cart:', error);
      this.cart = { items: [], itemCount: 0, totalAmount: 0, cartId: null };
    }
  }

  // ── Sidebar Toggle ──────────────────────────────────────────

  async toggleCartSidebar() { this.isVisible ? this.hideCartSidebar() : await this.showCartSidebar(); }

  async showCartSidebar() {
    await this._ensureInitialized();
    await this.loadCartFromDatabase();
    this.createCartSidebar();
    this.isVisible = true;
  }

  hideCartSidebar() {
    if (this.cartSidebar) this.cartSidebar.classList.remove('open');
    if (this.backdrop) this.backdrop.classList.remove('visible');
    setTimeout(() => {
      if (this.cartSidebar?.parentNode) this.cartSidebar.remove();
      if (this.backdrop?.parentNode) this.backdrop.remove();
      this.cartSidebar = null; this.backdrop = null;
    }, 300);
    this.isVisible = false;
  }

  // ── Sidebar Build ───────────────────────────────────────────

  createCartSidebar() {
    if (this.cartSidebar) this.cartSidebar.remove();
    if (this.backdrop) this.backdrop.remove();

    this.backdrop = document.createElement('div');
    this.backdrop.className = 'cart-backdrop';
    this.backdrop.addEventListener('click', () => this.hideCartSidebar());
    document.body.appendChild(this.backdrop);

    this.cartSidebar = document.createElement('div');
    this.cartSidebar.className = 'cart-sidebar';
    this.cartSidebar.innerHTML = `
      <div class="cart-header">
        <h3>Shopping Cart</h3>
        <button class="cart-close" id="cartClose"></button>
      </div>
      <div class="cart-content">
        <div class="cart-items" id="cartItems">${this.renderCartItems()}</div>
        <div class="cart-footer">
          <div class="cart-total"><strong>Total: $${(this.cart.totalAmount || 0).toFixed(2)}</strong></div>
          <button class="checkout-btn" id="checkoutBtn"
            ${!this.cart.items?.length ? 'disabled' : ''}>Checkout</button>
        </div>
      </div>`;

    document.body.appendChild(this.cartSidebar);
    document.getElementById('cartClose').addEventListener('click', () => this.hideCartSidebar());
    document.getElementById('checkoutBtn').addEventListener('click', () => this.handleCheckout());
    this.attachCartItemEventListeners(document.getElementById('cartItems'));
    requestAnimationFrame(() => { this.cartSidebar.classList.add('open'); this.backdrop.classList.add('visible'); });
  }

  // ── Render Items ────────────────────────────────────────────

  renderCartItems() {
    const items = this.cart.items?.length ? this.cart.items : [];
    if (!items.length) return '<div class="cart-empty">Your cart is empty</div>';

    return items.map(item => {
      const productType = item.product_type || (item.song_id ? 'song' : 'album');
      const primaryName = item.product_name || item.name || 'Unknown Item';
      const albumName = item.album_name;
      const coverUrl = item.cover_url || '/images/default-album-cover.png';
      const price = item.price || item.product?.price || 15.00;
      const quantity = item.quantity || 1;
      const itemId = item.id || item.cart_item_id;

      const displayTitle = (productType === 'song' && albumName && albumName !== primaryName)
        ? `<h4 class="cart-item-title"><span class="song-name">${primaryName}</span><span class="album-subtitle">from ${albumName}</span></h4>`
        : `<h4 class="cart-item-title">${primaryName}</h4>`;

      return `
        <div class="cart-item" data-item-id="${itemId}" data-product-type="${productType}">
          <img src="${coverUrl}" alt="${primaryName}" class="cart-item-image">
          <div class="cart-item-details">
            ${displayTitle}
            <p class="cart-item-price">$${parseFloat(price).toFixed(2)}</p>
            <div class="cart-item-controls">
              <button class="quantity-btn decrease-btn" data-item-id="${itemId}" data-action="decrease">−</button>
              <span class="quantity">${quantity}</span>
              <button class="quantity-btn increase-btn" data-item-id="${itemId}" data-action="increase">+</button>
              <button class="remove-btn" data-item-id="${itemId}" data-action="remove">Remove</button>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  // ── Item Event Delegation ───────────────────────────────────

  attachCartItemEventListeners(el) {
    el.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const itemId = parseInt(btn.dataset.itemId);
      const action = btn.dataset.action;
      if (!itemId || !action) return;
      btn.disabled = true;
      try {
        if (action === 'remove') { await this.removeFromCartDatabase(itemId); }
        else {
          const item = this.cart.items.find(i => i.id === itemId);
          if (item) await this.updateQuantityInDatabase(itemId, item.quantity + (action === 'increase' ? 1 : -1));
        }
      } finally { btn.disabled = false; }
    });
  }

  // ── Add to Cart (Album) ─────────────────────────────────────

  async addToCart(albumId, albumName, coverUrl, price = 15.00) {
    await this._ensureInitialized();
    try {
      const prodRes = await fetch(`/api/cart/product/album/${albumId}`);
      if (!prodRes.ok) throw new Error('Product not found for this album');
      const prodData = await prodRes.json();

      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': this.sessionId },
        credentials: 'include',
        body: JSON.stringify({ productId: prodData.product.id, quantity: 1 })
      });

      if (response.ok) {
        this.showNotification(`${albumName} added to cart.`);
        setTimeout(async () => { await this.loadCartFromDatabase(); this.updateCartCount(); if (this.isVisible) this.updateCartSidebarContent(); }, 500);
        return true;
      } else {
        const err = await response.json();
        throw new Error(err.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('❌ Add to cart failed:', error);
      this.showNotification(error.message, 'error');
      return false;
    }
  }

  // ── Add to Cart (Song) ──────────────────────────────────────

  async addSongToCart(songId, songMeta = null) {
    await this._ensureInitialized();
    let song = songMeta;
    if (!song) { try { song = await window.apiClient.getSong(String(songId).replace(/^0+/, '')); } catch (_) {} }
    if (!song) { this.showNotification('Song not found', 'error'); return; }

    let productId = null, productPrice = song.price ?? 1.29;
    try {
      const res = await fetch(`/api/cart/product/song/${song.id}`);
      if (res.ok) { const d = await res.json(); productId = d.product?.id ?? null; productPrice = d.product?.price ?? productPrice; }
    } catch (_) {}

    if (!productId) { this.showNotification('Song purchases not available yet', 'error'); return; }
    await this._addSongToDB(song, productId, productPrice);
  }

  async _addSongToDB(song, productId, price) {
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': this.sessionId },
        credentials: 'include',
        body: JSON.stringify({ productId, quantity: 1 })
      });
      if (response.ok) {
        this.showNotification(`${song.name} added to cart.`);
        setTimeout(async () => { await this.loadCartFromDatabase(); this.updateCartCount(); if (this.isVisible) this.updateCartSidebarContent(); }, 500);
      } else { throw new Error('Failed to add song to cart'); }
    } catch (error) {
      console.error('❌ Add song to cart failed:', error);
      this.showNotification('Failed to add song to cart', 'error');
    }
  }

  async addAlbumToCart(albumId) {
    try {
      const album = await window.apiClient.getAlbum(albumId);
      if (album) await this.addToCart(albumId, album.name, album.cover_url);
      else this.showNotification('Album not found', 'error');
    } catch (_) { this.showNotification('Failed to add album to cart.', 'error'); }
  }

  // ── Remove / Update ─────────────────────────────────────────

  async removeFromCartDatabase(cartItemId) {
    try {
      const res = await fetch(`/api/cart/remove/${cartItemId}`, { method: 'DELETE', headers: { 'x-session-id': this.sessionId }, credentials: 'include' });
      if (res.ok) { await this.loadCartFromDatabase(); this.updateCartCount(); if (this.isVisible) this.updateCartSidebarContent(); return true; }
      else throw new Error('Failed to remove item');
    } catch (_) { this.showNotification('Failed to remove item', 'error'); return false; }
  }

  async updateQuantityInDatabase(cartItemId, qty) {
    if (qty <= 0) { await this.removeFromCartDatabase(cartItemId); return; }
    try {
      const res = await fetch(`/api/cart/update/${cartItemId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-session-id': this.sessionId },
        credentials: 'include', body: JSON.stringify({ quantity: qty })
      });
      if (res.ok) { await this.loadCartFromDatabase(); this.updateCartCount(); if (this.isVisible) this.updateCartSidebarContent(); return true; }
      else throw new Error('Failed to update quantity');
    } catch (_) { this.showNotification('Failed to update quantity', 'error'); return false; }
  }

  // ── Sidebar Content Refresh ─────────────────────────────────

  updateCartSidebarContent() {
    const el = document.getElementById('cartItems');
    const total = document.querySelector('.cart-total');
    const btn = document.getElementById('checkoutBtn');
    if (el) { el.innerHTML = this.renderCartItems(); this.attachCartItemEventListeners(el); }
    if (total) total.innerHTML = `<strong>Total: $${(this.cart.totalAmount || 0).toFixed(2)}</strong>`;
    if (btn) btn.disabled = !this.cart.items?.length;
  }

  // ── Cart Count Badge ────────────────────────────────────────

  updateCartCount() {
    const el = document.getElementById('cartCount');
    const count = this.cart.itemCount || 0;
    if (el) { el.textContent = count; el.classList.toggle('hidden', count === 0); }
  }

  getCartTotal() { return this.cart.totalAmount || 0; }
  getCartItemCount() { return this.cart.itemCount || 0; }

  // ── Auth Integration ────────────────────────────────────────

  async refreshCartAfterLogin() {
    await this.checkAuthStatus();
    await this.loadCartFromDatabase();
    this.updateCartCount();
    if (this.isVisible) this.updateCartSidebarContent();
  }

  getCartData() { return this.cart; }

  // ── Clear Cart ──────────────────────────────────────────────

  async clearCart() {
    if (this.cart.items) { for (const item of this.cart.items) await this.removeFromCartDatabase(item.id); }
    this._clearCache();
  }

  // ── Checkout ────────────────────────────────────────────────

  async handleCheckout() {
    if (!this.cart.items?.length) return;
    try {
      const cfg = await (await fetch('/api/config')).json();
      const checkoutData = { isLoggedIn: this.isLoggedIn, userId: this.userId, sessionId: this.sessionId, cartItems: this.cart.items };

      if (!this.isLoggedIn) {
        const email = await this.collectGuestEmail();
        if (!email) return;
        checkoutData.guestEmail = email; checkoutData.purchaseType = 'guest';
      } else { checkoutData.purchaseType = 'user'; }

      const res = await fetch('/api/purchase/create-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(checkoutData) });
      if (!res.ok) { this.showNotification(`Checkout failed: ${await res.text()}`, 'error'); return; }
      const data = await res.json();
      if (data.id) { await Stripe(cfg.stripePublishableKey).redirectToCheckout({ sessionId: data.id }); }
      else this.showNotification('Could not start checkout.', 'error');
    } catch (error) { console.error('Checkout error:', error); this.showNotification('Checkout failed. Try again.', 'error'); }
  }

  // ── Guest Email Modal ───────────────────────────────────────

  collectGuestEmail() {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'guest-email-modal';
      modal.innerHTML = `<div class="modal-overlay"></div><div class="modal-content"><h3>Complete Your Purchase</h3><p>Enter your email to receive download links:</p><input type="email" id="guestEmailInput" placeholder="your@email.com" required><div class="modal-buttons"><button id="emailSubmitBtn">Continue to Payment</button><button id="emailCancelBtn">Cancel</button></div></div>`;
      document.body.appendChild(modal);
      requestAnimationFrame(() => modal.classList.add('active'));

      const input = document.getElementById('guestEmailInput');
      const submit = document.getElementById('emailSubmitBtn');
      const cancel = document.getElementById('emailCancelBtn');
      input.focus();

      const done = (v) => { modal.classList.remove('active'); setTimeout(() => modal.remove(), 200); resolve(v); };
      submit.addEventListener('click', () => {
        const email = input.value.trim();
        if (!email || !email.includes('@')) { input.classList.add('input-error'); input.placeholder = 'Please enter a valid email'; return; }
        done(email);
      });
      cancel.addEventListener('click', () => done(null));
      input.addEventListener('keypress', (e) => { if (e.key === 'Enter') submit.click(); });
      input.addEventListener('input', () => { input.classList.remove('input-error'); if (input.placeholder === 'Please enter a valid email') input.placeholder = 'your@email.com'; });
      modal.querySelector('.modal-overlay').addEventListener('click', () => done(null));
    });
  }

  // ── Notification ────────────────────────────────────────────

  showNotification(message, type = 'success') {
    const el = document.createElement('div');
    el.className = 'cart-notification';
    if (type === 'error') el.classList.add('error');
    el.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    setTimeout(() => { el.classList.remove('visible'); setTimeout(() => el.remove(), 300); }, 3000);
  }
}

// ── Init ────────────────────────────────────────────────────
const cartManager = new CartManager();
window.cartManager = cartManager;