/* ================================================================
   QUAD CONFIG - JSON Parameter Control System
   Manages mathematical constants via JSON configuration
   NOW WITH DATABASE INTEGRATION
   ================================================================ */

export class QuadConfig {
  constructor() {
    this.config = {
      breakpoints: {
        mobile: { min: 0, max: 767 },
        tablet: { min: 768, max: 1023 },
        desktop: { min: 1024, max: 9999 }
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
    
    // NEW: Database integration properties
    this.apiEndpoint = null;
    this.autoSyncEnabled = false;
    this.syncInterval = null;
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
        desktop: { min: 1024, max: 9999 }
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

  // ================================================================
  // NEW: DATABASE INTEGRATION METHODS
  // ================================================================

  /**
   * Set API endpoint for database-driven configs
   * @param {string} endpoint - API endpoint URL
   */
  setAPIEndpoint(endpoint) {
    this.apiEndpoint = endpoint;
    console.log(`🔗 QuadConfig API endpoint set: ${endpoint}`);
  }

  /**
   * Load configuration from database via API
   * @param {Object} params - Query parameters (page, artist, etc.)
   * @returns {Promise} Loaded config
   */
  async loadFromDatabase(params = {}) {
    if (!this.apiEndpoint) {
      console.warn('⚠️ No API endpoint set. Use setAPIEndpoint() first.');
      return this.config;
    }

    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${this.apiEndpoint}${queryString ? '?' + queryString : ''}`;

      console.log(`📡 Loading config from database: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const dbConfig = await response.json();

      // Merge database config with existing
      this.mergeConfig(dbConfig);

      // Save to localStorage as cache
      this.saveConfig();

      console.log('✅ Database config loaded and merged');
      return this.config;

    } catch (error) {
      console.error('❌ Failed to load config from database:', error.message);
      // Fall back to existing config
      return this.config;
    }
  }

  /**
   * Save configuration to database via API
   * @param {Object} metadata - Additional metadata (user, page, timestamp)
   * @returns {Promise} Save result
   */
  async saveToDatabase(metadata = {}) {
    if (!this.apiEndpoint) {
      console.warn('⚠️ No API endpoint set. Use setAPIEndpoint() first.');
      return false;
    }

    try {
      const payload = {
        config: this.config,
        metadata: {
          timestamp: Date.now(),
          version: '1.0',
          ...metadata
        }
      };

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Config saved to database:', result);
      return result;

    } catch (error) {
      console.error('❌ Failed to save config to database:', error.message);
      return false;
    }
  }

  /**
   * Enable auto-sync with database
   * @param {number} intervalMs - Sync interval in milliseconds
   * @param {Object} params - Query parameters for loading
   */
  enableAutoSync(intervalMs = 30000, params = {}) {
    if (this.autoSyncEnabled) {
      console.warn('⚠️ Auto-sync already enabled');
      return;
    }

    this.autoSyncEnabled = true;
    this.syncInterval = setInterval(async () => {
      console.log('🔄 Auto-syncing config from database...');
      await this.loadFromDatabase(params);
    }, intervalMs);

    console.log(`✅ Auto-sync enabled (every ${intervalMs}ms)`);
  }

  /**
   * Disable auto-sync
   */
  disableAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.autoSyncEnabled = false;
      this.syncInterval = null;
      console.log('🛑 Auto-sync disabled');
    }
  }

  /**
   * Load page-specific configuration
   * @param {string} pageName - Page identifier (e.g., 'roderick', 'landing')
   * @param {string|number} artistId - Optional artist ID
   * @returns {Promise} Page config
   */
  async loadPageConfig(pageName, artistId = null) {
    const params = { page: pageName };
    if (artistId) params.artistId = artistId;

    return this.loadFromDatabase(params);
  }
}

// Global config instance
export const quadConfig = new QuadConfig();

console.log('⚙️ QuadConfig v1.0 loaded - JSON parameter control ready');

/* ================================================================
   DATABASE USAGE EXAMPLES:
   
   // Set API endpoint
   quadConfig.setAPIEndpoint('/api/config/quadtree');
   
   // Load page-specific config from database
   await quadConfig.loadPageConfig('roderick', 1);
   
   // Enable auto-sync (check for updates every 30 seconds)
   quadConfig.enableAutoSync(30000, { page: 'roderick', artistId: 1 });
   
   // Save current config to database
   await quadConfig.saveToDatabase({
     page: 'roderick',
     artistId: 1,
     author: 'admin'
   });
   
   // Disable auto-sync when done
   quadConfig.disableAutoSync();
   
   ================================================================ */