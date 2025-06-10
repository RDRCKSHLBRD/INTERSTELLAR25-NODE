// cart.js - Database-Driven Shopping Cart Manager
// Keeps your existing great UI, but uses database instead of localStorage

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
    this.isLoggedIn = false;
    this.userId = null;
    this.sessionId = localStorage.getItem('interstellar.sessionId') || this.generateSessionId();
    localStorage.setItem('interstellar.sessionId', this.sessionId);


    console.log('🛒 Database-driven CartManager initialized');
    this.init();
  }

  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + Date.now();
  }

  async init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
    } else {
      this.setupEventListeners();
    }

    // Check auth status and load cart
    await this.checkAuthStatus();
    await this.loadCartFromDatabase();
    this.updateCartCount();
  }

  async checkAuthStatus() {
    try {
      // Check if authManager is available
      if (window.authManager && window.authManager.isLoggedIn()) {
        this.isLoggedIn = true;
        this.userId = window.authManager.getCurrentUser()?.id;
        console.log('👤 User logged in:', window.authManager.getCurrentUser()?.user_name);
      } else {
        // Fallback - check auth directly
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData.success && userData.user) {
            this.isLoggedIn = true;
            this.userId = userData.user.id;
            console.log('👤 User logged in:', userData.user.user_name);
          }
        } else {
          this.isLoggedIn = false;
          this.userId = null;
          console.log('👤 Anonymous user');
        }
      }
    } catch (error) {
      console.log('👤 Auth check failed, using anonymous mode');
      this.isLoggedIn = false;
    }
  }

  setupEventListeners() {
    // Cart button click
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => this.toggleCartSidebar());
    }

    // Listen for user login/logout events
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
  }

  async loadCartFromDatabase() {
    try {
      let url, headers = {};

      if (this.isLoggedIn && this.userId) {
        url = `/api/cart/${this.userId}`;
        console.log('🔐 Loading cart for user:', this.userId);
      } else {
        url = '/api/cart/session';
        headers['x-session-id'] = this.sessionId;
        console.log('🔗 Loading cart for session:', this.sessionId);
      }

      console.log('📡 Making cart request to:', url);
      console.log('📝 With headers:', headers);

      const response = await fetch(url, {
        headers,
        credentials: 'include'
      });

      console.log('📊 Cart response status:', response.status);

      if (response.ok) {
        const data = await response.json();

        // 🚀 Manually map the server response into this.cart structure
        this.cart = {
          items: data.cart || [],
          itemCount: data.cart ? data.cart.length : 0,
          totalAmount: data.cart
            ? data.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            : 0,
          cartId: null // We can enhance this later if needed
        };

        console.log('🛒 Cart loaded from database:', this.cart);
        console.log('📊 Cart structure check:', {
          hasItems: !!this.cart.items,
          itemsIsArray: Array.isArray(this.cart.items),
          itemCount: this.cart.itemCount,
          totalAmount: this.cart.totalAmount,
          rawItems: this.cart.items
        });
      } else {
        const errorText = await response.text();
        console.log('⚠️ Cart load failed:', response.status, errorText);
        console.log('🛒 No existing cart found, starting fresh');
        this.cart = { items: [], itemCount: 0, totalAmount: 0, cartId: null };
      }
    } catch (error) {
      console.error('❌ Failed to load cart from database:', error);
      this.cart = { items: [], itemCount: 0, totalAmount: 0, cartId: null };
    }
  }



  toggleCartSidebar() {
    if (this.isVisible) {
      this.hideCartSidebar();
    } else {
      this.showCartSidebar();
    }
  }

  async showCartSidebar() {
    // Refresh cart data before showing
    await this.loadCartFromDatabase();
    this.createCartSidebar();
    this.isVisible = true;
  }

  hideCartSidebar() {
    if (this.cartSidebar) {
      this.cartSidebar.style.right = '-100%';
      setTimeout(() => {
        if (this.cartSidebar && this.cartSidebar.parentNode) {
          this.cartSidebar.remove();
        }
        this.cartSidebar = null;
      }, 300);
    }
    this.isVisible = false;
  }

  createCartSidebar() {
    // Remove existing sidebar if any
    if (this.cartSidebar) {
      this.cartSidebar.remove();
    }

    // Create cart sidebar with your existing great design
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
          <button class="checkout-btn" id="checkoutBtn" ${!this.cart.items || this.cart.items.length === 0 ? 'disabled' : ''}>
            Checkout
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.cartSidebar);

    // Add event listeners
    document.getElementById('cartClose').addEventListener('click', () => this.hideCartSidebar());
    document.getElementById('checkoutBtn').addEventListener('click', () => this.handleCheckout());

    // Attach cart item event listeners
    const cartItems = document.getElementById('cartItems');
    this.attachCartItemEventListeners(cartItems);

    // Animate in
    setTimeout(() => {
      this.cartSidebar.style.right = '0';
    }, 10);
  }

  renderCartItems() {
    console.log('🔍 Rendering cart items. Cart data:', this.cart);

    // Handle different possible cart structures
    let items = [];
    if (this.cart.items && Array.isArray(this.cart.items)) {
      items = this.cart.items;
    } else if (Array.isArray(this.cart)) {
      items = this.cart;
    } else if (this.cart.data && Array.isArray(this.cart.data)) {
      items = this.cart.data;
    }

    console.log('📦 Cart items to render:', items);

    if (!items || items.length === 0) {
      return '<div class="cart-empty">Your cart is empty</div>';
    }

    return items.map(item => {
      console.log('🛍️ Rendering item:', item);

      // Handle different item structures
      const albumName = item.album_name || item.product_name || item.name || 'Unknown Album';
      const coverUrl = item.cover_url || '/images/default-album-cover.png';

      const price = item.price || item.product?.price || 15.00;
      const quantity = item.quantity || 1;
      const itemId = item.id || item.cart_item_id;

      return `
        <div class="cart-item" data-item-id="${itemId}">
          <img src="${coverUrl}" 
               alt="${albumName}" 
               class="cart-item-image">
          <div class="cart-item-details">
            <h4>${albumName}</h4>
            <p class="cart-item-price">${parseFloat(price).toFixed(2)}</p>
            <div class="cart-item-controls">
              <button class="quantity-btn decrease-btn" data-item-id="${itemId}" data-action="decrease">-</button>
              <span class="quantity">${quantity}</span>
              <button class="quantity-btn increase-btn" data-item-id="${itemId}" data-action="increase">+</button>
              <button class="remove-btn" data-item-id="${itemId}" data-action="remove">Remove</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  attachCartItemEventListeners(cartItems) {
    // Handle all cart item buttons with event delegation (keeping your existing pattern)
    cartItems.addEventListener('click', async (e) => {
      const itemId = parseInt(e.target.dataset.itemId);
      const action = e.target.dataset.action;

      if (!itemId || !action) return;

      // Disable button during operation
      e.target.disabled = true;

      try {
        switch (action) {
          case 'decrease':
            const currentItem = this.cart.items.find(item => item.id === itemId);
            if (currentItem) {
              await this.updateQuantityInDatabase(itemId, currentItem.quantity - 1);
            }
            break;

          case 'increase':
            const existingItem = this.cart.items.find(item => item.id === itemId);
            if (existingItem) {
              await this.updateQuantityInDatabase(itemId, existingItem.quantity + 1);
            }
            break;

          case 'remove':
            await this.removeFromCartDatabase(itemId);
            break;
        }
      } finally {
        e.target.disabled = false;
      }
    });
  }

  async addToCart(albumId, albumName, coverUrl, price = 15.00) {
    try {
      console.log('🛒 Adding album to cart:', albumId);
      console.log('🔑 Session ID:', this.sessionId);
      console.log('👤 User ID:', this.userId);

      // Get product info for this album from API
      const productResponse = await fetch(`/api/cart/product/album/${albumId}`);

      if (!productResponse.ok) {
        throw new Error('Product not found for this album');
      }

      const productData = await productResponse.json();
      console.log('📦 Product data:', productData);

      // Add to cart via API
      const cartData = {
        productId: productData.product.id,
        quantity: 1
      };

      if (this.isLoggedIn && this.userId) {
        cartData.userId = this.userId;
        console.log('🔐 Adding with userId:', this.userId);
      } else {
        cartData.sessionId = this.sessionId;
        console.log('🔗 Adding with sessionId:', this.sessionId);
      }

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
        const result = await response.json();
        console.log('✅ Added to cart:', result.message);
        console.log('📋 Add response data:', result);

        // Show success message
        this.showCartNotification(`${albumName} added to cart.`);

        // Wait a moment then reload cart to get updated data
        setTimeout(async () => {
          console.log('🔄 Reloading cart after add...');
          await this.loadCartFromDatabase();
          this.updateCartCount();

          // Update sidebar if open
          if (this.isVisible) {
            this.updateCartSidebarContent();
          }
        }, 500);

        return true;
      } else {
        const error = await response.json();
        console.error('❌ Add to cart API error:', error);
        throw new Error(error.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('❌ Add to cart failed:', error);
      this.showCartNotification(error.message, 'error');
      return false;
    }
  }

  async removeFromCartDatabase(cartItemId) {
    try {
      const response = await fetch(`/api/cart/remove/${cartItemId}`, {
        method: 'DELETE',
        headers: {
          'x-session-id': this.sessionId
        },
        credentials: 'include'
      });

      if (response.ok) {
        console.log('✅ Item removed from cart');
        await this.loadCartFromDatabase();
        this.updateCartCount();

        // Update sidebar if open
        if (this.isVisible) {
          this.updateCartSidebarContent();
        }
        return true;
      } else {
        throw new Error('Failed to remove item');
      }
    } catch (error) {
      console.error('❌ Remove from cart failed:', error);
      this.showCartNotification('Failed to remove item', 'error');
      return false;
    }
  }

  async updateQuantityInDatabase(cartItemId, newQuantity) {
    if (newQuantity <= 0) {
      await this.removeFromCartDatabase(cartItemId);
      return;
    }

    try {
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': this.sessionId
        },
        credentials: 'include',
        body: JSON.stringify({
          cartItemId,
          quantity: newQuantity
        })
      });

      if (response.ok) {
        console.log('✅ Cart quantity updated');
        await this.loadCartFromDatabase();
        this.updateCartCount();

        // Update sidebar if open
        if (this.isVisible) {
          this.updateCartSidebarContent();
        }
        return true;
      } else {
        throw new Error('Failed to update quantity');
      }
    } catch (error) {
      console.error('❌ Update quantity failed:', error);
      this.showCartNotification('Failed to update quantity', 'error');
      return false;
    }
  }

  updateCartSidebarContent() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.querySelector('.cart-total');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cartItems) {
      cartItems.innerHTML = this.renderCartItems();

      // Re-attach event listeners after updating content
      this.attachCartItemEventListeners(cartItems);
    }

    if (cartTotal) {
      cartTotal.innerHTML = `<strong>Total: $${(this.cart.totalAmount || 0).toFixed(2)}</strong>`;
    }

    if (checkoutBtn) {
      checkoutBtn.disabled = !this.cart.items || this.cart.items.length === 0;
    }
  }

  getCartTotal() {
    return this.cart.totalAmount || 0;
  }

  getCartItemCount() {
    return this.cart.itemCount || 0;
  }

  updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    const count = this.getCartItemCount();

    if (cartCount) {
      cartCount.textContent = count;
      cartCount.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  async clearCart() {
    // This would need a clear cart API endpoint
    // For now, remove items one by one
    if (this.cart.items) {
      for (const item of this.cart.items) {
        await this.removeFromCartDatabase(item.id);
      }
    }
  }

  async handleCheckout() {
    if (!this.cart.items || this.cart.items.length === 0) return;

    // Here you would integrate with your payment system (Stripe)
    console.log('Proceeding to checkout with items:', this.cart);

    // For now, just show a message
    this.showCartNotification('Checkout functionality coming soon!');

    // You could redirect to checkout page or open Stripe here
    // Example: window.location.href = `/checkout?cartId=${this.cart.cartId}`;
  }

  showCartNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `<span>${message}</span>`;

    // Style based on type
    notification.style.backgroundColor = type === 'error' ? '#dc3545' : '#083644';
    notification.style.color = '#bfd4d6';
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '12px 16px';
    
    notification.style.zIndex = '10000';
    notification.style.fontWeight = '200';

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  // Public method to add album to cart from UI
  async addAlbumToCart(albumId) {
    try {
      // Get album data from API
      const album = await window.apiClient.getAlbum(albumId);
      if (album) {
        await this.addToCart(albumId, album.name, album.cover_url);
      } else {
        console.error('Album not found:', albumId);
        this.showCartNotification('Album not found', 'error');
      }
    } catch (error) {
      console.error('Failed to add album to cart:', error);
      this.showCartNotification('Failed to add album to cart. Please try again.', 'error');
    }
  }


 /**
 * Add a single song to the cart.
 *
 * @param {string|number} songId     – e.g. "0601" or 601
 * @param {object|null}   songMeta   – optional song object we already have
 */
async addSongToCart(songId, songMeta = null) {
  console.log('🛒 Adding song to cart:', songId);
  
  /* ── 1. Resolve the song object ─────────────────────────────────── */
  let song = songMeta;
  if (!song) {
    try {
      // Accept both "0601" and 601
      const cleanId = String(songId).replace(/^0+/, '');
      song = await window.apiClient.getSong(cleanId);
    } catch (error) {
      console.error('Failed to fetch song:', error);
    }
  }

  if (!song) {
    console.error('[Cart] Song not found:', songId);
    this.showCartNotification('Song not found', 'error');
    return;
  }

  console.log('🎵 Song found:', song);

  /* ── 2. Get (or invent) a product for this song ─────────────────── */
  let productId = null;
  let productPrice = song.price ?? 1.29;

  try {
    // THIS WAS THE BUG - use song.id, not song as albumId
    const res = await fetch(`/api/cart/product/song/${song.id}`);
    if (res.ok) {
      const data = await res.json();
      productId = data.product?.id ?? null;
      productPrice = data.product?.price ?? productPrice;
      console.log('✅ Found product for song:', data.product);
    } else {
      console.log('⚠️ No product found for song, will use virtual product');
    }
  } catch (error) {
    console.error('❌ Error fetching song product:', error);
  }

  if (!productId) {
    // Backend song-product route not ready yet → skip cart for now
    console.warn('[Cart] No product found for song', song.id);
    this.showCartNotification('Song purchases not available yet', 'error');
    return;
  }

  /* ── 3. Call addToCart with SONG data, not album data ──────────── */
  try {
    console.log('🛒 Adding song to cart via addToCart...');
    
    // Create a simplified addToCart call specifically for songs
    await this.addSongToCartDatabase(song, productId, productPrice);
    
  } catch (error) {
    console.error('❌ Failed to add song to cart:', error);
    this.showCartNotification('Failed to add song to cart', 'error');
  }
}

/**
 * Add song directly to cart database (bypassing the album-focused addToCart method)
 */
async addSongToCartDatabase(song, productId, price) {
  try {
    console.log('🛒 Adding song to cart database:', song.name);
    console.log('🔑 Session ID:', this.sessionId);
    console.log('👤 User ID:', this.userId);
    console.log('📦 Product ID:', productId);

    const cartData = {
      productId: productId,
      quantity: 1
    };

    if (this.isLoggedIn && this.userId) {
      cartData.userId = this.userId;
      console.log('🔐 Adding with userId:', this.userId);
    } else {
      cartData.sessionId = this.sessionId;
      console.log('🔗 Adding with sessionId:', this.sessionId);
    }

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
      const result = await response.json();
      console.log('✅ Song added to cart:', result.message);
      
      // Show success message
      this.showCartNotification(`${song.name} added to cart.`);

      // Reload cart to get updated data
      setTimeout(async () => {
        console.log('🔄 Reloading cart after song add...');
        await this.loadCartFromDatabase();
        this.updateCartCount();

        // Update sidebar if open
        if (this.isVisible) {
          this.updateCartSidebarContent();
        }
      }, 500);

      return true;
    } else {
      const error = await response.json();
      console.error('❌ Add song to cart API error:', error);
      throw new Error(error.error || 'Failed to add song to cart');
    }
  } catch (error) {
    console.error('❌ Add song to cart database failed:', error);
    this.showCartNotification(error.message, 'error');
    return false;
  }
}



  // Get cart data for other components
  getCartData() {
    return this.cart;
  }
}

// Initialize cart manager
const cartManager = new CartManager();

// Make available globally
window.cartManager = cartManager;