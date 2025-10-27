/**
 * RatioPosition.js - Deterministic positioning system
 * 
 * Positions elements using ratio coordinates (0-1) instead of flexbox
 * Integrates with State.js and RatioLayoutEngine
 * 
 * Phase 1: Simple cartesian positioning only
 * Future: polar, bezier, centered coordinates
 */

export class RatioPosition {
  constructor(options = {}) {
    this.opts = {
      debug: options.debug || false,
      useCSSTransform: options.useCSSTransform !== false,
      roundToPixel: options.roundToPixel !== false
    };
    
    // Track positioned elements for updates
    this.positioned = new Map();
    
    // Performance metrics
    this.metrics = {
      positionCount: 0,
      updateCount: 0,
      lastUpdateTime: 0
    };
    
    console.log('🎯 RatioPosition initialized');
  }

  /**
   * Position an element using ratio coordinates
   * @param {HTMLElement} element - Element to position
   * @param {HTMLElement|string} container - Container element or selector
   * @param {Object} spec - Position specification
   * @param {Object} viewport - Optional viewport info from State.js
   */
  apply(element, container, spec, viewport = null) {
    if (!element || !spec) {
      console.warn('⚠️ RatioPosition.apply: Missing element or spec');
      return;
    }

    // Resolve container
    const containerEl = typeof container === 'string' 
      ? document.querySelector(container)
      : container;
    
    if (!containerEl) {
      console.warn('⚠️ RatioPosition.apply: Container not found');
      return;
    }

    // Ensure container is positioned
    const containerStyle = getComputedStyle(containerEl);
    if (containerStyle.position === 'static') {
      containerEl.style.position = 'relative';
    }

    // Compute position
    const rect = this._getContainerRect(containerEl);
    const pos = this.compute(spec, rect, viewport, element);

    // Apply positioning
    this._applyPosition(element, pos, spec);

    // Store for updates
    this.positioned.set(element, {
      container: containerEl,
      spec,
      viewport
    });

    this.metrics.positionCount++;

    if (this.opts.debug) {
      console.log('🎯 Positioned:', {
        element: element.id || element.className,
        pos,
        spec
      });
    }
  }

  /**
   * Compute position from spec
   * @param {Object} spec - Position specification
   * @param {Object} rect - Container rect {x, y, width, height}
   * @param {Object} viewport - Viewport info (optional)
   * @param {HTMLElement} element - Element being positioned (for anchor)
   * @returns {Object} {x, y} in pixels
   */
  compute(spec, rect, viewport = null, element = null) {
    const system = (spec.system || 'cartesian').toLowerCase();
    const anchor = (spec.anchor || 'top-left').toLowerCase();
    
    let p = { x: 0, y: 0 };

    // Phase 1: Only cartesian for now
    if (system === 'cartesian') {
      p = this._computeCartesian(spec, rect, viewport);
    } else {
      console.warn(`⚠️ System "${system}" not implemented yet. Using cartesian.`);
      p = this._computeCartesian(spec, rect, viewport);
    }

    // Apply anchor offset if element provided
    if (element) {
      const shift = this._computeAnchorShift(anchor, element);
      p.x -= shift.x;
      p.y -= shift.y;
    }

    // Apply clamping if requested
    if (spec.clamp) {
      p = this._applyClamp(p, rect, spec, element);
    }

    return p;
  }

  /**
   * Compute cartesian position (top/left ratios)
   */
  _computeCartesian(spec, rect, viewport) {
    // Get top/left values (default to 0)
    const top = this._resolveValue(spec.top ?? 0, rect.height, viewport, 'height');
    const left = this._resolveValue(spec.left ?? 0, rect.width, viewport, 'width');

    // Apply optional dx/dy offsets
    const dx = this._resolveValue(spec.dx ?? 0, rect.width, viewport, 'width');
    const dy = this._resolveValue(spec.dy ?? 0, rect.height, viewport, 'height');

    // Return CONTAINER-RELATIVE position (not viewport-absolute)
    // For transform: use relative offsets
    // For absolute: add rect.x/rect.y later
    return {
      x: left + dx,
      y: top + dy
    };
  }

  /**
   * Resolve value - can be ratio (0-1), px, vh, vw
   */
  _resolveValue(val, containerSize, viewport, axis) {
    // Number: treat as ratio of container
    if (typeof val === 'number') {
      return val * containerSize;
    }

    // String: parse units
    if (typeof val === 'string') {
      const str = val.trim().toLowerCase();
      
      if (str.endsWith('px')) {
        return parseFloat(str);
      }
      
      if (str.endsWith('vh') && viewport) {
        return (parseFloat(str) / 100) * viewport.h;
      }
      
      if (str.endsWith('vw') && viewport) {
        return (parseFloat(str) / 100) * viewport.w;
      }

      // Try parsing as number (ratio)
      const num = parseFloat(str);
      if (Number.isFinite(num)) {
        return num * containerSize;
      }
    }

    return 0;
  }

  /**
   * Compute anchor shift - offset element by its own size
   */
  _computeAnchorShift(anchor, element) {
    const w = element.offsetWidth || 0;
    const h = element.offsetHeight || 0;

    switch (anchor) {
      case 'top-left':
        return { x: 0, y: 0 };
      case 'top-center':
        return { x: w / 2, y: 0 };
      case 'top-right':
        return { x: w, y: 0 };
      case 'middle-left':
        return { x: 0, y: h / 2 };
      case 'center':
        return { x: w / 2, y: h / 2 };
      case 'middle-right':
        return { x: w, y: h / 2 };
      case 'bottom-left':
        return { x: 0, y: h };
      case 'bottom-center':
        return { x: w / 2, y: h };
      case 'bottom-right':
        return { x: w, y: h };
      default:
        return { x: 0, y: 0 };
    }
  }

  /**
   * Apply clamping to keep element within container bounds
   */
  _applyClamp(pos, rect, spec, element) {
    if (!element) return pos;

    // Get padding
    const padding = this._resolveValue(
      spec.padding ?? 0,
      Math.min(rect.width, rect.height),
      null,
      'min'
    );

    // Get element size
    const w = element.offsetWidth || 0;
    const h = element.offsetHeight || 0;

    // Clamp within container bounds (container-relative, so 0,0 is top-left of container)
    const minX = padding;
    const maxX = rect.width - padding - w;
    const minY = padding;
    const maxY = rect.height - padding - h;

    return {
      x: Math.max(minX, Math.min(maxX, pos.x)),
      y: Math.max(minY, Math.min(maxY, pos.y))
    };
  }

  /**
   * Apply computed position to element
   */
  _applyPosition(element, pos, spec) {
    let { x, y } = pos;

    // Round to pixel if enabled
    if (this.opts.roundToPixel) {
      const dpr = window.devicePixelRatio || 1;
      x = Math.round(x * dpr) / dpr;
      y = Math.round(y * dpr) / dpr;
    }

    // Use absolute positioning within container (not transform)
    // This way coordinates are relative to container, not viewport
    element.style.position = 'absolute';
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;

    // Apply optional styles from spec
    if (spec.styles) {
      Object.entries(spec.styles).forEach(([key, value]) => {
        element.style[key] = value;
      });
    }
  }

  /**
   * Get container bounding rect
   */
  _getContainerRect(container) {
    const rect = container.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };
  }

  /**
   * Update all positioned elements (call on resize)
   */
  updateAll() {
    const startTime = performance.now();
    
    this.positioned.forEach((data, element) => {
      this.apply(element, data.container, data.spec, data.viewport);
    });

    this.metrics.updateCount++;
    this.metrics.lastUpdateTime = performance.now() - startTime;

    if (this.opts.debug) {
      console.log('🔄 Updated all positions:', {
        count: this.positioned.size,
        time: this.metrics.lastUpdateTime.toFixed(2) + 'ms'
      });
    }
  }

  /**
   * Remove positioning from element
   */
  clear(element) {
    if (!element) return;

    element.style.position = '';
    element.style.left = '';
    element.style.top = '';

    this.positioned.delete(element);
  }

  /**
   * Clear all positioned elements
   */
  clearAll() {
    this.positioned.forEach((_, element) => this.clear(element));
    this.positioned.clear();
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      elementCount: this.positioned.size
    };
  }

  /**
   * Get info about positioned element
   */
  getInfo(element) {
    return this.positioned.get(element);
  }

  /**
   * Check if element is positioned
   */
  isPositioned(element) {
    return this.positioned.has(element);
  }
}

export default RatioPosition;