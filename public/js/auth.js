// auth.js - Authentication Handler
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
    this.modal.style.display = 'block';
  }

  showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    this.clearErrors();
    this.modal.style.display = 'block';
  }

  closeModal() {
    this.modal.style.display = 'none';
    this.clearForms();
    this.clearErrors();
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.currentUser = data.user;
        this.updateUIForLoggedInUser();
        this.closeModal();
      } else {
        this.showError('login', data.message || 'Login failed');
      }
    } catch (error) {
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
      } else {
        this.showError('register', data.message || 'Registration failed');
      }
    } catch (error) {
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