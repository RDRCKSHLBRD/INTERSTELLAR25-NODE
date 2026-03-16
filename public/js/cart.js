// cart.js V6 — Database-Driven Shopping Cart Manager
// RODUX principle: JS builds DOM with classnames only. No inline styles.
// CSS (cart.css) is the rendering engine.

class CartManager {
  constructor() {
    this.cart = {
      items: [],
      itemCount: 0,
      totalAmount: 0,
      cartId: null
    };
    this.isVisible = false;
    this.cartSidebar = null;
    this.backdrop = null;
    this.isLoggedIn = false;
    this.userId = null;
    this.sessionId = localStorage.getItem('interstellar.sessionId') || this.generateSessionId();
    localStorage.setItem('interstellar.sessionId', this.sessionId);

    console.log('🛒 CartManager V6 initialized');
    this.init();
  }

  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + Date.now();
  }

  async init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
    } else {
      this.setupEventListeners();
    }

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
        const userData = await response.json();
        if (userData.success && userData.user) {
          this.isLoggedIn = true;
          this.userId = userData.user.id;
        }
      } else {
        this.isLoggedIn = false;
        this.userId = null;
      }
    } catch (error) {
      this.isLoggedIn = false;
    }
  }

  // ── Events ──────────────────────────────────────────────────

  setupEventListeners() {
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => this.toggleCartSidebar());
    }

    window.addEventListener('userLoggedIn', async (e) => {
      this.isLoggedIn = true;
      this.userId = e.detail.user.id;
      await this.loadCartFromDatabase();
      this.updateCartCount();
    });

    window.addEventListener('userLoggedOut', async () => {
      this.isLoggedIn = false;
      this.userId = null;
      this.sessionId = this.generateSessionId();
      await this.loadCartFromDatabase();
      this.updateCartCount();
    });

    // ESC to close sidebar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hideCartSidebar();
      }
    });
  }

  // ── Database ────────────────────────────────────────────────

  async loadCartFromDatabase() {
    try {
      let cartUrl = '/api/cart/session';

      try {
        const authResponse = await fetch('/api/auth/me', { credentials: 'include' });
        if (authResponse.ok) {
          const userData = await authResponse.json();
          if (userData.success && userData.user && userData.user.id) {
            cartUrl = `/api/cart/${userData.user.id}`;
            this.isLoggedIn = true;
            this.userId = userData.user.id;
          }
        }
      } catch (_) { /* session cart fallback */ }

      const headers = { 'Content-Type': 'application/json' };
      if (!this.isLoggedIn) {
        headers['x-session-id'] = this.sessionId;
      }

      const response = await fetch(cartUrl, { headers, credentials: 'include' });

      if (response.ok) {
        const data = await response.json();
        const cartItems = Array.isArray(data) ? data : (data.cart || data.items || []);

        this.cart = {
          items: cartItems,
          itemCount: cartItems.length,
          totalAmount: cartItems.reduce((sum, item) =>
            sum + (parseFloat(item.price || 0) * (item.quantity || 1)), 0),
          cartId: null
        };
      } else {
        this.cart = { items: [], itemCount: 0, totalAmount: 0, cartId: null };
      }
    } catch (error) {
      console.error('❌ Failed to load cart:', error);
      this.cart = { items: [], itemCount: 0, totalAmount: 0, cartId: null };
    }
  }

  // ── Sidebar Toggle ──────────────────────────────────────────

  toggleCartSidebar() {
    if (this.isVisible) {
      this.hideCartSidebar();
    } else {
      this.showCartSidebar();
    }
  }

  async showCartSidebar() {
    await this.loadCartFromDatabase();
    this.createCartSidebar();
    this.isVisible = true;
  }

  hideCartSidebar() {
    if (this.cartSidebar) {
      this.cartSidebar.classList.remove('open');
    }
    if (this.backdrop) {
      this.backdrop.classList.remove('visible');
    }

    setTimeout(() => {
      if (this.cartSidebar && this.cartSidebar.parentNode) {
        this.cartSidebar.remove();
      }
      if (this.backdrop && this.backdrop.parentNode) {
        this.backdrop.remove();
      }
      this.cartSidebar = null;
      this.backdrop = null;
    }, 300);

    this.isVisible = false;
  }

  // ── Sidebar Build ───────────────────────────────────────────

  createCartSidebar() {
    // Clean up any existing sidebar
    if (this.cartSidebar) this.cartSidebar.remove();
    if (this.backdrop) this.backdrop.remove();

    // Backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'cart-backdrop';
    this.backdrop.addEventListener('click', () => this.hideCartSidebar());
    document.body.appendChild(this.backdrop);

    // Sidebar
    this.cartSidebar = document.createElement('div');
    this.cartSidebar.className = 'cart-sidebar';
    this.cartSidebar.innerHTML = `
      <div class="cart-header">
        <h3>Shopping Cart</h3>
        <button class="cart-close" id="cartClose"></button>
      </div>
      <div class="cart-content">
        <div class="cart-items" id="cartItems">
          ${this.renderCartItems()}
        </div>
        <div class="cart-footer">
          <div class="cart-total">
            <strong>Total: $${(this.cart.totalAmount || 0).toFixed(2)}</strong>
          </div>
          <button class="checkout-btn" id="checkoutBtn"
            ${!this.cart.items || this.cart.items.length === 0 ? 'disabled' : ''}>
            Checkout
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.cartSidebar);

    // Events
    document.getElementById('cartClose').addEventListener('click', () => this.hideCartSidebar());
    document.getElementById('checkoutBtn').addEventListener('click', () => this.handleCheckout());

    const cartItemsEl = document.getElementById('cartItems');
    this.attachCartItemEventListeners(cartItemsEl);

    // Trigger open on next frame (allows CSS transition)
    requestAnimationFrame(() => {
      this.cartSidebar.classList.add('open');
      this.backdrop.classList.add('visible');
    });
  }

  // ── Render Items ────────────────────────────────────────────

  renderCartItems() {
    let items = [];
    if (this.cart.items && Array.isArray(this.cart.items)) {
      items = this.cart.items;
    } else if (Array.isArray(this.cart)) {
      items = this.cart;
    } else if (this.cart.data && Array.isArray(this.cart.data)) {
      items = this.cart.data;
    }

    if (!items || items.length === 0) {
      return '<div class="cart-empty">Your cart is empty</div>';
    }

    return items.map(item => {
      const productType = item.product_type || (item.song_id ? 'song' : 'album');
      const primaryName = item.product_name || item.name || 'Unknown Item';
      const albumName = item.album_name;
      const coverUrl = item.cover_url || '/images/default-album-cover.png';
      const price = item.price || item.product?.price || 15.00;
      const quantity = item.quantity || 1;
      const itemId = item.id || item.cart_item_id;

      let displayTitle;
      if (productType === 'song' && albumName && albumName !== primaryName) {
        displayTitle = `
          <h4 class="cart-item-title">
            <span class="song-name">${primaryName}</span>
            <span class="album-subtitle">from ${albumName}</span>
          </h4>
        `;
      } else {
        displayTitle = `<h4 class="cart-item-title">${primaryName}</h4>`;
      }

      return `
        <div class="cart-item" data-item-id="${itemId}" data-product-type="${productType}">
          <img src="${coverUrl}"
               alt="${primaryName}"
               class="cart-item-image">
          <div class="cart-item-details">
            ${displayTitle}
            <p class="cart-item-price">$${parseFloat(price).toFixed(2)}</p>
            <div class="cart-item-controls">
              <button class="quantity-btn decrease-btn"
                      data-item-id="${itemId}" data-action="decrease">−</button>
              <span class="quantity">${quantity}</span>
              <button class="quantity-btn increase-btn"
                      data-item-id="${itemId}" data-action="increase">+</button>
              <button class="remove-btn"
                      data-item-id="${itemId}" data-action="remove">Remove</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ── Item Event Delegation ───────────────────────────────────

  attachCartItemEventListeners(cartItemsEl) {
    cartItemsEl.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const itemId = parseInt(btn.dataset.itemId);
      const action = btn.dataset.action;
      if (!itemId || !action) return;

      btn.disabled = true;

      try {
        switch (action) {
          case 'decrease': {
            const item = this.cart.items.find(i => i.id === itemId);
            if (item) await this.updateQuantityInDatabase(itemId, item.quantity - 1);
            break;
          }
          case 'increase': {
            const item = this.cart.items.find(i => i.id === itemId);
            if (item) await this.updateQuantityInDatabase(itemId, item.quantity + 1);
            break;
          }
          case 'remove':
            await this.removeFromCartDatabase(itemId);
            break;
        }
      } finally {
        btn.disabled = false;
      }
    });
  }

  // ── Add to Cart (Album) ─────────────────────────────────────

  async addToCart(albumId, albumName, coverUrl, price = 15.00) {
    try {
      const productResponse = await fetch(`/api/cart/product/album/${albumId}`);

      if (!productResponse.ok) {
        throw new Error('Product not found for this album');
      }

      const productData = await productResponse.json();

      const cartData = { productId: productData.product.id, quantity: 1 };

      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': this.sessionId
        },
        credentials: 'include',
        body: JSON.stringify(cartData)
      });

      if (response.ok) {
        this.showNotification(`${albumName} added to cart.`);

        setTimeout(async () => {
          await this.loadCartFromDatabase();
          this.updateCartCount();
          if (this.isVisible) this.updateCartSidebarContent();
        }, 500);

        return true;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('❌ Add to cart failed:', error);
      this.showNotification(error.message, 'error');
      return false;
    }
  }

  // ── Add to Cart (Song) ──────────────────────────────────────

  async addSongToCart(songId, songMeta = null) {
    let song = songMeta;
    if (!song) {
      try {
        const cleanId = String(songId).replace(/^0+/, '');
        song = await window.apiClient.getSong(cleanId);
      } catch (error) {
        console.error('Failed to fetch song:', error);
      }
    }

    if (!song) {
      this.showNotification('Song not found', 'error');
      return;
    }

    let productId = null;
    let productPrice = song.price ?? 1.29;

    try {
      const res = await fetch(`/api/cart/product/song/${song.id}`);
      if (res.ok) {
        const data = await res.json();
        productId = data.product?.id ?? null;
        productPrice = data.product?.price ?? productPrice;
      }
    } catch (_) { /* no product found */ }

    if (!productId) {
      this.showNotification('Song purchases not available yet', 'error');
      return;
    }

    await this.addSongToCartDatabase(song, productId, productPrice);
  }

  async addSongToCartDatabase(song, productId, price) {
    try {
      const cartData = { productId, quantity: 1 };

      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': this.sessionId
        },
        credentials: 'include',
        body: JSON.stringify(cartData)
      });

      if (response.ok) {
        this.showNotification(`${song.name} added to cart.`);

        setTimeout(async () => {
          await this.loadCartFromDatabase();
          this.updateCartCount();
          if (this.isVisible) this.updateCartSidebarContent();
        }, 500);
      } else {
        throw new Error('Failed to add song to cart');
      }
    } catch (error) {
      console.error('❌ Add song to cart failed:', error);
      this.showNotification('Failed to add song to cart', 'error');
    }
  }

  // ── Public Album/Song Helpers ───────────────────────────────

  async addAlbumToCart(albumId) {
    try {
      const album = await window.apiClient.getAlbum(albumId);
      if (album) {
        await this.addToCart(albumId, album.name, album.cover_url);
      } else {
        this.showNotification('Album not found', 'error');
      }
    } catch (error) {
      this.showNotification('Failed to add album to cart. Please try again.', 'error');
    }
  }

  // ── Remove / Update ─────────────────────────────────────────

  async removeFromCartDatabase(cartItemId) {
    try {
      const response = await fetch(`/api/cart/remove/${cartItemId}`, {
        method: 'DELETE',
        headers: { 'x-session-id': this.sessionId },
        credentials: 'include'
      });

      if (response.ok) {
        await this.loadCartFromDatabase();
        this.updateCartCount();
        if (this.isVisible) this.updateCartSidebarContent();
        return true;
      } else {
        throw new Error('Failed to remove item');
      }
    } catch (error) {
      this.showNotification('Failed to remove item', 'error');
      return false;
    }
  }

  async updateQuantityInDatabase(cartItemId, newQuantity) {
    if (newQuantity <= 0) {
      await this.removeFromCartDatabase(cartItemId);
      return;
    }

    try {
      const response = await fetch(`/api/cart/update/${cartItemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': this.sessionId
        },
        credentials: 'include',
        body: JSON.stringify({ quantity: newQuantity })
      });

      if (response.ok) {
        await this.loadCartFromDatabase();
        this.updateCartCount();
        if (this.isVisible) this.updateCartSidebarContent();
        return true;
      } else {
        throw new Error('Failed to update quantity');
      }
    } catch (error) {
      this.showNotification('Failed to update quantity', 'error');
      return false;
    }
  }

  // ── Sidebar Content Refresh ─────────────────────────────────

  updateCartSidebarContent() {
    const cartItemsEl = document.getElementById('cartItems');
    const cartTotal = document.querySelector('.cart-total');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cartItemsEl) {
      cartItemsEl.innerHTML = this.renderCartItems();
      this.attachCartItemEventListeners(cartItemsEl);
    }

    if (cartTotal) {
      cartTotal.innerHTML = `<strong>Total: $${(this.cart.totalAmount || 0).toFixed(2)}</strong>`;
    }

    if (checkoutBtn) {
      checkoutBtn.disabled = !this.cart.items || this.cart.items.length === 0;
    }
  }

  // ── Cart Count Badge ────────────────────────────────────────

  updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    const count = this.cart.itemCount || 0;

    if (cartCount) {
      cartCount.textContent = count;
      // V6: class toggle, not style.display
      cartCount.classList.toggle('hidden', count === 0);
    }
  }

  getCartTotal() {
    return this.cart.totalAmount || 0;
  }

  getCartItemCount() {
    return this.cart.itemCount || 0;
  }

  // ── Clear Cart ──────────────────────────────────────────────

  async clearCart() {
    if (this.cart.items) {
      for (const item of this.cart.items) {
        await this.removeFromCartDatabase(item.id);
      }
    }
  }

  // ── Checkout ────────────────────────────────────────────────

  async handleCheckout() {
    if (!this.cart.items || this.cart.items.length === 0) return;

    try {
      const configResponse = await fetch('/api/config');
      const config = await configResponse.json();

      const checkoutData = {
        isLoggedIn: this.isLoggedIn,
        userId: this.userId,
        sessionId: this.sessionId,
        cartItems: this.cart.items
      };

      if (!this.isLoggedIn) {
        const guestEmail = await this.collectGuestEmail();
        if (!guestEmail) return;
        checkoutData.guestEmail = guestEmail;
        checkoutData.purchaseType = 'guest';
      } else {
        checkoutData.purchaseType = 'user';
      }

      const response = await fetch('/api/purchase/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(checkoutData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        this.showNotification(`Checkout failed: ${errorData}`, 'error');
        return;
      }

      const data = await response.json();

      if (data.id) {
        const stripe = Stripe(config.stripePublishableKey);
        await stripe.redirectToCheckout({ sessionId: data.id });
      } else {
        this.showNotification('Could not start checkout.', 'error');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      this.showNotification('Checkout failed. Try again.', 'error');
    }
  }

  // ── Guest Email Modal ───────────────────────────────────────

  collectGuestEmail() {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'guest-email-modal';
      modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <h3>Complete Your Purchase</h3>
          <p>Enter your email to receive download links:</p>
          <input type="email" id="guestEmailInput" placeholder="your@email.com" required>
          <div class="modal-buttons">
            <button id="emailSubmitBtn">Continue to Payment</button>
            <button id="emailCancelBtn">Cancel</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Activate on next frame (CSS transition)
      requestAnimationFrame(() => modal.classList.add('active'));

      const emailInput = document.getElementById('guestEmailInput');
      const submitBtn = document.getElementById('emailSubmitBtn');
      const cancelBtn = document.getElementById('emailCancelBtn');

      emailInput.focus();

      const cleanup = (value) => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 200);
        resolve(value);
      };

      submitBtn.addEventListener('click', () => {
        const email = emailInput.value.trim();
        if (!email || !email.includes('@')) {
          emailInput.classList.add('input-error');
          emailInput.placeholder = 'Please enter a valid email';
          return;
        }
        cleanup(email);
      });

      cancelBtn.addEventListener('click', () => cleanup(null));

      emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitBtn.click();
      });

      emailInput.addEventListener('input', () => {
        emailInput.classList.remove('input-error');
        if (emailInput.placeholder === 'Please enter a valid email') {
          emailInput.placeholder = 'your@email.com';
        }
      });

      // Click overlay to cancel
      modal.querySelector('.modal-overlay').addEventListener('click', () => cleanup(null));
    });
  }

  // ── Notification ────────────────────────────────────────────

  showNotification(message, type = 'success') {
    const el = document.createElement('div');
    el.className = 'cart-notification';
    if (type === 'error') el.classList.add('error');
    el.innerHTML = `<span>${message}</span>`;

    document.body.appendChild(el);

    // Activate on next frame (CSS transition)
    requestAnimationFrame(() => el.classList.add('visible'));

    setTimeout(() => {
      el.classList.remove('visible');
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }
}

// ── Init ────────────────────────────────────────────────────
const cartManager = new CartManager();
window.cartManager = cartManager;