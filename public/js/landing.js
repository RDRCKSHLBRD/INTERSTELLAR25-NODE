/**
 * Landing Page - Minimal System Integration
 * All layout/styling handled by State.js, RatioLayoutEngine, and QuadTree
 * This file only: loads data, initializes systems
 */

import { InterstellarSystem } from '/system/SystemInit.js';

class LandingPage {
  constructor() {
    this.system = null;
    this.landingConfig = null;
    this.unobserveQuadTree = null;
  }

  async init() {
    try {
      console.log('🎬 Landing Page initializing...');

      // Load landing-specific config
      this.landingConfig = await this.loadLandingConfig();

      // Initialize Interstellar System (handles State, RatioEngine, QuadTree)
      this.system = new InterstellarSystem();
      await this.system.init({
        debug: window.location.search.includes('debug=true'),
        pageConfig: this.landingConfig // Pass landing config to system
      });

      // Load and render artists (data only)
      await this.loadArtists();

      // Setup QuadTree observation (system handles sizing)
      this.setupQuadTreeObservation();

      console.log('✅ Landing Page ready');

    } catch (error) {
      console.error('❌ Landing page initialization failed:', error);
    }
  }

  /**
   * Load landing-specific configuration
   */
  async loadLandingConfig() {
    try {
      const response = await fetch('/config/landing.json');
      if (!response.ok) {
        console.warn('⚠️ Landing config not found, using defaults');
        return null;
      }
      const config = await response.json();
      console.log('⚙️ Landing config loaded');
      return config;
    } catch (error) {
      console.warn('⚠️ Failed to load landing config:', error);
      return null;
    }
  }

  /**
   * Load and render artist links (data only, no styling logic)
   */
  async loadArtists() {
    try {
      const dataSource = this.landingConfig?.artistLinks?.dataSource || '/config/artists.json';
      const response = await fetch(dataSource);
      const data = await response.json();

      const navSelector = this.landingConfig?.artistLinks?.navigationSelector || '#artistNav';
      const artistNav = document.querySelector(navSelector);

      if (!artistNav) {
        console.warn('⚠️ Artist nav element not found');
        return;
      }

      // Clear and render
      artistNav.innerHTML = '';
      const linkClass = this.landingConfig?.artistLinks?.linkClass || 'artist-link';

      data.artists
        .sort((a, b) => a.order - b.order)
        .forEach(artist => {
          const link = document.createElement('a');
          link.href = `/${artist.page}`;
          link.className = linkClass;
          link.textContent = artist.name;
          link.dataset.artistId = artist.id;
          if (artist.genre) link.dataset.genre = artist.genre;
          
          artistNav.appendChild(link);
        });

      console.log(`✅ Loaded ${data.artists.length} artists`);

    } catch (error) {
      console.error('❌ Failed to load artists:', error);
    }
  }

  /**
   * Setup QuadTree observation - system handles all sizing
   */
  setupQuadTreeObservation() {
    if (!this.landingConfig?.artistLinks?.quadtreeObserve) {
      console.log('ℹ️ QuadTree observation disabled in config');
      return;
    }

    const containerSelector = this.landingConfig.artistLinks.containerSelector || '.landing-sidebar';
    const container = document.querySelector(containerSelector);

    if (!container) {
      console.warn('⚠️ Container not found for QuadTree observation');
      return;
    }

    // Let QuadTree system handle all sizing/scaling
    this.unobserveQuadTree = this.system.quadtree.observe(container, {
      containerType: 'landing-sidebar'
    });

    console.log('👁️ QuadTree observation active');
  }

  /**
   * Get current state (debugging only)
   */
  getState() {
    return {
      config: this.landingConfig,
      system: this.system?.getStats(),
      viewport: this.system?.getViewport()
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.unobserveQuadTree) {
      this.unobserveQuadTree();
    }
  }
}

// Initialize
const landingPage = new LandingPage();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => landingPage.init());
} else {
  landingPage.init();
}

// Debug mode
if (window.location.search.includes('debug=true')) {
  window.landingPage = landingPage;
  console.log('🐛 Debug: window.landingPage.getState()');
}

window.addEventListener('beforeunload', () => landingPage.destroy());

export default landingPage;