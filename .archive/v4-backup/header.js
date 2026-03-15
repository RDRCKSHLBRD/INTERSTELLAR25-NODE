/**
 * Header System - Config-Driven
 * Loads artist from database, applies layout from config
 */

class HeaderSystem {
  constructor() {
    this.config = null;
    this.artist = null;
    this.root = document.documentElement;
  }

  async init() {
    try {
      console.log('🎯 Initializing Header System...');
      
      // Load header config
      await this.loadConfig();
      
      // Detect breakpoint (reuse from landing system)
      this.detectBreakpoint();
      
      // Load artist from database
      await this.loadArtist();
      
      // Apply header layout
      this.applyHeaderLayout();
      
      // Inject artist name into DOM
      this.renderArtistName();
      
      // Set up responsive
      this.setupResponsive();
      
      console.log('✅ Header initialized');
      
    } catch (error) {
      console.error('❌ Header initialization failed:', error);
    }
  }

  async loadConfig() {
    const response = await fetch('/config/header.json');
    this.config = await response.json();
    console.log('⚙️ Header config loaded');
  }

  detectBreakpoint() {
    const vw = window.innerWidth;
    if (vw < 768) {
      this.currentBreakpoint = 'mobile';
    } else if (vw < 1024) {
      this.currentBreakpoint = 'tablet';
    } else {
      this.currentBreakpoint = 'desktop';
    }
    this.root.dataset.headerBreakpoint = this.currentBreakpoint;
  }

  async loadArtist() {
    // Get artist slug from URL path (e.g., /roderick.html or /roderick)
    const path = window.location.pathname;
    const artistSlug = path.includes('roderick') ? 'roderick' : 
                       path.includes('rodux') ? 'rodux' : null;
    
    if (!artistSlug) {
      console.warn('⚠️ No artist detected in URL');
      return;
    }

    try {
    // Fetch from database
    const response = await fetch(`/api/artists?name=Roderick%20Shoolbraid`);
    const result = await response.json();         // ← CHANGED
    this.artist = result.data[0];                 // ← CHANGED - access .data array
    
    console.log('✅ Artist loaded:', this.artist?.name);
      
    } catch (error) {
      console.warn('⚠️ Failed to load artist from DB, using fallback');
      // Fallback artist name
      this.artist = {
        name: artistSlug === 'roderick' ? 'Roderick Shoolbraid' : 'Rodux'
      };
    }
  }

  applyHeaderLayout() {
    const cfg = this.config.layout;
    const bp = this.currentBreakpoint;
    
    // Apply header height
    this.root.style.setProperty('--header-height', `${cfg.height[bp]}px`);
    this.root.style.setProperty('--header-padding', `${cfg.padding[bp]}px`);
    
    // Apply flex ratios for layout structure
    this.root.style.setProperty('--header-logo-flex', cfg.flexRatios.logo);
    this.root.style.setProperty('--header-artist-flex', cfg.flexRatios.artist);
    this.root.style.setProperty('--header-spacer-flex', cfg.flexRatios.spacer);
    this.root.style.setProperty('--header-nav-flex', cfg.flexRatios.nav);
    
    // Apply artist name styling
    const artistCfg = this.config.artistName;
    this.root.style.setProperty('--artist-name-font-size', `${artistCfg.fontSize[bp]}px`);
    this.root.style.setProperty('--artist-name-font-weight', artistCfg.fontWeight);
    this.root.style.setProperty('--artist-name-color', artistCfg.color);
    this.root.style.setProperty('--artist-name-letter-spacing', `${artistCfg.letterSpacing}px`);
    
    // Apply logo sizing
    this.root.style.setProperty('--header-logo-width', `${this.config.logo.width[bp]}px`);
    
    // Apply nav styling
    this.root.style.setProperty('--header-nav-gap', `${this.config.nav.gap[bp]}px`);
    this.root.style.setProperty('--header-nav-font-size', `${this.config.nav.fontSize[bp]}px`);
    
    console.log('📐 Header layout applied');
  }

  renderArtistName() {
    if (!this.artist || !this.config.artistName.display) return;
    
    const artistNameEl = document.getElementById('artist-name');
    if (artistNameEl) {
      artistNameEl.textContent = this.artist.name;
    }
  }

  setupResponsive() {
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const oldBp = this.currentBreakpoint;
        this.detectBreakpoint();
        if (oldBp !== this.currentBreakpoint) {
          console.log(`📱 Header breakpoint: ${oldBp} → ${this.currentBreakpoint}`);
          this.applyHeaderLayout();
        }
      }, 100);
    });
  }
}

// Initialize
const headerSystem = new HeaderSystem();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => headerSystem.init());
} else {
  headerSystem.init();
}

// Expose for debugging
window.headerSystem = headerSystem;