/* ================================================================
   QUAD CONFIG - JSON Parameter Control System
   Manages mathematical constants via JSON configuration
   ================================================================ */

export class QuadConfig {
  constructor() {
    this.config = {
      breakpoints: {
        mobile: { min: 0, max: 767 },
        tablet: { min: 768, max: 1023 },
        desktop: { min: 1024, max: Infinity }
      },
      scaling: {
        baseSize: 100,
        minScale: 0.5,
        maxScale: 3.0,
        aspectRatio: 16/9
      },
      performance: {
        debounceDelay: 50,
        cacheSize: 50,
        maxCalculationTime: 16
      },
      debug: {
        enabled: false,
        logLevel: 'info',
        showOverlays: false
      }
    };
    
    this.isLoaded = false;
    this.loadPromise = this.loadConfig();
  }

  /**
   * Load configuration from JSON file or localStorage
   * @returns {Promise} Load promise
   */
  async loadConfig() {
    try {
      // Try loading from localStorage first
      const stored = localStorage.getItem('quadtree-config');
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        this.mergeConfig(parsedConfig);
      }
      
      // Try loading from external JSON file
      try {
        const response = await fetch('/config/quadtree.json');
        if (response.ok) {
          const externalConfig = await response.json();
          this.mergeConfig(externalConfig);
        }
      } catch (fetchError) {
        // External config is optional, continue with defaults
        console.log('🔧 QuadConfig: Using default configuration');
      }
      
      this.isLoaded = true;
      console.log('⚙️ QuadConfig loaded:', this.config);
      
    } catch (error) {
      console.warn('QuadConfig load error:', error.message);
      this.isLoaded = true; // Continue with defaults
    }
    
    return this.config;
  }

  /**
   * Merge external config with defaults
   * @param {Object} externalConfig 
   */
  mergeConfig(externalConfig) {
    this.config = this.deepMerge(this.config, externalConfig);
  }

  /**
   * Deep merge two objects
   * @param {Object} target 
   * @param {Object} source 
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Get configuration value by path
   * @param {string} path Dot-separated path (e.g., 'scaling.baseSize')
   * @returns {*} Configuration value
   */
  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  /**
   * Set configuration value by path
   * @param {string} path 
   * @param {*} value 
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => obj[key] = obj[key] || {}, this.config);
    target[lastKey] = value;
    
    // Save to localStorage
    this.saveConfig();
  }

  /**
   * Save configuration to localStorage
   */
  saveConfig() {
    try {
      localStorage.setItem('quadtree-config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('QuadConfig save error:', error.message);
    }
  }

  /**
   * Wait for configuration to load
   * @returns {Promise} Load promise
   */
  async waitForLoad() {
    await this.loadPromise;
    return this.config;
  }

  /**
   * Reset to default configuration
   */
  reset() {
    this.config = {
      breakpoints: {
        mobile: { min: 0, max: 767 },
        tablet: { min: 768, max: 1023 },
        desktop: { min: 1024, max: Infinity }
      },
      scaling: {
        baseSize: 100,
        minScale: 0.5,
        maxScale: 3.0,
        aspectRatio: 16/9
      },
      performance: {
        debounceDelay: 50,
        cacheSize: 50,
        maxCalculationTime: 16
      },
      debug: {
        enabled: false,
        logLevel: 'info',
        showOverlays: false
      }
    };
    
    this.saveConfig();
  }

  /**
   * Export configuration as JSON
   * @returns {string} JSON string
   */
  export() {
    return JSON.stringify(this.config, null, 2);
  }
}

// Global config instance
export const quadConfig = new QuadConfig();

console.log('⚙️ QuadConfig v1.0 loaded - JSON parameter control ready');