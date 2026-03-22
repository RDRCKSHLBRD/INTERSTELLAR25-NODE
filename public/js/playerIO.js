// ============================================================================
// public/js/playerIO.js — V8.0.0 (RODUX Stack)
//
// PLAYER I/O — Left-side panel. Replaces the horizontal footer.
// Exposes window.playerIO for global access.
// ============================================================================

class PlayerIO {
  constructor() {
    this.config = null;
    this.panelEl = null;
    this.minibarEl = null;
    this.isOpen = false;
    this._ready = false;
  }

  async init() {
    try {
      const res = await fetch('/config/data/playerio.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('playerio.json: ' + res.status);
      this.config = await res.json();
      this._buildPanel();
      this._buildMinibar();
      this._bindEvents();
      this._ready = true;

      // Rebuild player.js into the new panel containers
      this._initPlayer();

      // Rebind cart button (cart.js bound before panel existed)
      this._rebindCart();

      // Volume visibility on desktop (after player build confirms)
      this._setVolumeVisibility();

      if (this.config.panel?.openByDefault) {
        this.open();
      }

      console.log('✅ PlayerIO V8.0.0 initialized');
    } catch (err) {
      console.error('❌ PlayerIO init failed:', err);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // BUILD — Panel
  // ══════════════════════════════════════════════════════════════

  _buildPanel() {
    this.panelEl = document.createElement('aside');
    this.panelEl.id = 'playerIOPanel';
    this.panelEl.className = 'pio-panel';
    this.panelEl.setAttribute('aria-label', 'Player I/O');

    this.panelEl.innerHTML = `
      <div class="pio-panel-inner">
        <button class="pio-close" aria-label="Close Player I/O">✕</button>

        <div class="pio-title-row">
          <span class="pio-title player-title">—</span>
        </div>

        <div class="pio-body">
          <div class="pio-transport">
            <div class="group-transport"></div>
          </div>
          <div class="pio-nav-actions">
            <a href="/downloads" class="pio-nav-link">downloads</a>
            <a href="/filmography" class="pio-nav-link">film</a>
            <a href="/contact" class="pio-nav-link">contact</a>
            <div class="pio-nav-separator"></div>
            <button id="playlistsBtn" class="pio-action-btn" data-action="playlists">playlists</button>
            <button id="subscribeBtn" class="pio-action-btn" data-action="subscribe">subscribe</button>
            <button id="loginBtn" class="pio-action-btn pio-login-btn">log in</button>
            <div id="userCell" class="pio-user-cell" style="display:none;">
              <span id="userName" class="pio-user-name"></span>
              <button id="logoutBtn" class="pio-action-btn">logout</button>
            </div>
            <button id="cartBtn" class="pio-action-btn pio-cart-btn">
              <img src="/images/IP-CART25-m1.svg" alt="Cart" class="pio-cart-icon">
              <span id="cartCount" class="cart-count hidden">0</span>
            </button>
          </div>
        </div>

        <div class="pio-seek-row">
          <div class="group-information"></div>
        </div>

        <div class="pio-logo">
          <img src="/images/IP_TAG24.svg" alt="Interstellar Packages" class="pio-logo-img">
          <span class="pio-logo-tag">${this.config.logo?.tagText || 'rdxenv 24/25/26'}</span>
        </div>
      </div>
    `;

    document.body.appendChild(this.panelEl);
  }

  // ══════════════════════════════════════════════════════════════
  // BUILD — Minibar
  // ══════════════════════════════════════════════════════════════

  _buildMinibar() {
    this.minibarEl = document.createElement('div');
    this.minibarEl.id = 'playerIOMinibar';
    this.minibarEl.className = 'pio-minibar';

    this.minibarEl.innerHTML = `
      <button class="pio-minibar-play" aria-label="Play/Pause">
        <span class="pio-minibar-play-icon">▶</span>
      </button>
      <span class="pio-minibar-title player-title-mini">PLAYER I/O</span>
      <button class="pio-minibar-open" aria-label="Open Player I/O">☰</button>
    `;

    document.body.appendChild(this.minibarEl);

    this.minibarEl.querySelector('.pio-minibar-play').addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.audioPlayer) {
        window.audioPlayer.audio?.paused ? window.audioPlayer.play() : window.audioPlayer.pause();
      }
    });

    this.minibarEl.querySelector('.pio-minibar-open').addEventListener('click', () => this.toggle());
    this.minibarEl.addEventListener('click', () => { if (!this.isOpen) this.open(); });
  }

  // ══════════════════════════════════════════════════════════════
  // OPEN / CLOSE / TOGGLE
  // ══════════════════════════════════════════════════════════════

  open() {
    if (!this.panelEl) return;
    this.isOpen = true;
    this.panelEl.classList.add('open');
    this.minibarEl?.classList.add('panel-open');
    document.body.classList.add('pio-open');
    window.dispatchEvent(new CustomEvent('playerIOToggle', { detail: { open: true } }));
  }

  close() {
    if (!this.panelEl) return;
    this.isOpen = false;
    this.panelEl.classList.remove('open');
    this.minibarEl?.classList.remove('panel-open');
    document.body.classList.remove('pio-open');
    window.dispatchEvent(new CustomEvent('playerIOToggle', { detail: { open: false } }));
  }

  toggle() { this.isOpen ? this.close() : this.open(); }

  // ══════════════════════════════════════════════════════════════
  // EVENTS
  // ══════════════════════════════════════════════════════════════

  _bindEvents() {
    // Close button
    this.panelEl.querySelector('.pio-close')?.addEventListener('click', () => this.close());

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    // Title sync: player.js writes to .player-title inside .group-information
    // Mirror to .pio-title (panel) and .player-title-mini (minibar)
    const checkTitle = setInterval(() => {
      const playerTitle = this.panelEl?.querySelector('.group-information .player-title');
      const pioTitle = this.panelEl?.querySelector('.pio-title');
      const miniTitle = this.minibarEl?.querySelector('.player-title-mini');

      if (playerTitle) {
        clearInterval(checkTitle);
        const sync = () => {
          const text = playerTitle.textContent;
          if (text && text !== '—') {
            if (pioTitle) pioTitle.textContent = text;
            if (miniTitle) miniTitle.textContent = text;
          }
        };
        const observer = new MutationObserver(sync);
        observer.observe(playerTitle, { childList: true, characterData: true, subtree: true });
        sync();
      }
    }, 300);

    // Minibar play icon state
    if (window.audioPlayer?.audio) {
      this._watchPlayState();
    } else {
      const check = setInterval(() => {
        if (window.audioPlayer?.audio) { clearInterval(check); this._watchPlayState(); }
      }, 200);
    }

    // Playlists
    const playlistsBtn = this.panelEl.querySelector('#playlistsBtn');
    if (playlistsBtn) {
      playlistsBtn.addEventListener('click', () => {
        if (window.playlistManager) window.playlistManager.toggle();
      });
    }

    // Login
    const loginBtn = this.panelEl.querySelector('#loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        const authModal = document.getElementById('authModal');
        if (authModal) authModal.classList.add('active');
      });
    }

    // Subscribe
    const subscribeBtn = this.panelEl.querySelector('#subscribeBtn');
    if (subscribeBtn) {
      subscribeBtn.addEventListener('click', () => this._openSubscribeModal());
    }
  }

  _rebindCart() {
    const cartBtn = this.panelEl?.querySelector('#cartBtn');
    if (cartBtn && window.cartManager) {
      cartBtn.addEventListener('click', () => window.cartManager.toggleCartSidebar());
    }
  }

  // ══════════════════════════════════════════════════════════════
  // PLAYER BUILD — ensure player.js builds into panel containers
  // ══════════════════════════════════════════════════════════════

  _initPlayer() {
    const tryBuild = (attempt = 0) => {
      if (!window.audioPlayer) {
        if (attempt < 20) setTimeout(() => tryBuild(attempt + 1), 150);
        else console.error('❌ PlayerIO: audioPlayer never appeared');
        return;
      }

      // Force rebuild into panel containers
      window.audioPlayer.built = false;
      window.audioPlayer.build();

      // Verify it worked — check for the volume row
      const volRow = this.panelEl?.querySelector('.info-volume-row');
      if (volRow) {
        console.log('✅ PlayerIO: player.js build verified (volume row present)');
      } else if (attempt < 20) {
        // build() may have bailed — containers might not be in DOM yet
        console.log(`⏳ PlayerIO: volume row not found, retry ${attempt + 1}`);
        setTimeout(() => tryBuild(attempt + 1), 200);
      } else {
        console.error('❌ PlayerIO: player.js build failed after retries');
      }
    };

    tryBuild();
  }

  _setVolumeVisibility() {
    const hasTouch = navigator.maxTouchPoints > 0;
    const hasCoarse = window.matchMedia('(pointer: coarse)').matches;
    const isTouch = hasTouch && hasCoarse;

    // On touch devices, hide volume. On desktop, CSS default (flex) handles it.
    if (!isTouch) {
      console.log('🔊 Desktop pointer detected — volume row visible (CSS default)');
      return;
    }

    // Touch device: hide volume row once it exists
    const tryHide = (attempt = 0) => {
      const volRow = this.panelEl?.querySelector('.info-volume-row');
      if (volRow) {
        volRow.style.display = 'none';
        console.log('🔇 Touch device — volume row hidden');
      } else if (attempt < 30) {
        setTimeout(() => tryHide(attempt + 1), 300);
      }
    };
    tryHide();
  }

  _watchPlayState() {
    const audio = window.audioPlayer.audio;
    const icon = this.minibarEl?.querySelector('.pio-minibar-play-icon');
    if (!audio || !icon) return;
    const update = () => {
      icon.textContent = audio.paused ? '▶' : '❚❚';
      // Pulse ring on minibar when audio is playing
      if (this.minibarEl) {
        this.minibarEl.classList.toggle('has-audio', !audio.paused);
      }
    };
    audio.addEventListener('play', update);
    audio.addEventListener('pause', update);
    audio.addEventListener('ended', update);
  }

  // ══════════════════════════════════════════════════════════════
  // SUBSCRIBE MODAL
  // ══════════════════════════════════════════════════════════════

  _openSubscribeModal() {
    if (document.getElementById('subscribeModal')) return;

    const backdrop = document.createElement('div');
    backdrop.className = 'subscribe-backdrop';
    backdrop.addEventListener('click', () => closeModal());
    document.body.appendChild(backdrop);

    const modal = document.createElement('div');
    modal.id = 'subscribeModal';
    modal.className = 'subscribe-modal';
    modal.innerHTML = `
      <div class="subscribe-modal-inner">
        <button class="subscribe-close" aria-label="Close">✕</button>
        <h2>Subscribe</h2>
        <p class="subscribe-desc">Support the music. Choose your tier.</p>
        <div class="subscribe-tiers">
          <div class="subscribe-tier" data-tier="fixed">
            <h3>Monthly</h3>
            <div class="subscribe-price">$5 / month</div>
            <p>Access to all releases, playlists, and radio.</p>
            <button class="subscribe-cta" data-tier="fixed">Subscribe</button>
          </div>
          <div class="subscribe-tier" data-tier="pwyw">
            <h3>Pay What You Want</h3>
            <div class="subscribe-price-input">
              <span>$</span>
              <input type="number" min="1" value="10" id="pwywAmount" />
              <span>/ month</span>
            </div>
            <p>Same access. You decide what it's worth.</p>
            <button class="subscribe-cta" data-tier="pwyw">Subscribe</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeModal = () => {
      modal.classList.remove('open');
      backdrop.classList.remove('visible');
      setTimeout(() => { modal.remove(); backdrop.remove(); }, 300);
    };

    modal.querySelector('.subscribe-close').addEventListener('click', closeModal);
    modal.querySelectorAll('.subscribe-cta').forEach(btn => {
      btn.addEventListener('click', () => {
        const tier = btn.dataset.tier;
        const amount = tier === 'pwyw' ? document.getElementById('pwywAmount')?.value || 10 : 5;
        console.log(`💳 Subscribe: tier=${tier}, amount=$${amount}`);
        // TODO: window.location.href = `/api/subscribe/checkout?tier=${tier}&amount=${amount}`;
      });
    });

    const escHandler = (e) => {
      if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);

    requestAnimationFrame(() => { backdrop.classList.add('visible'); modal.classList.add('open'); });
  }

  getPanelWidth() { return 0; }
}

// ── Init ────────────────────────────────────────────────────
const playerIO = new PlayerIO();
window.playerIO = playerIO;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => playerIO.init());
} else {
  playerIO.init();
}