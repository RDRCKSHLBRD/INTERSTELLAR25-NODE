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
        stack: { maxWidth: 720, maxAr: 1.1 },
        split: { minWidth: 720, minAr: 1.1 }
      },
      
      ...stateConfig
    };
  }

  /**
   * Pure calculation - takes measurements, returns state
   * @param {Object} measurements { width, height, dpr }
   * @returns {Object} calculated state
   */
  calculate(measurements) {
    const { width, height, dpr } = measurements;
    const ar = width / height;
    
    return {
      // Core measurements
      vw: width,
      vh: height,
      ar: parseFloat(ar.toFixed(this.config.precision)),
      pr: dpr,
      
      // Orientation
      orientation: ar > 1 ? 'landscape' : 'portrait',
      
      // Golden ratio detection
      isGolden: Math.abs(ar - this.config.golden.phi) < this.config.golden.tolerance,
      
      // Calculated values
      measure: this.calculateMeasure(width),
      gutter: this.calculateGutter(width),
      cols: this.calculateColumns(width),
      headerH: this.calculateHeaderHeight(height),
      
      // Layout mode
      mode: this.determineMode(width, height, ar),
      
      // Timestamp
      timestamp: Date.now()
    };
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
  determineMode(width, height, ar) {
    const { stack, split } = this.config.modes;
    
    // Stack mode for narrow/portrait
    if (width < stack.maxWidth || ar < stack.maxAr) {
      return 'stack';
    }
    
    // Split mode for wider viewports
    if (width >= split.minWidth && ar >= split.minAr) {
      return 'split';
    }
    
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