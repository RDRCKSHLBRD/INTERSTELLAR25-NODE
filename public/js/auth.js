// auth.js V6.2 — Authentication Handler
// Works with footer user-cell stack (#userCell .user-cell)
// V6 principle: class toggles, no inline styles for show/hide

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.modal = null;
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
    } else {
      this.setupEventListeners();
    }
    // Lazy: don't check auth on load. Cart handles this via _ensureInitialized.
    // Only check if we have a session cookie hint.
  }

  setupEventListeners() {
    this.modal = document.getElementById('authModal');

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.addEventListener('click', () => this.showLoginForm());

    const closeBtn = document.querySelector('.auth-modal .close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeModal();
      });
    }

    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    if (showRegister) showRegister.addEventListener('click', () => this.showRegisterForm());
    if (showLogin) showLogin.addEventListener('click', () => this.showLoginForm());

    const loginForm = document.getElementById('loginFormElement');
    const registerForm = document.getElementById('registerFormElement');
    if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    if (registerForm) registerForm.addEventListener('submit', (e) => this.handleRegister(e));

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => this.handleLogout());

    this.setupPasswordToggles();
  }

  setupPasswordToggles() {
    document.querySelectorAll('.password-toggle-icon').forEach(icon => {
      icon.addEventListener('click', (e) => {
        const input = document.getElementById(e.target.dataset.target);
        if (input) {
          const showing = input.type === 'password';
          input.type = showing ? 'text' : 'password';
          icon.classList.toggle('password-visible', showing);
          icon.title = showing ? 'Hide password' : 'Show password';
        }
      });
      icon.title = 'Show password';
    });
  }

  // ── Modal ───────────────────────────────────────────────────

  showLoginForm() {
    document.getElementById('loginForm').classList.remove('form-hidden');
    document.getElementById('registerForm').classList.add('form-hidden');
    this.clearErrors();
    this.resetPasswordToggles();
    this.modal.classList.add('modal-visible');
  }

  showRegisterForm() {
    document.getElementById('loginForm').classList.add('form-hidden');
    document.getElementById('registerForm').classList.remove('form-hidden');
    this.clearErrors();
    this.resetPasswordToggles();
    this.modal.classList.add('modal-visible');
  }

  closeModal() {
    this.modal.classList.remove('modal-visible');
    this.clearForms();
    this.clearErrors();
    this.resetPasswordToggles();
  }

  clearForms() {
    document.getElementById('loginFormElement')?.reset();
    document.getElementById('registerFormElement')?.reset();
  }

  clearErrors() {
    document.querySelectorAll('.auth-error, .auth-success').forEach(el => {
      el.classList.add('form-hidden');
      el.textContent = '';
    });
  }

  resetPasswordToggles() {
    document.querySelectorAll('#loginPassword, #registerPassword').forEach(input => { input.type = 'password'; });
    document.querySelectorAll('.password-toggle-icon').forEach(icon => {
      icon.classList.remove('password-visible');
      icon.title = 'Show password';
    });
  }

  showError(formType, message) {
    const el = document.getElementById(`${formType}Error`);
    if (el) { el.textContent = message; el.classList.remove('form-hidden'); }
  }

  showSuccess(formType, message) {
    const el = document.getElementById(`${formType}Success`);
    if (el) { el.textContent = message; el.classList.remove('form-hidden'); }
  }

  // ── Login ───────────────────────────────────────────────────

  async handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.getElementById('loginSubmit');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
      const sessionId = window.cartManager?.sessionId ||
        localStorage.getItem('interstellar.sessionId');

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        this.currentUser = data.user;
        this.updateUIForLoggedInUser();
        this.closeModal();

        if (window.cartManager) {
          await window.cartManager.refreshCartAfterLogin();
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

  // ── Register ────────────────────────────────────────────────

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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (data.success) {
        this.currentUser = data.user;
        this.updateUIForLoggedInUser();
        this.closeModal();

        if (window.cartManager) {
          await window.cartManager.refreshCartAfterLogin();
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

  // ── Logout ──────────────────────────────────────────────────

  async handleLogout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        this.currentUser = null;
        this.updateUIForLoggedOutUser();

        window.dispatchEvent(new CustomEvent('userLoggedOut'));
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  // ── UI State ────────────────────────────────────────────────

  updateUIForLoggedInUser() {
    const loginBtn = document.getElementById('loginBtn');
    const userCell = document.getElementById('userCell');
    const userName = document.getElementById('userName');

    if (loginBtn) loginBtn.classList.add('hidden');
    if (userCell) userCell.classList.add('active');
    if (userName && this.currentUser) {
      userName.textContent = this.currentUser.user_name;
    }

    window.dispatchEvent(new CustomEvent('userLoggedIn', {
      detail: { user: this.currentUser }
    }));
  }

  updateUIForLoggedOutUser() {
    const loginBtn = document.getElementById('loginBtn');
    const userCell = document.getElementById('userCell');
    const userName = document.getElementById('userName');

    if (loginBtn) loginBtn.classList.remove('hidden');
    if (userCell) userCell.classList.remove('active');
    if (userName) userName.textContent = '';
  }

  // ── Public API ──────────────────────────────────────────────

  getCurrentUser() { return this.currentUser; }
  isLoggedIn() { return !!this.currentUser; }
}

const authManager = new AuthManager();
window.authManager = authManager;