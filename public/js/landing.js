/**
 * Landing Page - Refactored to use Interstellar System
 * Integrates with SystemInit, QuadTree, and State management
 */

import { InterstellarSystem } from '/system/SystemInit.js';

class LandingPage {
  constructor() {
    this.system = null;
    this.config = null;
    this.artistLinks = [];
    this.root = document.documentElement;
    this.unobserve = null; // QuadTree unobserve function
  }

  async init() {
    try {
      console.log('🎬 Landing Page initializing...');

      // Initialize the main system
      this.system = new InterstellarSystem();
      await this.system.init({
        debug: window.location.search.includes('debug=true'),
        autoApply: true
      });

      // Get config from system
      this.config = this.system.config;

      // Apply initial layout
      this.applyInitialLayout();

      // Load and setup artists
      await this.loadArtists();

      // Setup QuadTree observation for artist sidebar
      this.setupQuadTreeObservation();

      // Listen for system updates
      this.system.on('system:update', (detail) => {
        this.handleSystemUpdate(detail);
      });

      console.log('✅ Landing Page ready');
      console.log('📊 System stats:', this.system.getStats());

    } catch (error) {
      console.error('❌ Landing page initialization failed:', error);
    }
  }

  /**
   * Apply initial layout using system's viewport state
   */
  applyInitialLayout() {
    const viewport = this.system.getViewport();
    
    if (!viewport) {
      console.warn('⚠️ No viewport state available');
      return;
    }

    // Set data attributes for CSS
    this.root.dataset.breakpoint = viewport.bp;
    this.root.dataset.mode = viewport.mode;
    this.root.dataset.orientation = viewport.orientation;

    // Get landing-specific config
    const landingCfg = this.config.layout?.pages?.landing;
    if (landingCfg) {
      this.applyLandingLayout(landingCfg, viewport);
    }

    console.log('📐 Initial layout applied:', {
      breakpoint: viewport.bp,
      mode: viewport.mode,
      width: viewport.vw,
      height: viewport.vh
    });
  }

  /**
   * Apply landing-specific layout ratios
   */
  applyLandingLayout(landingCfg, viewport) {
    // Video/Sidebar split ratio
    const videoRatio = landingCfg.video?.flexRatio || landingCfg.splitRatio || 0.8;
    const sidebarRatio = landingCfg.sidebar?.flexRatio || (1 - videoRatio);

    this.root.style.setProperty('--video-flex', videoRatio);
    this.root.style.setProperty('--sidebar-flex', sidebarRatio);

    // Sidebar regions
    const regions = landingCfg.sidebar?.regions || {};
    this.root.style.setProperty('--sidebar-spacer-flex', regions.spacerTop || 0.3);
    this.root.style.setProperty('--sidebar-nav-flex', regions.navigation || 0.65);

    // Min/max constraints
    this.root.style.setProperty('--video-min-width', landingCfg.video?.minWidth || '60vw');
    this.root.style.setProperty('--sidebar-min-width', landingCfg.sidebar?.minWidth || '20vw');
    this.root.style.setProperty('--sidebar-max-width', landingCfg.sidebar?.maxWidth || '400px');

    // Mobile-specific overrides
    if (viewport.mode === 'stack') {
      const bpConfig = landingCfg.breakpoints?.[viewport.bp];
      if (bpConfig) {
        this.root.style.setProperty('--video-height-mobile', bpConfig.video?.height || '60vh');
        this.root.style.setProperty('--sidebar-height-mobile', bpConfig.sidebar?.height || '40vh');
      }
    }
  }

  /**
   * Load artists from config and render
   */
  async loadArtists() {
    try {
      const response = await fetch('/config/artists.json');
      const data = await response.json();

      const artistNav = document.getElementById('artistNav');
      if (!artistNav) {
        console.warn('⚠️ Artist nav element not found');
        return;
      }

      // Clear existing content
      artistNav.innerHTML = '';
      this.artistLinks = [];

      // Render artists sorted by order
      data.artists
        .sort((a, b) => a.order - b.order)
        .forEach(artist => {
          const link = this.createArtistLink(artist);
          artistNav.appendChild(link);
          this.artistLinks.push(link);
        });

      console.log(`✅ Loaded ${data.artists.length} artists`);

    } catch (error) {
      console.error('❌ Failed to load artists:', error);
    }
  }

  /**
   * Create artist link element
   */
  createArtistLink(artist) {
    const link = document.createElement('a');
    link.href = `/${artist.page}`;
    link.className = 'artist-link';
    link.textContent = artist.name;

    // Data attributes for styling/filtering
    link.dataset.artistId = artist.id;
    if (artist.genre) {
      link.dataset.genre = artist.genre;
    }

    return link;
  }

  /**
   * Setup QuadTree observation for dynamic sizing
   */
  setupQuadTreeObservation() {
    const sidebar = document.querySelector('.landing-sidebar');
    
    if (!sidebar) {
      console.warn('⚠️ Sidebar not found for QuadTree observation');
      return;
    }

    // Observe sidebar with QuadTree system
    this.unobserve = this.system.quadtree.observe(sidebar, {
      containerType: 'artistNav',
      onUpdate: (result) => {
        this.handleQuadTreeUpdate(result);
      }
    });

    // Initial calculation
    const initialResult = this.system.quadtree.calculate(sidebar);
    this.handleQuadTreeUpdate(initialResult);

    console.log('👁️ QuadTree observation active on sidebar');
  }

  /**
   * Handle QuadTree updates
   */
  handleQuadTreeUpdate(result) {
    if (!result || !result.cssVariables) return;

    // QuadTree automatically applies CSS variables
    // We can log or do additional work here
    if (this.config.debug?.enableLogging) {
      console.log('🎯 QuadTree update:', {
        scale: result.scale,
        breakpoint: result.breakpoint,
        type: result.containerType
      });
    }
  }

  /**
   * Handle system-wide updates
   */
  handleSystemUpdate(detail) {
    const { viewport, duration } = detail;

    // Update data attributes
    this.root.dataset.breakpoint = viewport.bp;
    this.root.dataset.mode = viewport.mode;
    this.root.dataset.orientation = viewport.orientation;

    // Reapply landing layout if mode changed
    const landingCfg = this.config.layout?.pages?.landing;
    if (landingCfg) {
      this.applyLandingLayout(landingCfg, viewport);
    }

    if (this.config.debug?.enableLogging) {
      console.log('🔄 System update:', {
        breakpoint: viewport.bp,
        mode: viewport.mode,
        updateTime: duration.toFixed(2) + 'ms'
      });
    }
  }

  /**
   * Get current landing state (for debugging)
   */
  getState() {
    const viewport = this.system.getViewport();
    
    return {
      breakpoint: viewport?.bp,
      mode: viewport?.mode,
      orientation: viewport?.orientation,
      viewport: {
        width: viewport?.vw,
        height: viewport?.vh,
        aspectRatio: viewport?.ar
      },
      artists: {
        count: this.artistLinks.length,
        links: this.artistLinks
      },
      system: this.system.getStats(),
      cssVariables: {
        videoFlex: getComputedStyle(this.root).getPropertyValue('--video-flex'),
        sidebarFlex: getComputedStyle(this.root).getPropertyValue('--sidebar-flex'),
        qtScale: getComputedStyle(this.root).getPropertyValue('--qt-scale')
      }
    };
  }

  /**
   * Cleanup when leaving page
   */
  destroy() {
    console.log('🧹 Cleaning up landing page...');

    // Stop QuadTree observation
    if (this.unobserve) {
      this.unobserve();
    }

    // Note: Don't destroy the system here if it's shared across pages
    // If this is a single-page app, you might keep the system alive
  }
}

// Initialize landing page
const landingPage = new LandingPage();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => landingPage.init());
} else {
  landingPage.init();
}

// Expose for debugging
if (window.location.search.includes('debug=true')) {
  window.landingPage = landingPage;
  console.log('🐛 Debug mode: window.landingPage available');
  console.log('💡 Try: landingPage.getState()');
}

// Handle page unload
window.addEventListener('beforeunload', () => {
  landingPage.destroy();
});

export default landingPage;