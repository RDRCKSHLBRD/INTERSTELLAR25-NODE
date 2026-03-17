/* ================================================================
   QUAD CONTENT - Content-Aware Scaling Engine
   V6.4.1 — Two-mode architecture

   MODE 1 — PROPORTIONAL: Album grids, heroes, cards, media.
            Scale factor = container ÷ baseSize, clamped.

   MODE 2 — CONSTRAINT-DRIVEN: Header elements, nav, icons, footer.
            Read breakpoint config directly. No scale multiplier.
            measure → clamp(min, base, max) → CSS vars.

   The footer's inner calc is the model. If an element has explicit
   per-breakpoint config in quadtree.json, those values flow straight
   through. Scale factors only apply where proportional sizing makes
   sense.

   RODUX pipeline: StateJS → RatioEngine → cssJSON → QuadTree → CSS vars
   ================================================================ */

import { QuadMath, QUAD_CONSTANTS } from './QuadMath.js';
import { QuadSpatial } from './QuadSpatial.js';
import { quadConfig } from './QuadConfig.js';


// ── Element types that use constraint mode (Mode 2) ──────────────
// These get their values directly from quadtree.json element configs.
// Everything else uses proportional scaling (Mode 1).
const CONSTRAINT_TYPES = new Set([
  'artistLink', 'brandLogo', 'headerIcon', 'navButton',
  'navigation', 'actions', 'logo', 'footer'
]);


export class QuadContent {

  // ================================================================
  // MAIN ENTRY — routes to the correct mode
  // ================================================================

  /**
   * Calculate content scale / constraints for a container.
   *
   * @param {Element}  container      DOM element
   * @param {Object}   spatialBounds  from QuadSpatial.getContainerBounds()
   * @param {Object}   options        caller overrides
   * @returns {Object} Result with cssVariables, scale, metadata
   */
  static calculateContentScale(container, spatialBounds, options = {}) {
    if (!container || !spatialBounds) {
      return this.getEmptyResult();
    }

    const containerType = this.determineContainerType(container);
    const breakpoint    = this.getCurrentBreakpoint();
    const elementId     = container.id || container.dataset.element || null;

    // ── Route: does this element have constraint config? ──────
    const elementConfig = elementId
      ? quadConfig.get(`elements.${elementId}.${breakpoint}`)
      : null;

    const useConstraintMode =
      elementConfig ||                                // explicit config exists
      CONSTRAINT_TYPES.has(containerType) ||           // known constraint type
      CONSTRAINT_TYPES.has(elementId);                 // element id is constraint type

    if (useConstraintMode) {
      return this._constraintMode(
        container, spatialBounds, containerType, breakpoint, elementId, elementConfig, options
      );
    }

    return this._proportionalMode(
      container, spatialBounds, containerType, breakpoint, elementId, options
    );
  }


  // ================================================================
  // MODE 2 — CONSTRAINT-DRIVEN
  //
  // Follows the footerQuadTree model:
  //   1. Read per-breakpoint config values
  //   2. Clamp to min/max constraints
  //   3. Write values directly as CSS vars
  //   4. No scale multiplier — the config IS the layout
  //
  // For elements that need to share space (like title vs seek bar),
  // the available-width arithmetic happens at the *caller* level
  // (footerQuadTree._computeZones, headerQuadTree, etc).
  // This method just resolves a single element's constraints.
  // ================================================================

  static _constraintMode(container, spatialBounds, containerType, breakpoint, elementId, elementConfig, options) {
    const cfg = elementConfig || {};
    const parentWidth  = spatialBounds.absolute.width;
    const parentHeight = spatialBounds.absolute.height;

    // ── Resolve base dimensions ───────────────────────────────
    // Width: use baseWidth from config, or measure from parent
    const baseW   = cfg.baseWidth  || cfg.baseSize || null;
    const minW    = cfg.minWidth   || cfg.minSize  || 0;
    const maxW    = cfg.maxWidth   || cfg.maxSize  || Infinity;
    const finalW  = baseW
      ? Math.max(minW, Math.min(maxW, baseW))
      : parentWidth;   // no config → fill parent

    // Height: use baseHeight, or derive from aspect ratio, or fill
    const baseH   = cfg.baseHeight || null;
    const minH    = cfg.minHeight  || 0;
    const maxH    = cfg.maxHeight  || Infinity;
    const finalH  = baseH
      ? Math.max(minH, Math.min(maxH, baseH))
      : (cfg.aspectRatio ? finalW / cfg.aspectRatio : parentHeight);

    // ── Responsive squeeze ────────────────────────────────────
    // If the parent is narrower than the configured width,
    // scale down proportionally (same logic as footer title).
    // This is where long titles on narrow viewports get handled.
    let squeeze = 1.0;
    if (baseW && parentWidth < baseW) {
      squeeze = parentWidth / baseW;
    }

    const displayW = Math.max(minW, Math.floor(finalW * squeeze));
    const displayH = Math.max(minH, Math.floor(finalH * squeeze));

    // ── Font size ─────────────────────────────────────────────
    // Config fontSize is authoritative. If squeezing, scale it
    // down but floor at 11px for readability.
    const baseFontSize = cfg.fontSize || null;
    const displayFontSize = baseFontSize
      ? Math.max(11, Math.round(baseFontSize * squeeze))
      : null;

    // ── CSS variables ─────────────────────────────────────────
    const cssVariables = {
      // Core geometry
      '--qt-width':      `${displayW}px`,
      '--qt-height':     `${displayH}px`,
      '--qt-scale':      squeeze.toFixed(3),
      '--qt-breakpoint': `"${breakpoint}"`,
      '--qt-mode':       '"constraint"',

      // Element-specific (only set if config provides them)
      ...(displayFontSize  && { '--qt-font-size': `${displayFontSize}px` }),
      ...(cfg.padding      && { '--qt-padding':   `${Math.round(cfg.padding * squeeze)}px` }),
      ...(cfg.gap          && { '--qt-gap':       `${Math.round(cfg.gap * squeeze)}px` }),
      ...(minW             && { '--qt-min-width':  `${minW}px` }),
      ...(maxW < Infinity  && { '--qt-max-width':  `${maxW}px` }),
      ...(minH             && { '--qt-min-height': `${minH}px` }),
      ...(maxH < Infinity  && { '--qt-max-height': `${maxH}px` }),
    };

    return {
      mode: 'constraint',
      scale: squeeze,
      baseSize: baseW || finalW,
      displayWidth: displayW,
      displayHeight: displayH,
      displayFontSize,
      squeeze,
      elementId,
      elementConfig: cfg,
      containerType,
      breakpoint,
      isLandscape: window.innerWidth > window.innerHeight,
      cssVariables,
      spatialData: {
        aspect:     spatialBounds.math.aspect,
        area:       spatialBounds.math.area,
        visibility: spatialBounds.viewport.visibilityRatio,
        parentWidth,
        parentHeight,
      },
    };
  }


  // ================================================================
  // MODE 1 — PROPORTIONAL
  //
  // For containers where content scales with the container:
  // album grids, hero sections, cards, media blocks.
  //
  // Scale = container dimension ÷ baseSize, clamped to [min, max].
  // Single multiplier — no stacked heuristics.
  // ================================================================

  static _proportionalMode(container, spatialBounds, containerType, breakpoint, elementId, options) {
    const isLandscape = window.innerWidth > window.innerHeight;

    // ── Resolve baseSize from config ──────────────────────────
    let baseSize = null;

    // Try element-specific config first
    if (elementId) {
      const cfg = quadConfig.get(`elements.${elementId}.${breakpoint}`);
      if (cfg) baseSize = cfg.baseWidth || cfg.baseHeight || cfg.baseSize;
    }

    // Fallback: baseSizes.{type}.{breakpoint}
    if (!baseSize) {
      baseSize = quadConfig.get(`baseSizes.${containerType}.${breakpoint}`);
    }

    // Fallback: simplified breakpoint (desktop-lg → desktop)
    if (!baseSize && breakpoint.includes('-')) {
      const simple = breakpoint.split('-')[0];
      baseSize = quadConfig.get(`baseSizes.${containerType}.${simple}`);
    }

    // Fallback: global default
    if (!baseSize) {
      baseSize = quadConfig.get('scaling.baseSize') || 100;
    }

    // ── Scale constraints ─────────────────────────────────────
    const minScale = options.minScale || quadConfig.get('scaleConstraints.min') || 0.5;
    const maxScale = options.maxScale || quadConfig.get('scaleConstraints.max') || 3.0;
    const aspectRatio = options.aspectRatio || quadConfig.get('scaling.aspectRatio') || QUAD_CONSTANTS.ASPECT_16_9;

    // ── Calculate scale ───────────────────────────────────────
    const baseScale = QuadMath.calculateScale(
      spatialBounds.absolute.width,
      spatialBounds.absolute.height,
      baseSize,
      aspectRatio
    );

    const finalScale = QuadMath.clamp(baseScale, minScale, maxScale);

    // ── CSS variables ─────────────────────────────────────────
    const scaledSize = finalScale * 100;
    const cssVariables = {
      '--qt-scale':         finalScale.toFixed(3),
      '--qt-size':          `${scaledSize.toFixed(1)}px`,
      '--qt-width':         `${spatialBounds.absolute.width}px`,
      '--qt-height':        `${spatialBounds.absolute.height}px`,
      '--qt-aspect':        spatialBounds.math.aspect.toFixed(3),
      '--qt-breakpoint':    `"${breakpoint}"`,
      '--qt-mode':          '"proportional"',
      '--qt-font-size':     `clamp(0.8rem, ${(finalScale * 1).toFixed(2)}rem, 2rem)`,
      '--qt-spacing':       `clamp(0.5rem, ${(finalScale * 1.5).toFixed(2)}rem, 3rem)`,
      '--qt-border-radius': `clamp(4px, ${(finalScale * 8).toFixed(1)}px, 16px)`,
      '--qt-grid-gap':      `clamp(8px, ${(finalScale * 16).toFixed(1)}px, 32px)`,
      '--qt-padding':       `clamp(12px, ${(finalScale * 24).toFixed(1)}px, 48px)`,
      '--qt-margin':        `clamp(8px, ${(finalScale * 16).toFixed(1)}px, 32px)`,
    };

    return {
      mode: 'proportional',
      scale: finalScale,
      baseScale,
      baseSize,
      elementId,
      elementConfig: null,
      containerType,
      breakpoint,
      isLandscape,
      cssVariables,
      spatialData: {
        aspect:     spatialBounds.math.aspect,
        area:       spatialBounds.math.area,
        visibility: spatialBounds.viewport.visibilityRatio,
      },
    };
  }


  // ================================================================
  // CONTAINER TYPE DETECTION
  // ================================================================

  static determineContainerType(container) {
    // Explicit element type from data attribute (preferred)
    if (container.dataset.element) return container.dataset.element;

    // Class-based detection
    const cl = container.classList;
    if (cl.contains('qt-hero'))                return 'hero';
    if (cl.contains('qt-card'))                return 'card';
    if (cl.contains('qt-grid'))                return 'grid';
    if (cl.contains('qt-text'))                return 'text';
    if (cl.contains('qt-media'))               return 'media';
    if (cl.contains('qt-nav'))                 return 'navigation';
    if (cl.contains('header-logo'))            return 'brandLogo';
    if (cl.contains('header-icon-button'))     return 'headerIcon';
    if (cl.contains('header-actions-section')) return 'actions';

    // Auto-detect from content
    const hasImages   = container.querySelectorAll('img, video').length > 0;
    const hasText     = container.textContent.trim().length > 50;
    const hasChildren = container.children.length > 3;

    if (hasChildren) return 'grid';
    if (hasImages)   return 'media';
    if (hasText)     return 'text';

    return 'generic';
  }

  static getCurrentBreakpoint() {
    return document.documentElement.dataset.breakpoint || 'desktop';
  }


  // ================================================================
  // CSS VARIABLE APPLICATION
  // ================================================================

  static applyCSSVariables(container, cssVariables) {
    if (!container || !cssVariables) return;

    Object.entries(cssVariables).forEach(([prop, value]) => {
      container.style.setProperty(prop, value);
    });

    container.classList.add('qt-container');
  }


  // ================================================================
  // MULTI-ITEM LAYOUT
  //
  // For grids of items within a container. Uses QuadSpatial
  // for grid geometry, then applies proportional scaling to each cell.
  // ================================================================

  static calculateContentLayout(container, items = [], options = {}) {
    const spatialBounds = QuadSpatial.getContainerBounds(container);
    if (!spatialBounds || items.length === 0) {
      return this.getEmptyLayoutResult();
    }

    const gridLayout = QuadSpatial.calculateGridLayout(
      items,
      spatialBounds.absolute,
      options
    );

    const itemScales = items.map((item, index) => {
      const position = gridLayout.positions[index];
      const itemBounds = {
        absolute: position,
        math: {
          aspect: position.width / position.height,
          area:   position.width * position.height,
        },
        viewport: { visibilityRatio: 1 },
      };
      return this.calculateContentScale(item, itemBounds, {
        ...options,
        baseSize: Math.min(position.width, position.height) * 0.8,
      });
    });

    return {
      subdivision: gridLayout.grid,
      positions:   gridLayout.positions,
      itemScales,
      containerScale: this.calculateContentScale(container, spatialBounds, options),
      performance: {
        itemCount:   items.length,
        efficiency:  gridLayout.grid.efficiency,
        utilization: gridLayout.grid.utilization,
      },
    };
  }


  // ================================================================
  // CONTENT ANALYSIS (unchanged — still useful for diagnostics)
  // ================================================================

  static analyzeContentComplexity(container) {
    const textLength = container.textContent.trim().length;
    const imageCount = container.querySelectorAll('img, video, svg').length;
    const linkCount  = container.querySelectorAll('a, button').length;
    const childCount = container.children.length;

    const textComplexity        = Math.min(textLength / 1000, 1);
    const mediaComplexity       = Math.min(imageCount / 5, 1);
    const interactionComplexity = Math.min(linkCount / 10, 1);
    const structureComplexity   = Math.min(childCount / 20, 1);

    const overall = (
      textComplexity * 0.3 +
      mediaComplexity * 0.3 +
      interactionComplexity * 0.2 +
      structureComplexity * 0.2
    );

    return {
      overall,
      text:        textComplexity,
      media:       mediaComplexity,
      interaction: interactionComplexity,
      structure:   structureComplexity,
      category:    overall > 0.7 ? 'complex' : overall > 0.3 ? 'moderate' : 'simple',
    };
  }


  // ================================================================
  // EMPTY / FALLBACK RESULTS
  // ================================================================

  static getEmptyResult() {
    return {
      mode: 'proportional',
      scale: 1.0,
      baseScale: 1.0,
      containerType: 'unknown',
      breakpoint: 'desktop',
      cssVariables: {
        '--qt-scale': '1.000',
        '--qt-size':  '100px',
        '--qt-mode':  '"proportional"',
      },
      spatialData: { aspect: 1.0, area: 0, visibility: 0 },
    };
  }

  static getEmptyLayoutResult() {
    return {
      subdivision:    null,
      positions:      [],
      itemScales:     [],
      containerScale: this.getEmptyResult(),
      performance:    { itemCount: 0, efficiency: 0, utilization: 0 },
    };
  }
}

console.log('🎯 QuadContent v6.4.1 loaded — two-mode scaling engine (constraint + proportional)');