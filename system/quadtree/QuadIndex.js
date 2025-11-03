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


        this.microFunctions = this.initializeMicroFunctions();

    
    if (this.options.autoInit) {
      this.init();
    }
  }
  


initializeMicroFunctions() {
    return {
      /**
       * Column Layout - Calculate positions for N columns
       */
      columnLayout: (count, containerWidth, gap = 16) => {
        if (count < 1) return [];
        
        const totalGap = gap * (count - 1);
        const colWidth = (containerWidth - totalGap) / count;
        
        return Array.from({ length: count }, (_, i) => ({
          index: i,
          x: i * (colWidth + gap),
          width: colWidth,
          center: i * (colWidth + gap) + (colWidth / 2)
        }));
      },
      
      /**
       * Golden Ratio Split - Divide space using golden ratio
       */
      goldenSplit: (totalSpace, largeFirst = true) => {
        const phi = QUAD_CONSTANTS.PHI;
        const large = totalSpace / (1 + (1 / phi));
        const small = totalSpace - large;
        
        return largeFirst ? {
          first: large,
          second: small,
          ratio: phi,
          positions: [0, large]
        } : {
          first: small,
          second: large,
          ratio: phi,
          positions: [0, small]
        };
      },
      
      /**
       * Fibonacci Spacing - Generate spacing based on Fibonacci
       */
      fibonacciSpacing: (baseUnit, count) => {
        const fib = [1, 1];
        for (let i = 2; i < count; i++) {
          fib[i] = fib[i - 1] + fib[i - 2];
        }
        return fib.map(n => n * baseUnit);
      },
      
      /**
       * Vertical Rhythm - Calculate vertical spacing scale
       */
      verticalRhythm: (baseUnit, ratio = 1.5, steps = 8) => {
        return Array.from({ length: steps }, (_, i) => 
          QuadMath.round(baseUnit * Math.pow(ratio, i))
        );
      },
      
      /**
       * Hero with Thumbnails - Calculate hero + thumbnail grid
       */
      heroWithThumbnails: (containerWidth, heroRatio = 0.6, thumbCount = 4, gap = 16) => {
        const heroWidth = containerWidth * heroRatio;
        const thumbAreaWidth = containerWidth - heroWidth - gap;
        const thumbWidth = thumbCount > 1 
          ? (thumbAreaWidth - (gap * (thumbCount - 1))) / thumbCount 
          : thumbAreaWidth;
        
        return {
          hero: { x: 0, width: heroWidth },
          thumbnails: Array.from({ length: thumbCount }, (_, i) => ({
            index: i,
            x: heroWidth + gap + (i * (thumbWidth + gap)),
            width: thumbWidth
          }))
        };
      },
      
      /**
       * Centered Distribution - Distribute items centered
       */
      centeredDistribution: (itemCount, itemSize, containerSize) => {
        const totalItemsWidth = itemCount * itemSize;
        const totalGapWidth = containerSize - totalItemsWidth;
        const gap = itemCount > 1 ? totalGapWidth / (itemCount + 1) : (containerSize - itemSize) / 2;
        
        return Array.from({ length: itemCount }, (_, i) => ({
          index: i,
          x: gap + (i * (itemSize + gap)),
          size: itemSize
        }));
      },
      
      /**
       * Header Layout - Specific pattern for header positioning
       */
      headerLayout: (containerWidth, config = {}) => {
        const {
          logoWidth = 200,
          artistNameWidth = 300,
          navWidth = 400,
          leftMargin = 0.02,
          rightMargin = 0.08
        } = config;
        
        const leftOffset = containerWidth * leftMargin;
        const rightOffset = containerWidth * (1 - rightMargin);
        
        return {
          logo: {
            x: leftOffset,
            width: logoWidth,
            align: 'left'
          },
          artistName: {
            x: leftOffset + logoWidth + 40,
            width: artistNameWidth,
            align: 'left'
          },
          nav: {
            x: rightOffset - navWidth,
            width: navWidth,
            align: 'right'
          }
        };
      },
      
      /**
       * Proportional Scaling - Scale items proportionally
       */
      proportionalScaling: (items, containerSize, gap = 0) => {
        const totalRatio = items.reduce((sum, item) => sum + (item.ratio || 1), 0);
        const totalGap = gap * (items.length - 1);
        const availableSpace = containerSize - totalGap;
        
        let currentX = 0;
        
        return items.map((item, i) => {
          const ratio = item.ratio || 1;
          const size = (availableSpace * ratio) / totalRatio;
          
          const result = {
            index: i,
            x: currentX,
            size: size,
            ratio: ratio
          };
          
          currentX += size + gap;
          return result;
        });
      },
      
      /**
       * Responsive Breakpoint Calculator
       */
      calculateBreakpoint: (viewportWidth, breakpointConfig = null) => {
        const config = breakpointConfig || {
          mobile: { max: 767, columns: 2 },
          tablet: { min: 768, max: 1023, columns: 3 },
          desktop: { min: 1024, max: 1399, columns: 6 },
          ultra: { min: 1400, columns: 8 }
        };
        
        for (const [name, range] of Object.entries(config)) {
          const minMatch = !range.min || viewportWidth >= range.min;
          const maxMatch = !range.max || viewportWidth <= range.max;
          
          if (minMatch && maxMatch) {
            return { name, ...range };
          }
        }
        
        return { name: 'desktop', columns: 6 };
      }
    };
  }
  
  /**
   * Call a microFunction by name
   * ADD THIS METHOD after initializeMicroFunctions
   */
  callMicro(functionName, ...args) {
    const fn = this.microFunctions[functionName];
    
    if (!fn) {
      console.error(`❌ MicroFunction '${functionName}' not found`);
      console.log('Available:', Object.keys(this.microFunctions));
      return null;
    }
    
    const startTime = performance.now();
    const result = fn(...args);
    const duration = performance.now() - startTime;
    
    if (this.options.debug) {
      console.log(`🔧 MicroFunction: ${functionName}`, {
        args,
        result,
        duration: `${duration.toFixed(2)}ms`
      });
    }
    
    return result;
  }
  
  /**
   * Register custom microFunction
   * ADD THIS METHOD after callMicro
   */
  registerMicro(name, fn) {
    if (this.microFunctions[name]) {
      console.warn(`⚠️ Overwriting microFunction: ${name}`);
    }
    
    this.microFunctions[name] = fn;
    console.log(`✅ MicroFunction registered: ${name}`);
  }
  
  /**
   * Get all available microFunctions
   * ADD THIS METHOD after registerMicro
   */
  listMicroFunctions() {
    return Object.keys(this.microFunctions);
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