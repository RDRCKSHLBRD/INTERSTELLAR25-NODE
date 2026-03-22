// ============================================================================
// public/js/playerIO.js — V8.0.0 (RODUX Stack)
//
// PLAYER I/O — Left-side panel. Replaces the horizontal footer.
//
// Architecture:
//   - Panel slides in from the left edge
//   - Minibar pinned bottom-left when panel is closed (play/pause + title)
//   - Panel contains: title, transport 3×3, seek+time, volume, nav, actions
//   - Config from /config/data/playerio.json
//   - CSS in playerio.css — panel is a fixed-width column, no viewport math
//
// The QuadTree/Ratio system is NOT used here. The panel is a known-width
// column — no packing problem to solve. CSS grid handles internal layout.
// The QuadTree still runs the album grid in roderick.js.
//
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
      if (window.audioPlayer) {
        window.audioPlayer.built = false;
        window.audioPlayer.build();
      }

      // Rebind cart button (cart.js bound before panel existed)
      this._rebindCart();

      // Volume visibility: show on pointer devices
      this._setVolumeVisibility();

      // Open by default?
      if (this.config.panel?.openByDefault) {
        this.open();
      }

      console.log('✅ PlayerIO V8.0.0 initialized');
    } catch (err) {
      console.error('❌ PlayerIO init failed:', err);
    }
  }


  // ══════════════════════════════════════════════════════════════
  // BUILD — Panel DOM
  // ══════════════════════════════════════════════════════════════

  _buildPanel() {
    this.panelEl = document.createElement('aside');
    this.panelEl.id = 'playerIOPanel';
    this.panelEl.className = 'pio-panel';
    this.panelEl.setAttribute('aria-label', 'Player I/O');

    this.panelEl.innerHTML = `
      <div class="pio-panel-inner">

        <!-- Close button -->
        <button class="pio-close" aria-label="Close Player I/O">✕</button>

        <!-- Title (above transport) -->
        <div class="pio-title-row">
          <span class="pio-title player-title">—</span>
        </div>

        <!-- Main content: transport + nav side by side -->
        <div class="pio-body">

          <!-- Left: Transport 3×3 -->
          <div class="pio-transport">
            <div class="group-transport">
              <!-- player.js V8 builds transport-grid here -->
            </div>
          </div>

          <!-- Right: Nav + Actions stacked -->
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

        <!-- Seek + Time (below transport) -->
        <div class="pio-seek-row">
          <div class="group-information">
            <!-- player.js V8 builds seek, time, volume here -->
          </div>
        </div>

        <!-- Logo (bottom of panel) -->
        <div class="pio-logo">
          <img src="/images/IP_TAG24.svg" alt="Interstellar Packages" class="pio-logo-img">
          <span class="pio-logo-tag">${this.config.logo?.tagText || 'rdxenv 24/25/26'}</span>
        </div>

      </div>
    `;

    document.body.appendChild(this.panelEl);
  }


  // ══════════════════════════════════════════════════════════════
  // BUILD — Minibar (persistent when panel is closed)
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

    // Minibar play/pause
    this.minibarEl.querySelector('.pio-minibar-play').addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.audioPlayer) {
        if (window.audioPlayer.audio?.paused) {
          window.audioPlayer.play();
        } else {
          window.audioPlayer.pause();
        }
      }
    });

    // Minibar open
    this.minibarEl.querySelector('.pio-minibar-open').addEventListener('click', () => {
      this.toggle();
    });

    // Click anywhere on minibar to open
    this.minibarEl.addEventListener('click', () => {
      if (!this.isOpen) this.open();
    });
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

    // Dispatch event so roderick.js can recalc grid
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

  toggle() {
    this.isOpen ? this.close() : this.open();
  }


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

    // Update panel title + minibar title when player.js changes the song
    // player.js writes to .player-title inside .group-information
    // We mirror it to .pio-title (above transport) and .player-title-mini (minibar)
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

    // Update minibar play icon when state changes
    if (window.audioPlayer?.audio) {
      this._watchPlayState();
    } else {
      // Wait for audio element to exist
      const check = setInterval(() => {
        if (window.audioPlayer?.audio) {
          clearInterval(check);
          this._watchPlayState();
        }
      }, 200);
    }

    // Playlists wiring
    const playlistsBtn = this.panelEl.querySelector('#playlistsBtn');
    if (playlistsBtn) {
      playlistsBtn.addEventListener('click', () => {
        if (window.playlistManager) window.playlistManager.toggle();
      });
    }

    // Login wiring
    const loginBtn = this.panelEl.querySelector('#loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        const authModal = document.getElementById('authModal');
        if (authModal) authModal.classList.add('active');
      });
    }

    // Subscribe wiring
    const subscribeBtn = this.panelEl.querySelector('#subscribeBtn');
    if (subscribeBtn) {
      subscribeBtn.addEventListener('click', () => {
        // TODO: subscribe modal
        console.log('💳 Subscribe clicked — modal TBD');
      });
    }
  }

  _rebindCart() {
    const cartBtn = this.panelEl?.querySelector('#cartBtn');
    if (cartBtn && window.cartManager) {
      cartBtn.addEventListener('click', () => window.cartManager.toggleCartSidebar());
    }
  }

  _setVolumeVisibility() {
    const hasTouch = navigator.maxTouchPoints > 0;
    const hasCoarse = window.matchMedia('(pointer: coarse)').matches;
    const isTouch = hasTouch && hasCoarse;

    const volRow = this.panelEl?.querySelector('.info-volume-row');
    if (volRow) {
      volRow.style.display = isTouch ? 'none' : 'flex';
    }
  }

  _watchPlayState() {
    const audio = window.audioPlayer.audio;
    const icon = this.minibarEl?.querySelector('.pio-minibar-play-icon');
    if (!audio || !icon) return;

    const update = () => { icon.textContent = audio.paused ? '▶' : '❚❚'; };
    audio.addEventListener('play', update);
    audio.addEventListener('pause', update);
    audio.addEventListener('ended', update);
  }


  // ══════════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════════

  getPanelWidth() {
    return 0; // V8: overlay mode, content doesn't shift
  }
}


// ── Init ────────────────────────────────────────────────────
const playerIO = new PlayerIO();
window.playerIO = playerIO;

// Init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => playerIO.init());
} else {
  playerIO.init();
}