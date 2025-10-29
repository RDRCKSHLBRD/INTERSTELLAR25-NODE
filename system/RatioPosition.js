/**
 * RatioPosition.js - Deterministic positioning system
 *
 * Positions elements using ratio coordinates (0-1) instead of flexbox.
 * Integrates with State.js and RatioLayoutEngine.
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

    this.positioned = new Map();

    this.metrics = {
      positionCount: 0,
      updateCount: 0,
      lastUpdateTime: 0
    };

    console.log('🎯 RatioPosition initialized');
  }

  /**
   * Position an element using ratio coordinates.
   *
   * Supported signatures:
   *   apply(element, spec, container?, viewport?)
   *   apply(element, container, spec, viewport?)
   *
   * container may be:
   *   - an Element
   *   - a string selector
   *   - an options bag: { container: Element }
   *   - omitted, in which case we use spec.relativeTo or fallbacks
   */
  apply(element, arg2, arg3, arg4 = null) {
    let el = element;
    let container = arg2;
    let spec = arg3;
    let viewport = arg4;

    // ---- Signature normalization ------------------------------------------
    const looksLikeSpec = (obj) =>
      obj &&
      typeof obj === 'object' &&
      (('x' in obj) || ('y' in obj) || ('left' in obj) || ('top' in obj) ||
       ('system' in obj) || ('anchor' in obj) || ('relativeTo' in obj));

    const looksLikeContainerRef = (v) =>
      v instanceof Element || typeof v === 'string' || (v && typeof v === 'object' && 'container' in v);

    // If caller used apply(el, spec, container)
    if (looksLikeSpec(container) && looksLikeContainerRef(spec)) {
      [spec, container] = [container, spec];
    }

    // Basic guard
    if (!el || !spec) {
      const containerId =
        container instanceof Element ? (container.id || container.className || '(element)') :
        (typeof container === 'string' ? container : 'N/A Container');
      const specSystem = spec ? (spec.system || 'cartesian') : 'N/A Spec';

      console.warn('⚠️ RatioPosition.apply: Missing element or spec. Cannot position.', {
        Container: containerId,
        ConfigSystem: specSystem,
        TargetElementMissing: !el
      });
      return;
    }

    // ---- Container normalization ------------------------------------------
    // If container is an options bag like { container: host }
    if (container && typeof container === 'object' && !(container instanceof Element)) {
      container = container.container || null;
    }

    // If container is a selector string
    if (typeof container === 'string') {
      container = document.querySelector(container) || null;
    }

    // If still missing, allow CSS selector from spec.relativeTo
    if (!container && spec.relativeTo) {
      container = document.querySelector(spec.relativeTo) || null;
    }

    // Fallbacks: offset parent → parent → body
    if (!container) {
      container = el.offsetParent || el.parentElement || document.body;
    }

    if (!(container instanceof Element)) {
      console.error('❌ RatioPosition.apply: container is not an Element.', { container, spec });
      return;
    }

    // Ensure container is positioned (so absolute children are relative to it)
    const containerStyle = getComputedStyle(container);
    if (containerStyle.position === 'static') {
      container.style.position = 'relative';
    }

    // ---- Spec normalization (aliases + anchors) ----------------------------
    const normSpec = this._normalizeSpec(spec);

    // ---- Compute & apply ---------------------------------------------------
    const rect = this._getContainerRect(container);
    const pos = this.compute(normSpec, rect, viewport, el);
    this._applyPosition(el, pos, normSpec);

    // Track for future updateAll()
    this.positioned.set(el, { container, spec: normSpec, viewport });
    this.metrics.positionCount++;

    if (this.opts.debug) {
      console.log('🎯 Positioned:', {
        element: el.id || el.className,
        container: container.id || container.className || '(container)',
        pos,
        spec: normSpec
      });
    }
  }

  /**
   * Normalize spec:
   * - map x/y → left/top (ratios)
   * - expand anchor shorthands like 't-l', 'b-c', 'c' → 'top-left', etc.
   * - preserve other fields
   */
  _normalizeSpec(spec) {
    const out = { ...spec };

    // Map x/y to left/top (if provided)
    if (out.x != null && out.left == null) out.left = out.x;
    if (out.y != null && out.top  == null) out.top  = out.y;

    // Normalize anchor
    out.anchor = this._normalizeAnchor(out.anchor || 'top-left');

    // Normalize system
    out.system = (out.system || 'cartesian').toLowerCase();

    return out;
  }

  _normalizeAnchor(anchor) {
    if (!anchor) return 'top-left';
    const a = anchor.toLowerCase().trim();

    // Accept full names
    const full = [
      'top-left','top-center','top-right',
      'middle-left','center','middle-right',
      'bottom-left','bottom-center','bottom-right'
    ];
    if (full.includes(a)) return a;

    // Shorthands
    const map = {
      't-l': 'top-left',
      't-c': 'top-center',
      't-r': 'top-right',
      'm-l': 'middle-left',
      'c'  : 'center',
      'm-r': 'middle-right',
      'b-l': 'bottom-left',
      'b-c': 'bottom-center',
      'b-r': 'bottom-right'
    };
    return map[a] || 'top-left';
  }

  /**
   * Compute position from spec
   * @param {Object} spec  normalized spec
   * @param {Object} rect  {x,y,width,height}
   * @param {Object} viewport
   * @param {HTMLElement} element
   * @returns {{x:number,y:number}}
   */
  compute(spec, rect, viewport = null, element = null) {
    const system = spec.system;

    let p;
    if (system === 'cartesian') {
      p = this._computeCartesian(spec, rect, viewport);
    } else {
      console.warn(`⚠️ System "${system}" not implemented yet. Using cartesian.`);
      p = this._computeCartesian(spec, rect, viewport);
    }

    if (element) {
      const shift = this._computeAnchorShift(spec.anchor, element);
      p.x -= shift.x;
      p.y -= shift.y;
    }

    if (spec.clamp) {
      p = this._applyClamp(p, rect, spec, element);
    }

    return p;
  }

  /**
   * Compute cartesian position (top/left ratios)
   */
  _computeCartesian(spec, rect, viewport) {
    const top  = this._resolveValue(spec.top  ?? 0, rect.height, viewport, 'height');
    const left = this._resolveValue(spec.left ?? 0, rect.width,  viewport, 'width');

    const dx = this._resolveValue(spec.dx ?? 0, rect.width,  viewport, 'width');
    const dy = this._resolveValue(spec.dy ?? 0, rect.height, viewport, 'height');

    return { x: left + dx, y: top + dy };
  }

  /**
   * Resolve value - ratio (0–1), px, vh, vw. Tolerates viewport.{width,height} or {w,h} or {vw,vh}.
   */
  _resolveValue(val, containerSize, viewport, axis) {
    const getV = (k) => {
      if (!viewport) return null;
      if (k === 'width')  return viewport.width  ?? viewport.w  ?? viewport.vw ?? null;
      if (k === 'height') return viewport.height ?? viewport.h  ?? viewport.vh ?? null;
      return null;
    };

    if (typeof val === 'number') return val * containerSize;

    if (typeof val === 'string') {
      const str = val.trim().toLowerCase();
      if (str.endsWith('px')) return parseFloat(str);

      if (str.endsWith('vh')) {
        const vh = getV('height');
        return vh ? (parseFloat(str) / 100) * vh : 0;
      }
      if (str.endsWith('vw')) {
        const vw = getV('width');
        return vw ? (parseFloat(str) / 100) * vw : 0;
      }

      const num = parseFloat(str);
      if (Number.isFinite(num)) return num * containerSize; // bare number => ratio
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
      case 'top-left':       return { x: 0,   y: 0   };
      case 'top-center':     return { x: w/2, y: 0   };
      case 'top-right':      return { x: w,   y: 0   };
      case 'middle-left':    return { x: 0,   y: h/2 };
      case 'center':         return { x: w/2, y: h/2 };
      case 'middle-right':   return { x: w,   y: h/2 };
      case 'bottom-left':    return { x: 0,   y: h   };
      case 'bottom-center':  return { x: w/2, y: h   };
      case 'bottom-right':   return { x: w,   y: h   };
      default:               return { x: 0,   y: 0   };
    }
  }

  /**
   * Clamp within container bounds
   */
  _applyClamp(pos, rect, spec, element) {
    if (!element) return pos;

    const padding = this._resolveValue(
      spec.padding ?? 0,
      Math.min(rect.width, rect.height),
      null,
      'min'
    );

    const w = element.offsetWidth  || 0;
    const h = element.offsetHeight || 0;

    const minX = padding;
    const maxX = rect.width  - padding - w;
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

    if (this.opts.roundToPixel) {
      const dpr = window.devicePixelRatio || 1;
      x = Math.round(x * dpr) / dpr;
      y = Math.round(y * dpr) / dpr;
    }

    element.style.position = 'absolute';
    element.style.left = `${x}px`;
    element.style.top  = `${y}px`;

    if (spec.styles) {
      Object.entries(spec.styles).forEach(([k, v]) => {
        element.style[k] = v;
      });
    }
  }

  /**
   * Container bounds
   */
  _getContainerRect(container) {
    const rect = container.getBoundingClientRect();
    return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
  }

  /**
   * Update all tracked elements
   */
  updateAll() {
    const start = performance.now();
    this.positioned.forEach((data, element) => {
      this.apply(element, data.container, data.spec, data.viewport);
    });
    this.metrics.updateCount++;
    this.metrics.lastUpdateTime = performance.now() - start;

    if (this.opts.debug) {
      console.log('🔄 Updated all positions:', {
        count: this.positioned.size,
        time: this.metrics.lastUpdateTime.toFixed(2) + 'ms'
      });
    }
  }

  clear(element) {
    if (!element) return;
    element.style.position = '';
    element.style.left = '';
    element.style.top = '';
    this.positioned.delete(element);
  }

  clearAll() {
    this.positioned.forEach((_, el) => this.clear(el));
    this.positioned.clear();
  }

  getMetrics() {
    return { ...this.metrics, elementCount: this.positioned.size };
  }

  getInfo(element) { return this.positioned.get(element); }

  isPositioned(element) { return this.positioned.has(element); }
}
