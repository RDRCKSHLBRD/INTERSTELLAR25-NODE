// cart.js - Shopping Cart Manager
class CartManager {
  constructor() {
    this.cart = [];
    this.isVisible = false;
    this.cartSidebar = null;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
    } else {
      this.setupEventListeners();
    }
    
    // Load cart from storage if user is logged in
    this.loadCartFromStorage();
  }

  setupEventListeners() {
    // Cart button click
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => this.toggleCartSidebar());
    }

    // Listen for user login/logout events
    window.addEventListener('userLoggedIn', (e) => {
      this.loadUserCart(e.detail.user);
    });

    window.addEventListener('userLoggedOut', () => {
      this.clearCart();
    });
  }

  toggleCartSidebar() {
    if (this.isVisible) {
      this.hideCartSidebar();
    } else {
      this.showCartSidebar();
    }
  }

  showCartSidebar() {
    this.createCartSidebar();
    this.isVisible = true;
    
    // Hide album sidebar if it's open
    const albumSidebar = document.querySelector('.sidebar');
    if (albumSidebar && albumSidebar.style.display !== 'none') {
      uiManager.hideSidebar();
    }
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

    // Create cart sidebar
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
            <strong>Total: $${this.getCartTotal().toFixed(2)}</strong>
          </div>
          <button class="checkout-btn" id="checkoutBtn" ${this.cart.length === 0 ? 'disabled' : ''}>
            Checkout
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.cartSidebar);

    // Add event listeners
    document.getElementById('cartClose').addEventListener('click', () => this.hideCartSidebar());
    document.getElementById('checkoutBtn').addEventListener('click', () => this.handleCheckout());

    // Animate in
    setTimeout(() => {
      this.cartSidebar.style.right = '0';
    }, 10);
  }

  renderCartItems() {
    if (this.cart.length === 0) {
      return '<div class="cart-empty">Your cart is empty</div>';
    }

    return this.cart.map(item => `
      <div class="cart-item" data-album-id="${item.albumId}">
        <img src="${item.coverUrl}" alt="${item.albumName}" class="cart-item-image">
        <div class="cart-item-details">
          <h4>${item.albumName}</h4>
          <p class="cart-item-price">$${item.price.toFixed(2)}</p>
          <div class="cart-item-controls">
            <button class="quantity-btn" onclick="cartManager.updateQuantity(${item.albumId}, ${item.quantity - 1})">-</button>
            <span class="quantity">${item.quantity}</span>
            <button class="quantity-btn" onclick="cartManager.updateQuantity(${item.albumId}, ${item.quantity + 1})">+</button>
            <button class="remove-btn" onclick="cartManager.removeFromCart(${item.albumId})">Remove</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  addToCart(albumId, albumName, coverUrl, price = 15.00) {
    const existingItem = this.cart.find(item => item.albumId === albumId);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cart.push({
        albumId,
        albumName,
        coverUrl,
        price,
        quantity: 1
      });
    }

    this.updateCartCount();
    this.saveCartToStorage();
    
    // Show success message
    this.showCartNotification(`${albumName} added to cart!`);
    
    // Update sidebar if open
    if (this.isVisible) {
      this.updateCartSidebarContent();
    }
  }

  removeFromCart(albumId) {
    this.cart = this.cart.filter(item => item.albumId !== albumId);
    this.updateCartCount();
    this.saveCartToStorage();
    
    // Update sidebar if open
    if (this.isVisible) {
      this.updateCartSidebarContent();
    }
  }

  updateQuantity(albumId, newQuantity) {
    if (newQuantity <= 0) {
      this.removeFromCart(albumId);
      return;
    }

    const item = this.cart.find(item => item.albumId === albumId);
    if (item) {
      item.quantity = newQuantity;
      this.updateCartCount();
      this.saveCartToStorage();
      
      // Update sidebar if open
      if (this.isVisible) {
        this.updateCartSidebarContent();
      }
    }
  }

  updateCartSidebarContent() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.querySelector('.cart-total');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (cartItems) {
      cartItems.innerHTML = this.renderCartItems();
    }
    
    if (cartTotal) {
      cartTotal.innerHTML = `<strong>Total: $${this.getCartTotal().toFixed(2)}</strong>`;
    }
    
    if (checkoutBtn) {
      checkoutBtn.disabled = this.cart.length === 0;
    }
  }

  getCartTotal() {
    return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getCartItemCount() {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    const count = this.getCartItemCount();
    
    if (cartCount) {
      cartCount.textContent = count;
      cartCount.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  clearCart() {
    this.cart = [];
    this.updateCartCount();
    this.saveCartToStorage();
    
    if (this.isVisible) {
      this.updateCartSidebarContent();
    }
  }

  loadCartFromStorage() {
    try {
      const savedCart = localStorage.getItem('interstellar_cart');
      if (savedCart) {
        this.cart = JSON.parse(savedCart);
        this.updateCartCount();
      }
    } catch (error) {
      console.error('Failed to load cart from storage:', error);
    }
  }

  saveCartToStorage() {
    try {
      localStorage.setItem('interstellar_cart', JSON.stringify(this.cart));
    } catch (error) {
      console.error('Failed to save cart to storage:', error);
    }
  }

  async loadUserCart(user) {
    // When user logs in, you might want to sync with server cart
    // For now, just keep the local cart
    console.log('User logged in, cart preserved:', user);
  }

  async handleCheckout() {
    if (this.cart.length === 0) return;
    
    // Here you would integrate with your payment system
    console.log('Proceeding to checkout with items:', this.cart);
    
    // For now, just show a message
    alert('Checkout functionality coming soon! Your cart has been saved.');
  }

  showCartNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
      <span>🛒</span>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  // Public method to add album to cart from purchase links
  addAlbumToCart(albumId) {
    // Get album data from global data object
    const album = window.data?.albums?.[albumId];
    if (album) {
      this.addToCart(albumId, album.name, album.cover_url);
    } else {
      console.error('Album not found:', albumId);
    }
  }
}

// Initialize cart manager
const cartManager = new CartManager();