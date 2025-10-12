/* ================================================================
   QUAD OBSERVER - Resize & Viewport Observer
   Handles container resize events and viewport changes
   ================================================================ */

export class QuadObserver {
  constructor() {
    this.observers = new Map();
    this.debounceTimers = new Map();
    this.isDestroyed = false;
    
    this.setupGlobalListeners();
  }
  
  /**
   * Observe container for resize events
   * @param {Element} container 
   * @param {Function} callback 
   * @param {Object} options 
   */
  observeContainer(container, callback, options = {}) {
    if (this.isDestroyed || !container) return;
    
    const debounceDelay = options.debounce || 50;
    const observerId = this.generateObserverId(container);
    
    // Clean up existing observer
    this.unobserveContainer(container);
    
    // Create ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      this.debounceCallback(observerId, () => {
        if (this.isDestroyed) return;
        
        entries.forEach(entry => {
          if (entry.target === container) {
            callback({
              container: entry.target,
              bounds: entry.contentRect,
              timestamp: Date.now()
            });
          }
        });
      }, debounceDelay);
    });
    
    try {
      resizeObserver.observe(container);
      
      this.observers.set(observerId, {
        container: container,
        observer: resizeObserver,
        callback: callback,
        options: options
      });
      
      // Trigger initial callback
      callback({
        container: container,
        bounds: container.getBoundingClientRect(),
        timestamp: Date.now(),
        initial: true
      });
      
    } catch (error) {
      console.warn('QuadObserver: Failed to observe container:', error.message);
    }
  }
  
  /**
   * Stop observing container
   * @param {Element} container 
   */
  unobserveContainer(container) {
    const observerId = this.generateObserverId(container);
    const observerData = this.observers.get(observerId);
    
    if (observerData) {
      try {
        observerData.observer.disconnect();
      } catch (error) {
        console.warn('QuadObserver: Disconnect error:', error.message);
      }
      
      this.observers.delete(observerId);
      this.clearDebounceTimer(observerId);
    }
  }
  
  /**
   * Setup global viewport listeners
   */
  setupGlobalListeners() {
    let orientationTimer = null;
    
    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
      if (orientationTimer) clearTimeout(orientationTimer);
      
      orientationTimer = setTimeout(() => {
        this.handleGlobalChange('orientation');
      }, 300);
    });
    
    // Handle window resize (debounced)
    window.addEventListener('resize', () => {
      this.debounceCallback('global-resize', () => {
        this.handleGlobalChange('resize');
      }, 100);
    });
    
    // Handle breakpoint changes (from ViewportState)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-breakpoint') {
          this.handleGlobalChange('breakpoint');
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-breakpoint']
    });
  }
  
  /**
   * Handle global viewport changes
   * @param {string} changeType 
   */
  handleGlobalChange(changeType) {
    if (this.isDestroyed) return;
    
    // Notify all observers of global change
    this.observers.forEach((observerData, observerId) => {
      const { container, callback } = observerData;
      
      if (container && callback) {
        callback({
          container: container,
          bounds: container.getBoundingClientRect(),
          timestamp: Date.now(),
          changeType: changeType,
          global: true
        });
      }
    });
  }
  
  /**
   * Generate unique observer ID
   * @param {Element} container 
   * @returns {string} Observer ID
   */
  generateObserverId(container) {
    return `${container.tagName}-${container.id || 'no-id'}-${Date.now()}`;
  }
  
  /**
   * Debounce callback execution
   * @param {string} id 
   * @param {Function} callback 
   * @param {number} delay 
   */
  debounceCallback(id, callback, delay) {
    this.clearDebounceTimer(id);
    
    this.debounceTimers.set(id, setTimeout(() => {
      callback();
      this.debounceTimers.delete(id);
    }, delay));
  }
  
  /**
   * Clear debounce timer
   * @param {string} id 
   */
  clearDebounceTimer(id) {
    const timer = this.debounceTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(id);
    }
  }
  
  /**
   * Force update all observed containers
   */
  forceUpdate() {
    this.observers.forEach((observerData) => {
      const { container, callback } = observerData;
      
      if (container && callback) {
        callback({
          container: container,
          bounds: container.getBoundingClientRect(),
          timestamp: Date.now(),
          forced: true
        });
      }
    });
  }
  
  /**
   * Get observer statistics
   * @returns {Object} Observer stats
   */
  getStats() {
    return {
      observedContainers: this.observers.size,
      activeTimers: this.debounceTimers.size,
      isDestroyed: this.isDestroyed
    };
  }
  
  /**
   * Destroy all observers
   */
  destroy() {
    this.isDestroyed = true;
    
    // Disconnect all observers
    this.observers.forEach((observerData) => {
      try {
        observerData.observer.disconnect();
      } catch (error) {
        // Ignore disconnect errors
      }
    });
    
    // Clear all timers
    this.debounceTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    
    this.observers.clear();
    this.debounceTimers.clear();
  }
}

// Global observer instance
export const quadObserver = new QuadObserver();

console.log('👁️ QuadObserver v1.0 loaded - Resize & viewport monitoring ready');