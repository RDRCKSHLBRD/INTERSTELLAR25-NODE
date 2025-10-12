/* ================================================================
   QUAD CACHE - Performance Optimization Cache
   Simple LRU cache for expensive calculations
   ================================================================ */

export class QuadCache {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.accessOrder = [];
  }
  
  /**
   * Generate cache key from container and viewport state
   * @param {Element} container 
   * @param {Object} options 
   * @returns {string} Unique cache key
   */
  generateKey(container, options = {}) {
    const rect = container.getBoundingClientRect();
    const breakpoint = document.documentElement.dataset.breakpoint || 'desktop';
    const isLandscape = window.innerWidth > window.innerHeight;
    
    const keyComponents = [
      container.className || 'no-class',
      Math.round(rect.width),
      Math.round(rect.height),
      breakpoint,
      isLandscape ? 'landscape' : 'portrait',
      JSON.stringify(options)
    ];
    
    return keyComponents.join('-');
  }
  
  /**
   * Get cached calculation result
   * @param {string} key 
   * @returns {Object|null} Cached result or null
   */
  get(key) {
    if (!this.cache.has(key)) return null;
    
    // Update access order (LRU)
    this.updateAccessOrder(key);
    
    const cached = this.cache.get(key);
    
    // Check if cache is stale (older than 5 seconds)
    if (Date.now() - cached.timestamp > 5000) {
      this.delete(key);
      return null;
    }
    
    return cached.result;
  }
  
  /**
   * Store calculation result in cache
   * @param {string} key 
   * @param {Object} result 
   */
  set(key, result) {
    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.delete(key);
    }
    
    // Add new entry
    this.cache.set(key, {
      result: result,
      timestamp: Date.now()
    });
    
    this.accessOrder.push(key);
    
    // Enforce size limit
    this.enforceSize();
  }
  
  /**
   * Delete entry from cache
   * @param {string} key 
   */
  delete(key) {
    this.cache.delete(key);
    this.accessOrder = this.accessOrder.filter(k => k !== key);
  }
  
  /**
   * Update access order for LRU
   * @param {string} key 
   */
  updateAccessOrder(key) {
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);
  }
  
  /**
   * Enforce cache size limit (LRU eviction)
   */
  enforceSize() {
    while (this.cache.size > this.maxSize) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }
  
  /**
   * Clear all cached entries
   */
  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }
  
  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    const now = Date.now();
    let staleCount = 0;
    
    this.cache.forEach(entry => {
      if (now - entry.timestamp > 5000) {
        staleCount++;
      }
    });
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      staleEntries: staleCount,
      hitRate: this.hitCount / Math.max(1, this.hitCount + this.missCount),
      accessOrder: this.accessOrder.length
    };
  }
  
  /**
   * Clean up stale entries
   */
  cleanup() {
    const now = Date.now();
    const staleKeys = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > 5000) {
        staleKeys.push(key);
      }
    });
    
    staleKeys.forEach(key => this.delete(key));
    
    return staleKeys.length;
  }
}

console.log('💾 QuadCache v1.0 loaded - Performance optimization ready');