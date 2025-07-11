// auth.js - Authentication Handler with Cart Integration

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.modal = null;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
    } else {
      this.setupEventListeners();
    }
    
    // Check if user is already logged in
    this.checkAuthStatus();
  }

  setupEventListeners() {
    this.modal = document.getElementById('authModal');
    
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.showLoginForm());
    }

    // Close modal
    const closeBtn = document.querySelector('.auth-modal .close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    // Close modal when clicking outside
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.closeModal();
        }
      });
    }

    // Form toggles
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    
    if (showRegister) {
      showRegister.addEventListener('click', () => this.showRegisterForm());
    }
    
    if (showLogin) {
      showLogin.addEventListener('click', () => this.showLoginForm());
    }

    // Form submissions
    const loginForm = document.getElementById('loginFormElement');
    const registerForm = document.getElementById('registerFormElement');
    
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // Password toggle functionality
    this.setupPasswordToggles();
  }

  setupPasswordToggles() {
    const toggleIcons = document.querySelectorAll('.password-toggle-icon');
    
    toggleIcons.forEach(icon => {
      icon.addEventListener('click', (e) => {
        const targetId = e.target.dataset.target;
        const passwordInput = document.getElementById(targetId);
        
        if (passwordInput) {
          if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.add('password-visible');
            icon.setAttribute('title', 'Hide password');
          } else {
            passwordInput.type = 'password';
            icon.classList.remove('password-visible');
            icon.setAttribute('title', 'Show password');
          }
        }
      });

      // Set initial title
      icon.setAttribute('title', 'Show password');
    });
  }

  async checkAuthStatus() {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          this.currentUser = data.user;
          this.updateUIForLoggedInUser();
        }
      }
    } catch (error) {
      console.log('Not logged in:', error);
    }
  }

  showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    this.clearErrors();
    this.resetPasswordToggles();
    this.modal.style.display = 'block';
  }

  showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    this.clearErrors();
    this.resetPasswordToggles();
    this.modal.style.display = 'block';
  }

  closeModal() {
    this.modal.style.display = 'none';
    this.clearForms();
    this.clearErrors();
    this.resetPasswordToggles();
  }

  clearForms() {
    document.getElementById('loginFormElement').reset();
    document.getElementById('registerFormElement').reset();
  }

  clearErrors() {
    const errorElements = document.querySelectorAll('.auth-error, .auth-success');
    errorElements.forEach(el => {
      el.style.display = 'none';
      el.textContent = '';
    });
  }

  resetPasswordToggles() {
    // Reset all password inputs to type="password" and icon states
    const passwordInputs = document.querySelectorAll('#loginPassword, #registerPassword');
    const toggleIcons = document.querySelectorAll('.password-toggle-icon');
    
    passwordInputs.forEach(input => {
      input.type = 'password';
    });
    
    toggleIcons.forEach(icon => {
      icon.classList.remove('password-visible');
      icon.setAttribute('title', 'Show password');
    });
  }

  showError(formType, message) {
    const errorElement = document.getElementById(`${formType}Error`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  showSuccess(formType, message) {
    const successElement = document.getElementById(`${formType}Success`);
    if (successElement) {
      successElement.textContent = message;
      successElement.style.display = 'block';
    }
  }

  async handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  const submitBtn = document.getElementById('loginSubmit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';
  
  try {
    // 🔧 GET SESSION ID from cartManager
    const sessionId = window.cartManager ? window.cartManager.sessionId : 
                     localStorage.getItem('interstellar.sessionId');
    
    console.log('🔑 Sending login with sessionId:', sessionId);
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId  // 🔧 SEND SESSION ID IN HEADERS
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      this.currentUser = data.user;
      this.updateUIForLoggedInUser();
      this.closeModal();
      
      // 🔄 REFRESH CART AFTER LOGIN
      console.log('🔄 Login successful, refreshing cart...');
      if (window.cartManager) {
        await window.cartManager.refreshCartAfterLogin();
        console.log('✅ Cart refreshed after login');
      }
      
    } else {
      this.showError('login', data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    this.showError('login', 'Network error. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Log In';
  }
}

  async handleRegister(e) {
    e.preventDefault();
    
    const userData = {
      user_name: document.getElementById('registerUsername').value,
      name_first: document.getElementById('registerFirstName').value,
      name_last: document.getElementById('registerLastName').value,
      email: document.getElementById('registerEmail').value,
      password: document.getElementById('registerPassword').value
    };
    
    const submitBtn = document.getElementById('registerSubmit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.currentUser = data.user;
        this.updateUIForLoggedInUser();
        this.closeModal();
        
        // 🔄 REFRESH CART AFTER REGISTRATION
        console.log('🔄 Registration successful, refreshing cart...');
        if (window.cartManager) {
          await window.cartManager.refreshCartAfterLogin();
          console.log('✅ Cart refreshed after registration');
        }
        
      } else {
        this.showError('register', data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.showError('register', 'Network error. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  }

  async handleLogout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        this.currentUser = null;
        this.updateUIForLoggedOutUser();
        
        // 🔄 REFRESH CART AFTER LOGOUT
        console.log('🔄 Logout successful, refreshing cart...');
        if (window.cartManager) {
          // Generate new session for anonymous cart
          window.cartManager.sessionId = window.cartManager.generateSessionId();
          localStorage.setItem('interstellar.sessionId', window.cartManager.sessionId);
          
          await window.cartManager.refreshCartAfterLogin();
          console.log('✅ Cart refreshed after logout');
        }
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  updateUIForLoggedInUser() {
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (userInfo) userInfo.style.display = 'block';
    if (userName && this.currentUser) {
      userName.textContent = this.currentUser.user_name;
    }
    
    // Trigger custom event for other components
    window.dispatchEvent(new CustomEvent('userLoggedIn', { 
      detail: { user: this.currentUser } 
    }));
  }

  updateUIForLoggedOutUser() {
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    
    if (loginBtn) loginBtn.style.display = 'block';
    if (userInfo) userInfo.style.display = 'none';
    
    // Trigger custom event for other components
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
  }

  // Public method to get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Public method to check if user is logged in
  isLoggedIn() {
    return !!this.currentUser;
  }
}

// Initialize auth manager when script loads
const authManager = new AuthManager();

// Make available globally
window.authManager = authManager;