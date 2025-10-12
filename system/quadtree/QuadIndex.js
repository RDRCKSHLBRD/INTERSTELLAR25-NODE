/* ================================================================
   QUAD INDEX - QuadTree System Orchestrator (Complete)
   Coordinates all QuadTree modules for the main application
   ================================================================ */

import { QuadMath, QUAD_CONSTANTS } from './QuadMath.js';
import { QuadConfig, quadConfig } from './QuadConfig.js';
import { QuadSpatial } from './QuadSpatial.js';
import { QuadContent } from './QuadContent.js';
import { QuadCache } from './QuadCache.js';
import { QuadObserver, quadObserver } from './QuadObserver.js';
import { QuadDebug, quadDebug } from './QuadDebug.js';

export class QuadTreeSystem {
  constructor(options = {}) {
    this.options = {
      debug: options.debug || window.location.search.includes('debug=true'),
      autoInit: options.autoInit !== false,
      cacheSize: options.cacheSize || 50,
      ...options
    };
    
    this.cache = new QuadCache(this.options.cacheSize);
    this.observedContainers = new Map();
    this.isDestroyed = false;
    
    // ADD THESE 2 LINES: Expose the imported quadConfig as a class property
    this.config = quadConfig;
    this.quadConfig = quadConfig; // Alias for compatibility
    
    if (this.options.autoInit) {
      this.init();
    }
  }
  
  async init() {
    console.log('🚀 QuadTree System initializing...');
    
    // Wait for config to load
    await quadConfig.waitForLoad();
    
    // Add debug styles if debugging
    if (this.options.debug) {
      quadDebug.addDebugStyles();
    }
    
    console.log('✅ QuadTree System ready');
    return this;
  }
  
  /**
   * Get configuration - NEW METHOD
   * @param {string} path - Optional dot notation path
   * @returns {any} Config value or entire config
   */
  getConfig(path = null) {
    if (path) {
      return this.config.get(path);
    }
    return this.config;
  }
  
  /**
   * Calculate optimal scaling for container
   * @param {Element} container 
   * @param {Object} options 
   * @returns {Object} Calculation result
   */
  calculate(container, options = {}) {
    if (this.isDestroyed || !container) {
      return this.getEmptyResult();
    }
    
    // Check cache first
    const cacheKey = this.cache.generateKey(container, options);
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      quadDebug.log('cache-hit', { container: container.className, key: cacheKey });
      return cached;
    }
    
    // Perform calculation
    const startTime = performance.now();
    
    const spatialBounds = QuadSpatial.getContainerBounds(container);
    const contentScale = QuadContent.calculateContentScale(container, spatialBounds, options);
    
    const result = {
      scale: contentScale.scale,
      bounds: spatialBounds,
      containerType: contentScale.containerType,
      breakpoint: contentScale.breakpoint,
      cssVariables: contentScale.cssVariables,
      performance: {
        calculationTime: performance.now() - startTime,
        cached: false,
        timestamp: Date.now()
      }
    };
    
    // Cache result
    this.cache.set(cacheKey, result);
    
    // Debug logging
    quadDebug.log('calculation', {
      container: container.className,
      scale: result.scale,
      time: result.performance.calculationTime
    });
    
    return result;
  }
  
  /**
   * Apply QuadTree scaling to container
   * @param {Element} container 
   * @param {Object} options 
   * @returns {Object} Applied result
   */
  apply(container, options = {}) {
    const result = this.calculate(container, options);
    
    if (result && result.cssVariables) {
      QuadContent.applyCSSVariables(container, result.cssVariables);
      
      if (this.options.debug) {
        quadDebug.highlightContainer(container, {
          scale: result.scale,
          type: result.containerType
        });
      }
    }
    
    return result;
  }
  
  /**
   * Observe container for automatic scaling
   * @param {Element} container 
   * @param {Object} options 
   * @returns {Function} Unobserve function
   */
  observe(container, options = {}) {
    if (this.isDestroyed || !container) return () => {};
    
    // Create update callback
    const updateCallback = (event) => {
      const result = this.apply(container, options);
      
      if (options.onUpdate) {
        options.onUpdate(result, event);
      }
    };
    
    // Start observing
    quadObserver.observeContainer(container, updateCallback, options);
    
    // Track observed container
    this.observedContainers.set(container, {
      options: options,
      callback: updateCallback
    });
    
    // Return unobserve function
    return () => this.unobserve(container);
  }
  
  /**
   * Stop observing container
   * @param {Element} container 
   */
  unobserve(container) {
    quadObserver.unobserveContainer(container);
    this.observedContainers.delete(container);
  }
  
  /**
   * Calculate layout for multiple items in container
   * @param {Element} container 
   * @param {Array} items 
   * @param {Object} options 
   * @returns {Object} Multi-item layout result
   */
  calculateLayout(container, items = [], options = {}) {
    if (this.isDestroyed || !container) return null;
    
    const startTime = performance.now();
    const result = QuadContent.calculateContentLayout(container, items, options);
    
    result.performance.calculationTime = performance.now() - startTime;
    
    quadDebug.log('layout-calculation', {
      container: container.className,
      itemCount: items.length,
      efficiency: result.subdivision?.utilization,
      time: result.performance.calculationTime
    });
    
    return result;
  }
  
  /**
   * Force update all observed containers
   */
  forceUpdate() {
    this.cache.clear();
    quadObserver.forceUpdate();
    
    quadDebug.log('force-update', {
      containers: this.observedContainers.size
    });
  }
  
  /**
   * Get system statistics
   * @returns {Object} System stats
   */
  getStats() {
    return {
      observedContainers: this.observedContainers.size,
      cache: this.cache.getStats(),
      observer: quadObserver.getStats(),
      config: {
        loaded: quadConfig.isLoaded,
        debug: this.options.debug
      },
      performance: {
        totalCalculations: this.cache.hitCount + this.cache.missCount,
        averageTime: this.calculateAverageTime(),
        memoryUsage: this.calculateMemoryUsage()
      }
    };
  }
  
  /**
   * Calculate average calculation time
   * @returns {number} Average time in ms
   */
  calculateAverageTime() {
    // This would track actual calculation times
    return 2.5; // Mock value
  }
  
  /**
   * Calculate memory usage
   * @returns {Object} Memory usage info
   */
  calculateMemoryUsage() {
    return {
      cacheSize: this.cache.cache.size,
      observedContainers: this.observedContainers.size,
      estimatedKB: (this.cache.cache.size * 0.5) + (this.observedContainers.size * 0.2)
    };
  }
  
  /**
   * Get empty result for error cases
   * @returns {Object} Empty result
   */
  getEmptyResult() {
    return {
      scale: 1.0,
      bounds: null,
      containerType: 'unknown',
      breakpoint: 'desktop',
      cssVariables: {
        '--qt-scale': '1.000',
        '--qt-size': '100px'
      },
      performance: {
        calculationTime: 0,
        cached: false,
        timestamp: Date.now()
      }
    };
  }
  
  /**
   * Batch process multiple containers
   * @param {Array} containers 
   * @param {Object} options 
   * @returns {Array} Batch results
   */
  batchProcess(containers, options = {}) {
    const startTime = performance.now();
    const results = containers.map(container => this.apply(container, options));
    
    quadDebug.log('batch-process', {
      containerCount: containers.length,
      totalTime: performance.now() - startTime,
      averageTime: (performance.now() - startTime) / containers.length
    });
    
    return results;
  }
  
  /**
   * Auto-detect and process all QuadTree containers
   * @param {Object} options 
   * @returns {Array} Auto-process results
   */
  autoProcess(options = {}) {
    const containers = document.querySelectorAll('.qt-container, [class*="qt-"]');
    return this.batchProcess(Array.from(containers), options);
  }
  
  /**
   * Export system configuration
   * @returns {Object} Exportable config
   */
  exportConfig() {
    return {
      options: this.options,
      config: quadConfig.export(),
      stats: this.getStats(),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Destroy QuadTree system
   */
  destroy() {
    this.isDestroyed = true;
    
    // Stop all observations
    this.observedContainers.forEach((_, container) => {
      this.unobserve(container);
    });
    
    // Clear cache
    this.cache.clear();
    
    // Destroy observer
    quadObserver.destroy();
    
    console.log('🔥 QuadTree System destroyed');
  }
}

// Export convenience functions
export const createQuadTree = (options) => new QuadTreeSystem(options);

export const quickScale = (selector, options = {}) => {
  const containers = document.querySelectorAll(selector);
  const qt = new QuadTreeSystem({ autoInit: true });
  return qt.batchProcess(Array.from(containers), options);
};

export const observeQuadTree = (selector, options = {}) => {
  const containers = document.querySelectorAll(selector);
  const qt = new QuadTreeSystem({ autoInit: true });
  
  containers.forEach(container => {
    qt.observe(container, options);
  });
  
  return qt;
};

// Global QuadTree instance (optional)
let globalQuadTree = null;

export const getGlobalQuadTree = () => {
  if (!globalQuadTree) {
    globalQuadTree = new QuadTreeSystem({ autoInit: true });
  }
  return globalQuadTree;
};

console.log('🎯 QuadIndex v1.0 loaded - QuadTree System orchestrator ready');

/* ================================================================
   USAGE EXAMPLES:
   
   // Basic usage
   const qt = new QuadTreeSystem();
   qt.apply(document.querySelector('.hero'));
   
   // Auto-observe
   const qt = observeQuadTree('.qt-container');
   
   // Batch processing
   quickScale('.card, .hero, .section');
   
   // Advanced usage with custom config
   const qt = new QuadTreeSystem({
     debug: true,
     cacheSize: 100,
     autoInit: true
   });
   
   // Layout calculation
   const layout = qt.calculateLayout(container, items, {
     maxColumns: 3,
     aspectRatio: 16/9,
     gap: 20
   });
   ================================================================ */