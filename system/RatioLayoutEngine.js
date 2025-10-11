// Enhanced RatioLayoutEngine.js - Mathematical Layout System
// Implements RODUX/HARUKO principles with JSON-driven configuration

export class RatioLayoutEngine {
  constructor(cfg = {}) {
    this.cfg = cfg;
    this.rs = document.documentElement;
    this.state = {
      vw: 0,
      vh: 0,
      ar: 1,
      dpr: 1,
      orientation: 'landscape',
      isGolden: false,
      mode: 'split'
    };
    
    // Mathematical constants
    this.PHI = 1.618033988749895;
    this.SQRT2 = 1.414213562373095;
    
    // Performance monitoring
    this.metrics = {
      reflows: 0,
      lastUpdate: 0,
      fps: 60
    };
    
    // Throttle resize events
    this.resizeTimer = null;
    this.throttleDelay = cfg.performance?.throttleResize || 100;
    
    this.init();
  }

  init() {
    // Initial measurement and application
    this.measure();
    this.apply();
    
    // Set up resize observer for better performance
    if (window.ResizeObserver) {
      this.observer = new ResizeObserver(entries => {
        this.throttledApply();
      });
      this.observer.observe(document.body);
    } else {
      // Fallback to window resize
      window.addEventListener('resize', () => this.throttledApply());
      window.addEventListener('orientationchange', () => this.throttledApply());
    }
    
    // Start performance monitoring if enabled
    if (this.cfg.performance?.monitorFPS) {
      this.startFPSMonitor();
    }
  }

  measure() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const ar = vw / vh;
    const dpr = window.devicePixelRatio || 1;
    
    this.state = {
      vw,
      vh,
      ar,
      dpr,
      orientation: ar > 1 ? 'landscape' : 'portrait',
      isGolden: Math.abs(ar - this.PHI) < 0.1,
      isUltrawide: ar > 2.1,
      isMobile: vw < 768,
      isTablet: vw >= 768 && vw < 1024,
      isDesktop: vw >= 1024,
      mode: this.determineMode(vw, vh, ar)
    };
    
    // Publish state to data attributes for CSS
    Object.entries(this.state).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        this.rs.dataset[key] = value ? 'true' : 'false';
      } else if (typeof value === 'number') {
        this.rs.dataset[key] = value.toFixed(2);
      } else {
        this.rs.dataset[key] = value;
      }
    });
  }

  determineMode(vw, vh, ar) {
    // Content-aware mode selection
    if (vw < 568 || ar < 0.8) return 'stack';
    if (ar > 2.1) return 'ultrawide';
    if (Math.abs(ar - this.PHI) < 0.1) return 'golden';
    if (vw < 1024) return 'compact';
    return 'split';
  }

  apply() {
    const start = performance.now();
    this.measure();
    
    // Get current measurements
    const { vw, vh, ar, isGolden, mode } = this.state;
    
    // Calculate header and footer heights
    const headerH = this.calculateHeaderHeight(vh);
    const footerH = this.calculateFooterHeight(vh);
    
    // Available height for main content
    const availableH = Math.max(0, vh - headerH - footerH - this.getGap('md') * 2);
    
    // Calculate controls height using golden ratio or adaptive ratio
    const controlsRatio = this.getControlsRatio(vw, availableH, mode);
    const controlsH = this.roundToDevice(availableH * controlsRatio);
    
    // Remaining height for library
    const libraryH = Math.max(0, availableH - controlsH - this.getGap('md'));
    
    // Calculate responsive gaps and spacing
    const gutter = this.calculateGutter(vw);
    const measure = this.calculateMeasure(vw);
    const cols = this.calculateColumns(vw, measure);
    
    // Apply all CSS variables
    this.setCSSVariables({
      // Layout heights
      '--header-height': `${headerH}px`,
      '--footer-height': `${footerH}px`,
      '--controls-h': `${controlsH}px`,
      '--library-h': `${libraryH}px`,
      
      // Viewport metrics
      '--vw': `${vw}px`,
      '--vh': `${vh}px`,
      '--ar': ar.toFixed(4),
      '--dpr': this.state.dpr,
      
      // Spacing
      '--gap-xs': `${this.getGap('xs')}px`,
      '--gap-sm': `${this.getGap('sm')}px`,
      '--gap-md': `${this.getGap('md')}px`,
      '--gap-lg': `${this.getGap('lg')}px`,
      '--gap-xl': `${this.getGap('xl')}px`,
      '--gutter': `${gutter}px`,
      
      // Typography and grid
      '--measure': `${measure}px`,
      '--cols': cols,
      '--font-scale': this.calculateFontScale(vw),
      
      // Mathematical ratios
      '--golden': isGolden ? '1' : '0',
      '--phi': this.PHI,
      '--sqrt2': this.SQRT2,
      
      // Layout mode
      '--layout-mode': `"${mode}"`,
      
      // Performance hints
      '--use-gpu': this.cfg.animation?.useGPU ? '1' : '0'
    });
    
    // Update metrics
    this.metrics.reflows++;
    this.metrics.lastUpdate = performance.now() - start;
    
    // Emit layout change event
    this.emitLayoutChange();
  }

  getControlsRatio(vw, availableH, mode) {
    // Get base ratio from config or calculate
    const cfg = this.cfg.regions?.controls || {};
    const minRatio = cfg.ratioRange?.[0] || 0.25;
    const maxRatio = cfg.ratioRange?.[1] || 0.40;
    
    // Use golden ratio for golden aspect ratios
    if (this.state.isGolden) {
      return 1 / this.PHI; // ~0.382
    }
    
    // Adaptive ratio based on viewport and content
    const breakpoint = this.getActiveBreakpoint(vw);
    if (breakpoint?.['controls.ratio']) {
      return breakpoint['controls.ratio'];
    }
    
    // Calculate ratio based on available height
    // More height = smaller ratio (more space for library)
    const heightFactor = Math.min(1, availableH / 800);
    const ratio = maxRatio - (maxRatio - minRatio) * heightFactor;
    
    return Math.max(minRatio, Math.min(maxRatio, ratio));
  }

  getActiveBreakpoint(vw) {
    const breakpoints = this.cfg.breakpoints || {};
    let active = null;
    
    Object.keys(breakpoints)
      .map(k => parseInt(k))
      .sort((a, b) => a - b)
      .forEach(bp => {
        if (vw >= bp) {
          active = breakpoints[bp];
        }
      });
    
    return active;
  }

  calculateHeaderHeight(vh) {
    const cfg = this.cfg.regions?.header || {};
    const base = cfg.height || 64;
    const min = cfg.minHeight || 48;
    const max = cfg.maxHeight || 80;
    const ratio = cfg.ratio || 0.08;
    
    // Use ratio-based calculation with constraints
    const calculated = vh * ratio;
    return this.roundToDevice(Math.max(min, Math.min(max, calculated)));
  }

  calculateFooterHeight(vh) {
    const cfg = this.cfg.regions?.footer || {};
    const base = cfg.height || 44;
    const min = cfg.minHeight || 32;
    const max = cfg.maxHeight || 56;
    const ratio = cfg.ratio || 0.055;
    
    const calculated = vh * ratio;
    return this.roundToDevice(Math.max(min, Math.min(max, calculated)));
  }

  calculateGutter(vw) {
    // Responsive gutter based on viewport
    const base = this.cfg.theme?.spacing?.unit || 8;
    const factor = Math.max(1, Math.min(4, vw / 320));
    return this.roundToDevice(base * factor);
  }

  calculateMeasure(vw) {
    // Ideal text measure (line length) for readability
    const cfg = this.cfg.theme?.typography?.measure || {};
    const min = cfg.min || 45;
    const ideal = cfg.ideal || 66;
    const max = cfg.max || 75;
    
    // Characters to pixels (rough approximation)
    const charWidth = 8.5; // Average for most fonts at 16px
    const idealPx = ideal * charWidth;
    
    // Scale based on viewport
    const scaled = Math.min(vw * 0.9, idealPx);
    return this.roundToDevice(scaled);
  }

  calculateColumns(vw, measure) {
    // Dynamic column count based on viewport and measure
    const minCols = 1;
    const maxCols = 6;
    const colWidth = measure / 2; // Half measure for column width
    
    const cols = Math.floor(vw / colWidth);
    return Math.max(minCols, Math.min(maxCols, cols));
  }

  calculateFontScale(vw) {
    // Fluid typography scale
    const min = 0.875; // 14px at 16px base
    const max = 1.125; // 18px at 16px base
    const minVw = 320;
    const maxVw = 1920;
    
    const scale = min + (max - min) * ((vw - minVw) / (maxVw - minVw));
    return Math.max(min, Math.min(max, scale));
  }

  getGap(size) {
    const spacing = this.cfg.theme?.spacing || {};
    const base = spacing.unit || 8;
    
    const multipliers = {
      xs: 0.5,
      sm: 1,
      md: 2,
      lg: 3,
      xl: 4,
      xxl: 6
    };
    
    return this.roundToDevice(base * (multipliers[size] || 1));
  }

  roundToDevice(value) {
    // Round to device pixel for sharp rendering
    if (!this.cfg.performance?.roundToDevice) return value;
    
    const dpr = this.state.dpr || 1;
    return Math.round(value * dpr) / dpr;
  }

  setCSSVariables(vars) {
    // Batch CSS variable updates for performance
    const style = this.rs.style;
    
    requestAnimationFrame(() => {
      Object.entries(vars).forEach(([key, value]) => {
        style.setProperty(key, value);
      });
    });
  }

  throttledApply() {
    // Throttle layout recalculation
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
    
    this.resizeTimer = setTimeout(() => {
      this.apply();
      this.resizeTimer = null;
    }, this.throttleDelay);
  }

  startFPSMonitor() {
    let lastTime = performance.now();
    let frames = 0;
    
    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        this.metrics.fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
        
        // Adapt complexity if FPS is low
        if (this.cfg.performance?.adaptiveComplexity) {
          this.adaptToPerformance();
        }
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  adaptToPerformance() {
    const lowFPS = this.cfg.performance?.thresholds?.lowFPS || 30;
    
    if (this.metrics.fps < lowFPS) {
      // Reduce complexity when performance is poor
      this.rs.dataset.reducedMotion = 'true';
      console.warn(`Low FPS detected: ${this.metrics.fps}. Enabling reduced motion.`);
    } else if (this.metrics.fps > lowFPS + 10) {
      // Re-enable animations when performance improves
      this.rs.dataset.reducedMotion = 'false';
    }
  }

  emitLayoutChange() {
    // Emit custom event with layout details
    const event = new CustomEvent('rdxexp:layoutchange', {
      detail: {
        state: this.state,
        metrics: this.metrics,
        mode: this.state.mode
      }
    });
    
    window.dispatchEvent(event);
  }

  getState() {
    return { ...this.state };
  }

  getMetrics() {
    return {
      ...this.metrics,
      memoryUsage: this.getMemoryUsage()
    };
  }

  getMemoryUsage() {
    if ('memory' in performance) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576)
      };
    }
    return null;
  }

  destroy() {
    // Cleanup
    if (this.observer) {
      this.observer.disconnect();
    }
    
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
    
    window.removeEventListener('resize', this.throttledApply);
    window.removeEventListener('orientationchange', this.throttledApply);
    
    console.log('RatioLayoutEngine destroyed');
  }
}

// QuadTree adapter for advanced spatial layouts (optional)
export class QuadTreeAdapter {
  constructor(engine, config = {}) {
    this.engine = engine;
    this.config = config;
    this.nodes = [];
    this.enabled = config.enabled || false;
  }

  partition(bounds, depth = 0) {
    if (!this.enabled) return;
    
    const { maxDepth = 4, minNodeSize = 64 } = this.config;
    
    if (depth >= maxDepth || 
        bounds.width < minNodeSize || 
        bounds.height < minNodeSize) {
      return bounds;
    }
    
    // Use golden ratio for splitting
    const splitRatio = 1 / this.engine.PHI;
    
    const node = {
      bounds,
      depth,
      children: []
    };
    
    // Implement spatial partitioning logic here
    // This is a placeholder for the full QuadTree implementation
    
    this.nodes.push(node);
    return node;
  }

  render() {
    if (!this.enabled || !this.config.debug?.showOverlay) return;
    
    // Render debug overlay
    const overlay = document.createElement('div');
    overlay.className = 'quadtree-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 10000;
    `;
    
    // Draw quadtree nodes
    this.nodes.forEach(node => {
      const rect = document.createElement('div');
      rect.style.cssText = `
        position: absolute;
        border: 1px solid rgba(0, 255, 0, 0.3);
        left: ${node.bounds.x}px;
        top: ${node.bounds.y}px;
        width: ${node.bounds.width}px;
        height: ${node.bounds.height}px;
      `;
      overlay.appendChild(rect);
    });
    
    document.body.appendChild(overlay);
  }
}

export default RatioLayoutEngine;