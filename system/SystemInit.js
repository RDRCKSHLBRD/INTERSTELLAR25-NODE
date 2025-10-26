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

      // Initialize SystemTimer first (for performance tracking)
      this.timer = new SystemTimer();
      this.timer.startPeriodicCleanup(this.config.performance?.cleanupInterval || 300000);

      // Initialize ViewportState (pure calculator, no DOM)
      this.state = new ViewportState(this.config.state);
      console.log('✅ ViewportState ready');

      // Initialize RatioLayoutEngine
      this.layout = new RatioLayoutEngine(this.config, {
        debug: options.debug || false,
        autoApply: options.autoApply !== false
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
    const viewport = this.state.calculate();
    
    // Apply layout changes
    this.layout.apply();
    
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
   * Get current viewport state
   */
  getViewport() {
    return this.state ? this.state.calculate() : null;
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