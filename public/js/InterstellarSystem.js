/**
 * InterstellarSystem.js - Global System Manager
 * Unified control for Config, Layout, QuadTree, and Preloader
 * Makes everything globally accessible via window.Interstellar
 */

import { RatioLayoutEngine } from '../system/RatioLayoutEngine.js';
import { quadConfig } from '../system/quadtree/QuadConfig.js';

class InterstellarSystem {
  constructor() {
    this.version = '1.0.0';
    this.config = null;
    this.layout = null;
    this.quadtree = null;
    this.preloader = null;
    
    this.isInitialized = false;
    this.initPromise = null;
    
    // Bind methods for global access
    this.init = this.init.bind(this);
    this.applyTheme = this.applyTheme.bind(this);
  }

  /**
   * Initialize the entire system
   */
  async init() {
    if (this.isInitialized) {
      console.warn('⚠️ System already initialized');
      return this;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  async _initialize() {
    console.log('🚀 Initializing Interstellar System...');
    
    try {
      // Step 1: Load unified config
      this.config = await this.loadConfig();
      console.log('✅ Config loaded');

      // Step 2: Apply theme (CSS variables from config)
      this.applyTheme();
      console.log('✅ Theme applied');

      // Step 3: Initialize Layout Engine
      this.layout = new RatioLayoutEngine(this.config.layout);
      console.log('✅ Layout engine initialized');

      // Step 4: Initialize QuadTree (if enabled)
      if (this.config.quadtree?.enabled) {
        await this.initQuadTree();
        console.log('✅ QuadTree initialized');
      }

      // Step 5: Initialize Preloader (if enabled)
      if (this.config.preloader?.enabled) {
        this.initPreloader();
        console.log('✅ Preloader initialized');
      }

      // Step 6: Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('🎉 Interstellar System ready!');

      // Emit ready event
      this.emit('system:ready', { version: this.version });

      return this;

    } catch (error) {
      console.error('❌ System initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load configuration from JSON file
   */
  async loadConfig() {
    try {
      // Try loading from /config.json
      const response = await fetch('/config.json');
      if (!response.ok) {
        throw new Error('Config file not found');
      }
      
      const config = await response.json();
      
      // Merge with localStorage overrides
      const stored = localStorage.getItem('interstellar-config');
      if (stored) {
        const overrides = JSON.parse(stored);
        return this.deepMerge(config, overrides);
      }
      
      return config;
      
    } catch (error) {
      console.warn('⚠️ Failed to load config.json, using defaults:', error.message);
      return this.getDefaultConfig();
    }
  }

  /**
   * Get default configuration (fallback)
   */
  getDefaultConfig() {
    return {
      theme: {
        colors: {
          bg: { primary: '#0a0a0a', secondary: '#1a1a1a' },
          text: { primary: '#d9e0cd', secondary: '#adaaa1' }
        },
        spacing: { unit: 8 },
        animation: { duration: { normal: 300 } }
      },
      layout: { mode: 'auto' },
      preloader: { enabled: true, minDisplayTime: 2000 },
      performance: { throttleResize: 100 }
    };
  }

  /**
   * Apply theme to CSS variables
   */
  applyTheme() {
    const root = document.documentElement;
    const theme = this.config.theme;

    if (!theme) return;

    // Apply colors
    if (theme.colors) {
      this.applyCSSVars(root, theme.colors, 'color');
    }

    // Apply spacing
    if (theme.spacing) {
      Object.entries(theme.spacing).forEach(([key, value]) => {
        root.style.setProperty(`--spacing-${key}`, `${value}px`);
      });
    }

    // Apply typography
    if (theme.typography) {
      const typo = theme.typography;
      if (typo.baseFontSize) {
        root.style.setProperty('--font-size-base', `${typo.baseFontSize}px`);
      }
      if (typo.fontFamily) {
        root.style.setProperty('--font-family', typo.fontFamily);
      }
      if (typo.lineHeight) {
        root.style.setProperty('--line-height', typo.lineHeight);
      }
    }

    // Apply animation settings
    if (theme.animation) {
      const anim = theme.animation;
      if (anim.duration) {
        Object.entries(anim.duration).forEach(([key, value]) => {
          root.style.setProperty(`--duration-${key}`, `${value}ms`);
        });
      }
      if (anim.easing) {
        Object.entries(anim.easing).forEach(([key, value]) => {
          root.style.setProperty(`--easing-${key}`, value);
        });
      }
    }
  }

  /**
   * Recursively apply CSS variables from nested object
   */
  applyCSSVars(root, obj, prefix = '') {
    Object.entries(obj).forEach(([key, value]) => {
      const varName = prefix ? `--${prefix}-${key}` : `--${key}`;
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        this.applyCSSVars(root, value, prefix ? `${prefix}-${key}` : key);
      } else {
        root.style.setProperty(varName, value);
      }
    });
  }

  /**
   * Initialize QuadTree system
   */
  async initQuadTree() {
  // Import QuadTree modules dynamically
  const { QuadTreeSystem } = await import('../system/quadtree/QuadIndex.js');  // ✅ CORRECT!
  
  // Initialize QuadTree
  this.quadtree = new QuadTreeSystem(this.config.quadtree);  // ✅ Single unified system
  
  console.log('✅ QuadTree initialized');
}

   
  /**
   * Initialize Preloader
   */
  initPreloader() {
    const preloaderEl = document.getElementById('preloader');
    
    if (!preloaderEl) {
      console.warn('⚠️ Preloader element not found');
      return;
    }

    // Create preloader controller
 this.preloader = {
  element: preloaderEl,
  lines: preloaderEl.querySelectorAll('.logo-line'),
  text: preloaderEl.querySelector('.logo-text'),
  config: this.config.preloader,
  activeRequests: 0,
  showTime: null,
  animationTriggered: false,
  clickPromptShown: false,

  show: () => {
    this.preloader.activeRequests++;
    this.preloader.showTime = Date.now();
    preloaderEl.classList.remove('hidden', 'removed');
    
    if (!this.preloader.animationTriggered) {
      setTimeout(() => this.preloader.triggerAnimation(), 100);
      this.preloader.animationTriggered = true;
    }
  },

  hide: () => {
    this.preloader.activeRequests = Math.max(0, this.preloader.activeRequests - 1);
    
    if (this.preloader.activeRequests === 0) {
      const elapsed = Date.now() - this.preloader.showTime;
      const animationDuration = 3500; // Lines finish at 2.8s + text at 2.2s + buffer
      const remaining = Math.max(0, animationDuration - elapsed);
      
      // Show click prompt after animation completes
      setTimeout(() => {
        if (!this.preloader.clickPromptShown && !preloaderEl.classList.contains('hidden')) {
          this.preloader.showClickPrompt();
        }
      }, remaining);
    }
  },

  showClickPrompt: () => {
    if (this.preloader.clickPromptShown) return;
    
    this.preloader.clickPromptShown = true;
    
    // Make entire preloader clickable (no text prompt)
    preloaderEl.style.cursor = 'pointer';
    preloaderEl.addEventListener('click', () => {
      this.preloader.forceHide();
    }, { once: true });
  },

  triggerAnimation: () => {
    // Animate all lines
    this.preloader.lines.forEach(line => line.classList.add('animate'));
    
    // Animate text after lines
    if (this.preloader.text) {
      this.preloader.text.classList.add('animate');
    }
  },

  forceHide: () => {
    this.preloader.activeRequests = 0;
    preloaderEl.classList.add('hidden');
    setTimeout(() => preloaderEl.classList.add('removed'), 800);
  }
};

    // Auto-show on init
    this.preloader.show();

    // Auto-hide when page fully loads (triggers click prompt)
    if (document.readyState === 'complete') {
      this.preloader.hide();
    } else {
      window.addEventListener('load', () => {
        this.preloader.hide();
      });
    }

    // Make globally accessible
    window.Preloader = this.preloader;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for layout changes
    window.addEventListener('rdxexp:layoutchange', (e) => {
      this.emit('layout:change', e.detail);
    });

    // Config change listener
    window.addEventListener('storage', (e) => {
      if (e.key === 'interstellar-config') {
        console.log('🔄 Config changed in another tab, reloading...');
        this.loadConfig().then(config => {
          this.config = config;
          this.applyTheme();
        });
      }
    });
  }

  /**
   * Get config value by path
   */
  get(path, defaultValue = null) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config) ?? defaultValue;
  }

  /**
   * Set config value by path
   */
  set(path, value, persist = true) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = this.config;
    
    for (const key of keys) {
      if (!current[key]) current[key] = {};
      current = current[key];
    }
    
    current[lastKey] = value;
    
    if (persist) {
      localStorage.setItem('interstellar-config', JSON.stringify(this.config));
    }

    // Re-apply theme if theme property changed
    if (path.startsWith('theme.')) {
      this.applyTheme();
    }
  }

  /**
   * Deep merge utility
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
   * Event emitter
   */
  emit(eventName, detail = {}) {
    const event = new CustomEvent(eventName, { detail });
    window.dispatchEvent(event);
  }

  /**
   * Event listener
   */
  on(eventName, callback) {
    window.addEventListener(eventName, callback);
  }

  /**
   * Get system state
   */
  getState() {
    return {
      version: this.version,
      isInitialized: this.isInitialized,
      config: this.config,
      layout: this.layout?.getState(),
      metrics: this.layout?.getMetrics()
    };
  }

  /**
   * Destroy system (cleanup)
   */
  destroy() {
    if (this.layout) {
      this.layout.destroy();
    }
    
    console.log('🛑 Interstellar System destroyed');
  }
}

// Create global instance
const Interstellar = new InterstellarSystem();

// Make globally accessible
window.Interstellar = Interstellar;

// Auto-initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  if (!window.Interstellar.isInitialized) {
    window.Interstellar.init();
  }
});

// Export for modules
export default Interstellar;