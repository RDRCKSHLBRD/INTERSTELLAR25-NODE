/**
 * InterstellarSystem.js - Global System Manager
 * Unified control for Config, Layout, QuadTree, RatioPosition, and Preloader
 * Makes everything globally accessible via window.Interstellar
 */

import { ViewportState } from '../system/State.js';
import { RatioLayoutEngine } from '../system/RatioLayoutEngine.js';
import { RatioPosition } from '../system/RatioPosition.js';

class InterstellarSystem {
  constructor() {
    this.version = '1.0.0';
    this.config = null;
    this.state = null;     // ViewportState
    this.layout = null;
    this.position = null;  // RatioPosition
    this.quadTree = null;  // ← Changed from quadtree to match property name
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
      console.log('✅ Config loaded:', this.config);

      // Step 2: Apply theme (CSS variables from config)
      this.applyTheme();
      console.log('✅ Theme applied');

      // Step 3: Initialize ViewportState
      this.state = new ViewportState(this.config.state);
      console.log('✅ ViewportState initialized');

      // Step 4: Initialize Layout Engine
      this.layout = new RatioLayoutEngine(this.config.layout);
      console.log('✅ Layout engine initialized');

      // Step 5: Initialize RatioPosition (needs state for viewport info)
      this.position = new RatioPosition({
        debug: this.config.position?.debug || false,
        useCSSTransform: this.config.position?.useCSSTransform !== false,
        roundToPixel: this.config.position?.roundToPixel !== false
      });
      console.log('✅ RatioPosition initialized');

      // Step 6: Initialize QuadTree (if enabled)
      if (this.config.quadTree?.enabled) {
        console.log('🌳 QuadTree enabled in config, initializing...');
        await this.initQuadTree();
      } else {
        console.log('⏭️ QuadTree disabled in config, skipping');
      }

      // Step 7: Initialize Preloader (if enabled)
      if (this.config.preloader?.enabled) {
        this.initPreloader();
        console.log('✅ Preloader initialized');
      }

      // Step 8: Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      window.Interstellar = this;
      console.log('🎉 Interstellar System ready!');
      console.log('📦 Global access: window.Interstellar');

      // Emit ready event
      this.emit('system:ready', {
        version: this.version,
        systems: {
          config: !!this.config,
          state: !!this.state,
          layout: !!this.layout,
          position: !!this.position,
          quadTree: !!this.quadTree,
          preloader: !!this.preloader
        }
      });

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
      console.log('📦 Loading config from /config.json...');

      // Try loading from /config.json
      const response = await fetch('/config.json');
      if (!response.ok) {
        throw new Error(`Config fetch failed: ${response.status}`);
      }

      const config = await response.json();
      console.log('✅ Config loaded from /config.json');

      // Merge with localStorage overrides
      const stored = localStorage.getItem('interstellar-config');
      if (stored) {
        console.log('🔄 Merging localStorage overrides...');
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
      state: {
        modes: {
          stack: { maxWidth: 720, maxAspect: 1.1 },
          split: { minWidth: 720, minAspect: 1.1 }
        }
      },
      layout: { mode: 'auto' },
      position: { debug: false },
      preloader: { enabled: true, minDisplayTime: 2000 },
      quadTree: { enabled: false },
      performance: { throttleResize: 100 },
      breakpoints: {}
    };
  }

  /**
   * Apply theme to CSS variables
   */
  applyTheme() {
    const root = document.documentElement;
    const theme = this.config.theme;

    if (!theme) return;

    console.log('🎨 Applying theme...');

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
    try {
      console.log('🌳 Loading QuadTree modules...');

      // Import QuadTree modules dynamically
      // Note: Check your actual file path - might be quadIndex.js (lowercase)
      const { QuadTreeSystem } = await import('../system/quadtree/quadIndex.js');
      this.quadTree = new QuadTreeSystem(this.config.quadTree);

      console.log('✅ QuadTree initialized:', this.quadTree);

    } catch (error) {
      console.error('❌ QuadTree initialization failed:', error);
      console.warn('⚠️ Check that quadIndex.js exists at ../system/quadtree/quadIndex.js');
    }
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
          const animationDuration = 3500;
          const remaining = Math.max(0, animationDuration - elapsed);

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
        preloaderEl.style.cursor = 'pointer';
        preloaderEl.addEventListener('click', () => {
          this.preloader.forceHide();
        }, { once: true });
      },

      triggerAnimation: () => {
        this.preloader.lines.forEach(line => line.classList.add('animate'));
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

    // Auto-hide when page fully loads
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

    // Handle resize - update positioned elements
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (this.position) {
          this.position.updateAll();
        }

        // Emit viewport change event
        this.emit('viewport:change', this.getViewportState());
      }, this.config.performance?.throttleResize || 100);
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
   * Get current viewport state
   */
  getViewportState() {
    if (!this.state) {
      console.warn('⚠️ ViewportState not initialized');
      return null;
    }

    return this.state.calculate({
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio || 1
    });
  }

  /**
   * Get active breakpoint config
   */
  getActiveBreakpoint() {
    if (!this.config?.breakpoints) {
      console.warn('⚠️ No breakpoints defined in config');
      return null;
    }

    const viewport = this.getViewportState();
    if (!viewport) return null;

    console.log('🔍 Checking breakpoints for viewport:', viewport);

    // Check each breakpoint
    for (const [name, breakpoint] of Object.entries(this.config.breakpoints)) {
      const matches = this.matchesBreakpoint(viewport, breakpoint);

      console.log(`  ${name}:`, matches ? '✅ MATCH' : '❌', breakpoint);

      if (matches) {
        console.log(`📱 Active breakpoint: ${name}`);
        return { name, config: breakpoint };
      }
    }

    console.log('⚠️ No breakpoint matched');
    return null;
  }

  /**
   * Check if viewport matches breakpoint
   */
  matchesBreakpoint(viewport, breakpoint) {
    return (
      (breakpoint.minWidth === undefined || viewport.width >= breakpoint.minWidth) &&
      (breakpoint.maxWidth === undefined || viewport.width <= breakpoint.maxWidth) &&
      (breakpoint.minHeight === undefined || viewport.height >= breakpoint.minHeight) &&
      (breakpoint.maxHeight === undefined || viewport.height <= breakpoint.maxHeight) &&
      (breakpoint.orientation === undefined || viewport.orientation === breakpoint.orientation)
    );
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
      viewport: this.getViewportState(),
      layout: this.layout?.getState(),
      position: this.position?.getMetrics(),
      metrics: this.layout?.getMetrics(),
      activeBreakpoint: this.getActiveBreakpoint()
    };
  }

  /**
   * Destroy system (cleanup)
   */
  destroy() {
    if (this.layout) {
      this.layout.destroy();
    }

    if (this.position) {
      this.position.clearAll();
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
    window.Interstellar.init().then(() => {
      console.log('✅ Interstellar System initialized from DOMContentLoaded');
    });
  }
});

// Export for modules
export default Interstellar;
