// SystemTimer.js - Performance Monitoring & Memory Management
// Handles timing operations, performance monitoring, and memory cleanup

class SystemTimer {
    constructor() {
        this.timers = new Map();
        this.intervals = new Map();
        this.lastUpdateTime = 0;
        this.updateInterval = 250; // 250ms throttling for UI updates
        this.performanceMetrics = {
            loadTimes: [],
            memoryUsage: [],
            audioLatency: []
        };
    }

    // Throttled execution for frequent operations (like time updates)
    throttle(key, callback, delay = this.updateInterval) {
        const now = Date.now();
        const lastTime = this.timers.get(key) || 0;
        
        if (now - lastTime >= delay) {
            this.timers.set(key, now);
            return callback();
        }
        return null;
    }

    // Debounced execution for expensive operations
    debounce(key, callback, delay = 300) {
        // Clear existing timer
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }
        
        // Set new timer
        const timerId = setTimeout(() => {
            callback();
            this.timers.delete(key);
        }, delay);
        
        this.timers.set(key, timerId);
    }

    // Set up recurring intervals
    setInterval(key, callback, interval) {
        // Clear existing interval if it exists
        this.clearInterval(key);
        
        const intervalId = setInterval(callback, interval);
        this.intervals.set(key, intervalId);
        return intervalId;
    }

    // Clear specific interval
    clearInterval(key) {
        if (this.intervals.has(key)) {
            clearInterval(this.intervals.get(key));
            this.intervals.delete(key);
        }
    }

    // Performance monitoring
    startPerformanceTimer(label) {
        const startTime = performance.now();
        return {
            end: () => {
                const duration = performance.now() - startTime;
                this.recordMetric('loadTimes', { label, duration });
                console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
                return duration;
            }
        };
    }

    // Memory usage monitoring
    checkMemoryUsage() {
        if ('memory' in performance) {
            const memory = {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
                total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576), // MB
                timestamp: Date.now()
            };
            
            this.recordMetric('memoryUsage', memory);
            return memory;
        }
        return null;
    }

    // Record performance metrics
    recordMetric(type, data) {
        if (!this.performanceMetrics[type]) {
            this.performanceMetrics[type] = [];
        }
        
        this.performanceMetrics[type].push(data);
        
        // Keep only last 100 entries to prevent memory bloat
        if (this.performanceMetrics[type].length > 100) {
            this.performanceMetrics[type] = this.performanceMetrics[type].slice(-100);
        }
    }

    // Cleanup idle resources
    cleanup() {
        // Clear old timers
        const now = Date.now();
        const expiredKeys = [];
        
        for (const [key, timestamp] of this.timers.entries()) {
            if (now - timestamp > 60000) { // 1 minute old
                expiredKeys.push(key);
            }
        }
        
        expiredKeys.forEach(key => this.timers.delete(key));
        
        // Force garbage collection if available (dev environments)
        if (window.gc) {
            window.gc();
        }
    }

    // Get performance summary
    getPerformanceReport() {
        const memory = this.checkMemoryUsage();
        const avgLoadTime = this.performanceMetrics.loadTimes.length > 0
            ? this.performanceMetrics.loadTimes.reduce((sum, metric) => sum + metric.duration, 0) / this.performanceMetrics.loadTimes.length
            : 0;

        return {
            memory,
            averageLoadTime: Math.round(avgLoadTime * 100) / 100,
            activeTimers: this.timers.size,
            activeIntervals: this.intervals.size,
            metricsCollected: {
                loadTimes: this.performanceMetrics.loadTimes.length,
                memoryChecks: this.performanceMetrics.memoryUsage.length
            }
        };
    }

    // Schedule periodic cleanup
    startPeriodicCleanup(interval = 300000) { // 5 minutes
        this.setInterval('cleanup', () => {
            this.cleanup();
            this.checkMemoryUsage();
        }, interval);
    }

    // Destroy method for cleanup
    destroy() {
        // Clear all timers
        for (const timerId of this.timers.values()) {
            if (typeof timerId === 'number') {
                clearTimeout(timerId);
            }
        }
        this.timers.clear();
        
        // Clear all intervals
        for (const intervalId of this.intervals.values()) {
            clearInterval(intervalId);
        }
        this.intervals.clear();
        
        // Clear metrics
        this.performanceMetrics = {
            loadTimes: [],
            memoryUsage: [],
            audioLatency: []
        };
        
        console.log('SystemTimer destroyed and cleaned up');
    }
}

export default SystemTimer;