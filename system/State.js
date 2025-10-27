/**
 * State.js - Pure Viewport/Device State Calculator
 * NO DOM ACCESS - Pure mathematical functions
 * Configurable via config.state section
 */

export class ViewportState {
  constructor(stateConfig = {}) {
    // Default config (can be overridden)
    this.config = {
      precision: 4,
      throttle: 100,
      
      golden: {
        phi: 1.618033988749895,
        tolerance: 0.1
      },
      
      measure: {
        min: 300,
        max: 1200,
        power: 0.8
      },
      
      gutter: {
        min: 8,
        factor: 0.02
      },
      
      columns: {
        min: 1,
        max: 4,
        width: 300
      },
      
      header: {
        min: 48,
        factor: 0.08
      },
      
      modes: {
        stack: { maxWidth: 720, maxAspect: 1.1 },
        split: { minWidth: 720, minAspect: 1.1 }
      },
      
      ...stateConfig
    };
    
    console.log('📐 State.js initialized with config:', {
      stackMaxWidth: this.config.modes.stack.maxWidth,
      stackMaxAspect: this.config.modes.stack.maxAspect,
      splitMinWidth: this.config.modes.split.minWidth,
      splitMinAspect: this.config.modes.split.minAspect
    });
  }

  /**
   * Pure calculation - takes measurements, returns state
   * @param {Object} measurements { width, height, dpr }
   * @returns {Object} calculated state
   */
  calculate(measurements) {
    console.log('📊 State.calculate() called with:', measurements);
    
    const { width, height, dpr } = measurements;
    const aspect = width / height;
    
    console.log('🔢 Calculated aspect ratio:', {
      width,
      height,
      aspect: aspect.toFixed(4),
      orientation: aspect > 1 ? 'landscape' : 'portrait'
    });
    
    const mode = this.determineMode(width, height, aspect);
    
    const state = {
      // Core measurements - clean property names
      width: width,
      height: height,
      aspect: parseFloat(aspect.toFixed(this.config.precision)),
      pixelRatio: dpr,
      
      // Orientation
      orientation: aspect > 1 ? 'landscape' : 'portrait',
      
      // Golden ratio detection
      isGolden: Math.abs(aspect - this.config.golden.phi) < this.config.golden.tolerance,
      
      // Calculated values
      measure: this.calculateMeasure(width),
      gutter: this.calculateGutter(width),
      cols: this.calculateColumns(width),
      headerHeight: this.calculateHeaderHeight(height),
      
      // Layout mode
      mode: mode,
      
      // Timestamp
      timestamp: Date.now()
    };
    
    console.log('✅ State calculated:', {
      dimensions: `${state.width} x ${state.height}`,
      aspect: state.aspect,
      orientation: state.orientation,
      mode: state.mode,
      cols: state.cols,
      gutter: state.gutter
    });
    
    return state;
  }

  /**
   * Calculate optimal text measure (line length)
   */
  calculateMeasure(width) {
    const calculated = Math.pow(width, this.config.measure.power);
    return Math.round(Math.min(calculated, this.config.measure.max));
  }

  /**
   * Calculate gutter size
   */
  calculateGutter(width) {
    const calculated = Math.round(width * this.config.gutter.factor);
    return Math.max(this.config.gutter.min, calculated);
  }

  /**
   * Calculate optimal column count
   */
  calculateColumns(width) {
    const calculated = Math.floor(width / this.config.columns.width);
    return Math.min(
      this.config.columns.max,
      Math.max(this.config.columns.min, calculated)
    );
  }

  /**
   * Calculate header height
   */
  calculateHeaderHeight(height) {
    const calculated = Math.round(height * this.config.header.factor);
    return Math.max(this.config.header.min, calculated);
  }

  /**
   * Determine layout mode based on viewport
   */
  determineMode(width, height, aspect) {
    const { stack, split } = this.config.modes;
    
    console.log('🎯 Determining mode:', {
      width,
      height,
      aspect: aspect.toFixed(4),
      'width < stack.maxWidth': width < stack.maxWidth,
      'aspect < stack.maxAspect': aspect < stack.maxAspect,
      'width >= split.minWidth': width >= split.minWidth,
      'aspect >= split.minAspect': aspect >= split.minAspect
    });
    
    // Stack mode for narrow/portrait
    if (width < stack.maxWidth || aspect < stack.maxAspect) {
      console.log('🎯 Mode selected: STACK (narrow or portrait)');
      return 'stack';
    }
    
    // Split mode for wider viewports
    if (width >= split.minWidth && aspect >= split.minAspect) {
      console.log('🎯 Mode selected: SPLIT (wide landscape)');
      return 'split';
    }
    
    console.log('🎯 Mode selected: AUTO (fallback)');
    return 'auto';
  }

  /**
   * Get current config
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update config (returns new instance for immutability)
   */
  updateConfig(newConfig) {
    return new ViewportState({
      ...this.config,
      ...newConfig
    });
  }
}

// For debugging
if (typeof window !== 'undefined') {
  console.log('📐 State.js loaded - Pure viewport calculator');
}