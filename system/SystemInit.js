/**
 * SystemInit.js - Main System Orchestrator
 * Coordinates all Interstellar system modules
 */

import { ViewportState } from './State.js';
import RatioLayoutEngine from './RatioLayoutEngine.js';
import { QuadTreeSystem } from './quadtree/QuadIndex.js';
import SystemTimer from './SystemTimer.js';

export class InterstellarSystem {
  constructor(config = null) {
    this.config = config;
    this.pageConfig = null; // Page-specific config (e.g., landing.json)
    this.isInitialized = false;
    
    // Core systems
    this.state = null;
    this.layout = null;
    this.quadtree = null;
    this.timer = null;
    
    // Performance tracking
    this.metrics = {
      initTime: 0,
      lastUpdate: 0,
      updateCount: 0
    };
  }

  /**
   * Initialize all systems
   * @param {Object} options - Initialization options
   */
  async init(options = {}) {
    const startTime = performance.now();
    
    try {
      console.log('🚀 Interstellar System initializing...');

      // Load config if not provided
      if (!this.config) {
        this.config = await this.loadConfig();
      }

      // Store page-specific config if provided
      this.pageConfig = options.pageConfig || null;

      // Initialize SystemTimer first (for performance tracking)
      this.timer = new SystemTimer();
      this.timer.startPeriodicCleanup(this.config.performance?.cleanupInterval || 300000);

      // Initialize ViewportState (pure calculator, no DOM)
      this.state = new ViewportState(this.config.state);
      console.log('✅ ViewportState ready');

      // Initialize RatioLayoutEngine with page config
      this.layout = new RatioLayoutEngine(this.config, {
        debug: options.debug || false,
        autoApply: options.autoApply !== false,
        pageConfig: this.pageConfig
      });
      console.log('✅ RatioLayoutEngine ready');

      // Initialize QuadTree system
      this.quadtree = new QuadTreeSystem({
        debug: options.debug || this.config.quadtree?.debug?.enabled || false,
        autoInit: true,
        cacheSize: this.config.quadtree?.performance?.cacheSize || 50
      });
      
      await this.quadtree.init();
      console.log('✅ QuadTree System ready');

      // Apply initial layout based on current viewport
      this.applyPageLayout();

      // Setup coordinated resize handling
      this.setupGlobalListeners();

      // Mark as initialized
      this.isInitialized = true;
      this.metrics.initTime = performance.now() - startTime;

      console.log(`✅ Interstellar System initialized in ${this.metrics.initTime.toFixed(2)}ms`);
      
      // Emit ready event
      this.emit('system:ready', {
        initTime: this.metrics.initTime,
        systems: {
          state: !!this.state,
          layout: !!this.layout,
          quadtree: !!this.quadtree,
          timer: !!this.timer
        }
      });

      return this;

    } catch (error) {
      console.error('❌ System initialization failed:', error);
      throw error;
    }
  }

  /**
   * Apply page-specific layout based on viewport and config
   */
  applyPageLayout() {
    if (!this.pageConfig) return;

    const viewport = this.state.calculate(this.getMeasurements());
    const root = document.documentElement;

    // Set viewport data attributes
    root.dataset.breakpoint = viewport.bp;
    root.dataset.mode = viewport.mode;
    root.dataset.orientation = viewport.orientation;

    // Get breakpoint-specific config
    const bpConfig = this.pageConfig.breakpoints?.[viewport.bp] || {};
    const baseLayout = this.pageConfig.layout || {};

    // Apply layout ratios based on mode
    if (viewport.mode === 'stack') {
      // Stack mode: use height-based layout
      if (bpConfig.video?.height) {
        root.style.setProperty('--video-height-mobile', bpConfig.video.height);
      }
      if (bpConfig.sidebar?.height) {
        root.style.setProperty('--sidebar-height-mobile', bpConfig.sidebar.height);
      }
    } else {
      // Split mode: use flex ratios
      const videoRatio = bpConfig.video?.flexRatio || baseLayout.video?.flexRatio || 0.8;
      const sidebarRatio = bpConfig.sidebar?.flexRatio || baseLayout.sidebar?.flexRatio || 0.2;
      
      root.style.setProperty('--video-flex', videoRatio);
      root.style.setProperty('--sidebar-flex', sidebarRatio);
    }

    // Apply constraints
    if (baseLayout.video?.minWidth) {
      root.style.setProperty('--video-min-width', baseLayout.video.minWidth);
    }
    if (baseLayout.sidebar?.minWidth) {
      root.style.setProperty('--sidebar-min-width', baseLayout.sidebar.minWidth);
    }
    if (bpConfig.sidebar?.maxWidth || baseLayout.sidebar?.maxWidth) {
      root.style.setProperty('--sidebar-max-width', bpConfig.sidebar?.maxWidth || baseLayout.sidebar.maxWidth);
    }

    // Apply sidebar regions if present
    if (baseLayout.sidebar?.regions) {
      const regions = baseLayout.sidebar.regions;
      if (regions.spacerTop) root.style.setProperty('--sidebar-spacer-flex', regions.spacerTop);
      if (regions.navigation) root.style.setProperty('--sidebar-nav-flex', regions.navigation);
    }

    console.log('📐 Page layout applied:', {
      breakpoint: viewport.bp,
      mode: viewport.mode
    });
  }

  /**
   * Load configuration from JSON
   */
  async loadConfig() {
    try {
      const response = await fetch('/config.json');
      if (!response.ok) {
        throw new Error(`Config load failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to load config:', error);
      throw error;
    }
  }

  /**
   * Setup global resize and orientation listeners
   */
  setupGlobalListeners() {
    // Use SystemTimer for throttled resize handling
    const handleResize = () => {
      this.timer.throttle('global-resize', () => {
        this.handleViewportChange();
      }, this.config.performance?.throttleResize || 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      // Give device time to complete orientation change
      setTimeout(() => this.handleViewportChange(), 100);
    });

    console.log('👂 Global system listeners active');
  }

  /**
   * Handle viewport changes across all systems
   */
  handleViewportChange() {
    if (!this.isInitialized) return;

    const startTime = performance.now();
    
    // Calculate new viewport state
    const viewport = this.state.calculate(this.getMeasurements());
    
    // Apply layout changes (RatioLayoutEngine)
    this.layout.apply();
    
    // Reapply page-specific layout if config exists
    if (this.pageConfig) {
      this.applyPageLayout();
    }
    
    // Force update all observed QuadTree containers
    this.quadtree.forceUpdate();
    
    // Track metrics
    this.metrics.lastUpdate = Date.now();
    this.metrics.updateCount++;
    
    const duration = performance.now() - startTime;
    
    // Emit update event
    this.emit('system:update', {
      viewport,
      duration,
      updateCount: this.metrics.updateCount
    });

    if (duration > 16) { // Slower than 60fps
      console.warn(`⚠️ Slow viewport update: ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get current viewport measurements
   */
  getMeasurements() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio || 1
    };
  }

  /**
   * Get current viewport state
   */
  getViewport() {
    return this.state ? this.state.calculate(this.getMeasurements()) : null;
  }

  /**
   * Get system statistics
   */
  getStats() {
    return {
      initialized: this.isInitialized,
      metrics: this.metrics,
      viewport: this.getViewport(),
      layout: this.layout ? this.layout.getMetrics() : null,
      quadtree: this.quadtree ? this.quadtree.getStats() : null,
      timer: this.timer ? this.timer.getPerformanceReport() : null
    };
  }

  /**
   * Simple event emitter
   */
  emit(eventName, detail) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: false
    });
    window.dispatchEvent(event);
  }

  /**
   * Listen for system events
   */
  on(eventName, callback) {
    window.addEventListener(eventName, (e) => callback(e.detail));
  }

  /**
   * Cleanup and destroy all systems
   */
  destroy() {
    console.log('🧹 Destroying Interstellar System...');

    if (this.layout) {
      this.layout.destroy();
    }

    if (this.quadtree) {
      this.quadtree.destroy();
    }

    if (this.timer) {
      this.timer.destroy();
    }

    this.isInitialized = false;
    console.log('✅ System destroyed');
  }
}

// Singleton instance (optional - can be created manually)
let systemInstance = null;

export function getSystem() {
  if (!systemInstance) {
    systemInstance = new InterstellarSystem();
  }
  return systemInstance;
}

export function createSystem(config = null) {
  systemInstance = new InterstellarSystem(config);
  return systemInstance;
}

// Debug helper
if (typeof window !== 'undefined') {
  window.InterstellarSystem = InterstellarSystem;
  window.getSystem = getSystem;
}

export default InterstellarSystem;