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
    const getV = (k) => {
      if (!viewport) return null;
      if (k === "width")  return viewport.width  ?? viewport.w  ?? viewport.vw ?? null;
      if (k === "height") return viewport.height ?? viewport.h  ?? viewport.vh ?? null;
      return null;
    };

    if (typeof val === "number") return val * containerSize;

    if (typeof val === "string") {
      const str = val.trim().toLowerCase();
      if (str.endsWith("px")) return parseFloat(str);
      if (str.endsWith("vh")) { const vh = getV("height"); return vh ? (parseFloat(str)/100)*vh : 0; }
      if (str.endsWith("vw")) { const vw = getV("width");  return vw ? (parseFloat(str)/100)*vw : 0; }
      const num = parseFloat(str);
      if (Number.isFinite(num)) return num * containerSize;
    }
    return 0;
  }

export default RatioPosition;