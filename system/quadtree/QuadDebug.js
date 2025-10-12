/* ================================================================
   QUAD DEBUG - Debugging & Visualization Tools
   Debug utilities for QuadTree system development
   ================================================================ */

export class QuadDebug {
  constructor() {
    this.isActive = window.location.search.includes('debug=true');
    this.debugPanel = null;
    this.logHistory = [];
    this.maxLogHistory = 100;
    
    if (this.isActive) {
      this.init();
    }
  }
  
  /**
   * Initialize debug panel
   */
  init() {
    this.createDebugPanel();
    this.setupKeyboardShortcuts();
    console.log('🐛 QuadDebug activated - Press Ctrl+Q to toggle panel');
  }
  
  /**
   * Create floating debug panel
   */
  createDebugPanel() {
    this.debugPanel = document.createElement('div');
    this.debugPanel.id = 'quad-debug-panel';
    this.debugPanel.innerHTML = `
      <div class="debug-header">
        <span>🧮 QuadTree Debug</span>
        <button onclick="this.parentElement.parentElement.style.display='none'">×</button>
      </div>
      <div class="debug-content">
        <div class="debug-section">
          <h4>System Stats</h4>
          <div id="debug-stats"></div>
        </div>
        <div class="debug-section">
          <h4>Recent Calculations</h4>
          <div id="debug-log"></div>
        </div>
        <div class="debug-section">
          <h4>Performance</h4>
          <div id="debug-performance"></div>
        </div>
      </div>
    `;
    
    // Style the debug panel
    this.debugPanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 350px;
      max-height: 500px;
      background: rgba(0, 0, 0, 0.9);
      color: #fff;
      border: 1px solid #333;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      overflow: hidden;
      display: none;
    `;
    
    // Style debug header
    const header = this.debugPanel.querySelector('.debug-header');
    header.style.cssText = `
      background: #333;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #555;
    `;
    
    // Style debug content
    const content = this.debugPanel.querySelector('.debug-content');
    content.style.cssText = `
      padding: 12px;
      max-height: 400px;
      overflow-y: auto;
    `;
    
    // Style debug sections
    this.debugPanel.querySelectorAll('.debug-section').forEach(section => {
      section.style.cssText = `
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #333;
      `;
      
      const h4 = section.querySelector('h4');
      if (h4) {
        h4.style.cssText = `
          margin: 0 0 8px 0;
          color: #4CAF50;
          font-size: 14px;
        `;
      }
    });
    
    document.body.appendChild(this.debugPanel);
    this.startUpdateLoop();
  }
  
  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Q to toggle debug panel
      if (e.ctrlKey && e.key === 'q') {
        e.preventDefault();
        this.togglePanel();
      }
      
      // Ctrl+Shift+Q to clear debug log
      if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
        e.preventDefault();
        this.clearLog();
      }
    });
  }
  
  /**
   * Toggle debug panel visibility
   */
  togglePanel() {
    if (!this.debugPanel) return;
    
    const isVisible = this.debugPanel.style.display !== 'none';
    this.debugPanel.style.display = isVisible ? 'none' : 'block';
  }
  
  /**
   * Log QuadTree calculation
   * @param {string} type 
   * @param {Object} data 
   */
  log(type, data) {
    if (!this.isActive) return;
    
    const logEntry = {
      timestamp: Date.now(),
      type: type,
      data: data
    };
    
    this.logHistory.unshift(logEntry);
    
    // Limit log history
    if (this.logHistory.length > this.maxLogHistory) {
      this.logHistory = this.logHistory.slice(0, this.maxLogHistory);
    }
    
    console.log(`🧮 QuadDebug [${type}]:`, data);
  }
  
  /**
   * Start debug panel update loop
   */
  startUpdateLoop() {
    setInterval(() => {
      if (this.debugPanel && this.debugPanel.style.display !== 'none') {
        this.updateDebugPanel();
      }
    }, 1000);
  }
  
  /**
   * Update debug panel content
   */
  updateDebugPanel() {
    this.updateStats();
    this.updateLog();
    this.updatePerformance();
  }
  
  /**
   * Update system stats
   */
  updateStats() {
    const statsEl = document.getElementById('debug-stats');
    if (!statsEl) return;
    
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      breakpoint: document.documentElement.dataset.breakpoint || 'unknown'
    };
    
    statsEl.innerHTML = `
      <div>Viewport: ${viewport.width}×${viewport.height}</div>
      <div>Breakpoint: ${viewport.breakpoint}</div>
      <div>Qt Containers: ${document.querySelectorAll('.qt-container').length}</div>
      <div>Log Entries: ${this.logHistory.length}</div>
    `;
  }
  
  /**
   * Update calculation log
   */
  updateLog() {
    const logEl = document.getElementById('debug-log');
    if (!logEl) return;
    
    const recentLogs = this.logHistory.slice(0, 5);
    
    logEl.innerHTML = recentLogs.map(entry => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      return `<div>${time} [${entry.type}]</div>`;
    }).join('');
  }
  
  /**
   * Update performance metrics
   */
  updatePerformance() {
    const perfEl = document.getElementById('debug-performance');
    if (!perfEl) return;
    
    const memory = performance.memory ? {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
    } : null;
    
    perfEl.innerHTML = `
      ${memory ? `<div>Memory: ${memory.used}MB / ${memory.total}MB</div>` : ''}
      <div>FPS: ${this.calculateFPS()}</div>
      <div>Cache Hit Rate: ${this.getCacheHitRate()}%</div>
    `;
  }
  
  /**
   * Calculate approximate FPS
   */
  calculateFPS() {
    if (!this.lastFrameTime) {
      this.lastFrameTime = performance.now();
      this.frameCount = 0;
      return 60; // Default estimate
    }
    
    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastFrameTime;
    
    if (elapsed >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / elapsed);
      this.lastFrameTime = now;
      this.frameCount = 0;
      return fps;
    }
    
    return this.lastFPS || 60;
  }
  
  /**
   * Get cache hit rate (mock implementation)
   */
  getCacheHitRate() {
    // This would connect to actual QuadCache stats
    return Math.round(85 + Math.random() * 10); // Mock 85-95%
  }
  
  /**
   * Clear debug log
   */
  clearLog() {
    this.logHistory = [];
    console.log('🧮 QuadDebug log cleared');
  }
  
  /**
   * Highlight container with debug overlay
   * @param {Element} container 
   * @param {Object} info 
   */
  highlightContainer(container, info = {}) {
    if (!this.isActive || !container) return;
    
    // Remove existing highlights
    container.classList.remove('qt-debug-highlight');
    
    // Add debug highlight
    container.classList.add('qt-debug-highlight');
    
    // Remove highlight after 2 seconds
    setTimeout(() => {
      container.classList.remove('qt-debug-highlight');
    }, 2000);
    
    this.log('highlight', {
      container: container.className,
      info: info
    });
  }
  
  /**
   * Add debug CSS styles
   */
  addDebugStyles() {
    if (document.getElementById('quad-debug-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'quad-debug-styles';
    style.textContent = `
      .qt-debug-highlight {
        outline: 2px dashed #4CAF50 !important;
        background: rgba(76, 175, 80, 0.1) !important;
        position: relative !important;
      }
      
      .qt-debug-highlight::before {
        content: '🧮 QuadTree';
        position: absolute;
        top: 0;
        left: 0;
        background: #4CAF50;
        color: white;
        padding: 2px 6px;
        font-size: 10px;
        font-family: monospace;
        z-index: 10001;
      }
    `;
    
    document.head.appendChild(style);
  }
}

// Global debug instance
export const quadDebug = new QuadDebug();

console.log('🐛 QuadDebug v1.0 loaded - Debug tools ready');