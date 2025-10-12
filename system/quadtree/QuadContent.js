/* ================================================================
   QUAD CONTENT - Content-Aware Scaling Engine
   Scales content intelligently within spatial constraints
   ================================================================ */

import { QuadMath, QUAD_CONSTANTS } from './QuadMath.js';
import { QuadSpatial } from './QuadSpatial.js';
import { quadConfig } from './QuadConfig.js';

export class QuadContent {
  /**
   * Calculate content scale for container
   * @param {Element} container 
   * @param {Object} spatialBounds 
   * @param {Object} options 
   * @returns {Object} Content scaling result
   */




  // Replace the calculateContentScale method in QuadContent.js with this:

static calculateContentScale(container, spatialBounds, options = {}) {
  if (!container || !spatialBounds) {
    return this.getEmptyResult();
  }
  
  // Determine container type and breakpoint FIRST
  const containerType = this.determineContainerType(container);
  const breakpoint = this.getCurrentBreakpoint();
  const isLandscape = window.innerWidth > window.innerHeight;
  
  // Get container-specific base size with complete fallback chain
  let baseSize = null;
  
  // 1. Try container-specific size for current breakpoint
  baseSize = quadConfig.get(`baseSizes.${containerType}.${breakpoint}`);
  
  // 2. If not found, try fallback container types
  if (!baseSize) {
    const fallbackTypes = {
      'media': 'header',      // Logo falls back to header
      'navigation': 'header', // Nav falls back to header  
      'generic': 'content'    // Generic falls back to content
    };
    
    const fallbackType = fallbackTypes[containerType];
    if (fallbackType) {
      baseSize = quadConfig.get(`baseSizes.${fallbackType}.${breakpoint}`);
    }
  }
  
  // 3. Final fallback to scaling.baseSize or 100
  if (!baseSize) {
    baseSize = quadConfig.get('scaling.baseSize') || 100;
  }
  
  // Apply landscape multiplier if in landscape mode
  if (isLandscape && breakpoint !== 'desktop') {
    const landscapeMultiplier = quadConfig.get(`breakpointOverrides.${breakpoint}.landscapeMultiplier`) || 1.0;
    baseSize = baseSize * landscapeMultiplier;
  }
  
  // Debug logging for development
  if (quadConfig.get('debug.enabled')) {
    console.log(`📐 ${containerType} (${breakpoint}${isLandscape ? ' landscape' : ''}): baseSize=${baseSize}`);
  }
  
  const {
    minScale = quadConfig.get('scaleConstraints.min') || quadConfig.get('scaling.minScale') || 0.5,
    maxScale = quadConfig.get('scaleConstraints.max') || quadConfig.get('scaling.maxScale') || 3.0,
    aspectRatio = quadConfig.get('scaling.aspectRatio') || QUAD_CONSTANTS.ASPECT_16_9,
    contentType = 'auto'
  } = options;
  
  // Calculate base scale from spatial bounds
  const baseScale = QuadMath.calculateScale(
    spatialBounds.absolute.width,
    spatialBounds.absolute.height,
    baseSize,
    aspectRatio
  );
  
  // Apply content-specific adjustments
  const contentAdjustment = this.calculateContentAdjustment(
    container, 
    containerType, 
    breakpoint, 
    contentType
  );
  
  // Calculate final scale with constraints
  const finalScale = QuadMath.clamp(
    baseScale * contentAdjustment.multiplier,
    minScale,
    maxScale
  );
  
  // Generate CSS variables
  const cssVariables = this.generateCSSVariables(
    finalScale,
    spatialBounds,
    contentAdjustment,
    breakpoint
  );
  
  return {
    scale: finalScale,
    baseScale: baseScale,
    baseSize: baseSize,           // Include the resolved base size
    adjustment: contentAdjustment,
    containerType: containerType,
    breakpoint: breakpoint,
    isLandscape: isLandscape,     // Include orientation info
    cssVariables: cssVariables,
    spatialData: {
      aspect: spatialBounds.math.aspect,
      area: spatialBounds.math.area,
      visibility: spatialBounds.viewport.visibilityRatio
    }
  };
}

  // In QuadContent.js, update determineContainerType method:
static determineContainerType(container) {
  const classList = container.classList;
  
  if (classList.contains('qt-hero')) return 'hero';
  if (classList.contains('qt-card')) return 'card';
  if (classList.contains('qt-grid')) return 'grid';
  if (classList.contains('qt-text')) return 'text';
  if (classList.contains('qt-media')) return 'media';
  if (classList.contains('qt-nav')) return 'navigation';
  
  // ADD THESE LINES:
  if (classList.contains('header-icon-button')) return 'actions';
  if (classList.contains('header-actions-section')) return 'actions';
  if (classList.contains('mathematical-icon')) return 'actions';
  
  // Auto-detect based on content (existing code...)
  const hasImages = container.querySelectorAll('img, video').length > 0;
  const hasText = container.textContent.trim().length > 50;
  const hasMultipleChildren = container.children.length > 3;
  
  if (hasMultipleChildren) return 'grid';
  if (hasImages) return 'media';
  if (hasText) return 'text';
  
  return 'generic';
}

  /**
   * Get current breakpoint
   * @returns {string} Current breakpoint
   */
  static getCurrentBreakpoint() {
    return document.documentElement.dataset.breakpoint || 'desktop';
  }

  /**
   * Calculate content-specific adjustments
   * @param {Element} container 
   * @param {string} containerType 
   * @param {string} breakpoint 
   * @param {string} contentType 
   * @returns {Object} Content adjustment data
   */
  static calculateContentAdjustment(container, containerType, breakpoint, contentType) {
    let multiplier = 1.0;
    const adjustments = [];
    
    // Container type adjustments
    switch (containerType) {
      case 'hero':
        multiplier *= 1.2; // Heroes need to be prominent
        adjustments.push('hero-boost');
        break;
      case 'card':
        multiplier *= 0.9; // Cards should be compact
        adjustments.push('card-compact');
        break;
      case 'text':
        multiplier *= 0.8; // Text needs to be readable, not huge
        adjustments.push('text-readable');
        break;
      case 'media':
        multiplier *= 1.1; // Media should be engaging
        adjustments.push('media-engaging');
        break;
      case 'navigation':
        multiplier *= 0.7; // Navigation should be subtle
        adjustments.push('nav-subtle');
        break;
    }
    
    // Breakpoint adjustments
    switch (breakpoint) {
      case 'mobile':
        multiplier *= 0.8; // Smaller on mobile
        adjustments.push('mobile-compact');
        break;
      case 'tablet':
        multiplier *= 0.9; // Slightly smaller on tablet
        adjustments.push('tablet-optimized');
        break;
      case 'desktop':
        // No adjustment for desktop (baseline)
        break;
    }
    
    // Content density adjustment
    const children = container.children.length;
    if (children > 5) {
      multiplier *= 0.85; // Dense content scales down
      adjustments.push('dense-content');
    } else if (children === 1) {
      multiplier *= 1.1; // Single content item can be larger
      adjustments.push('single-content');
    }
    
    // Viewport visibility adjustment
    const rect = container.getBoundingClientRect();
    const visibility = QuadSpatial.calculateVisibilityRatio(rect);
    if (visibility < 0.5) {
      multiplier *= 0.9; // Partially visible content scales down
      adjustments.push('partial-visibility');
    }
    
    return {
      multiplier: QuadMath.round(multiplier, 0.01),
      adjustments: adjustments,
      reasoning: this.generateReasoningText(adjustments, multiplier)
    };
  }

  /**
   * Generate CSS variables for scaling
   * @param {number} scale 
   * @param {Object} spatialBounds 
   * @param {Object} adjustment 
   * @param {string} breakpoint 
   * @returns {Object} CSS variables
   */
  static generateCSSVariables(scale, spatialBounds, adjustment, breakpoint) {
    const scaledSize = scale * 100; // Base 100px
    
    return {
      '--qt-scale': scale.toFixed(3),
      '--qt-size': `${scaledSize.toFixed(1)}px`,
      '--qt-width': `${spatialBounds.absolute.width}px`,
      '--qt-height': `${spatialBounds.absolute.height}px`,
      '--qt-aspect': spatialBounds.math.aspect.toFixed(3),
      '--qt-breakpoint': `"${breakpoint}"`,
      '--qt-adjustment': adjustment.multiplier.toFixed(3),
      
      // Responsive scaling
      '--qt-font-size': `clamp(0.8rem, ${(scale * 1).toFixed(2)}rem, 2rem)`,
      '--qt-spacing': `clamp(0.5rem, ${(scale * 1.5).toFixed(2)}rem, 3rem)`,
      '--qt-border-radius': `clamp(4px, ${(scale * 8).toFixed(1)}px, 16px)`,
      
      // Layout helpers
      '--qt-grid-gap': `clamp(8px, ${(scale * 16).toFixed(1)}px, 32px)`,
      '--qt-padding': `clamp(12px, ${(scale * 24).toFixed(1)}px, 48px)`,
      '--qt-margin': `clamp(8px, ${(scale * 16).toFixed(1)}px, 32px)`
    };
  }

  /**
   * Apply CSS variables to container
   * @param {Element} container 
   * @param {Object} cssVariables 
   */
  static applyCSSVariables(container, cssVariables) {
    if (!container || !cssVariables) return;
    
    Object.entries(cssVariables).forEach(([property, value]) => {
      container.style.setProperty(property, value);
    });
    
    // Add QuadTree class for styling
    container.classList.add('qt-container');
  }

  /**
   * Calculate layout for multiple content items
   * @param {Element} container 
   * @param {Array} items 
   * @param {Object} options 
   * @returns {Object} Multi-item layout result
   */
  static calculateContentLayout(container, items = [], options = {}) {
    const spatialBounds = QuadSpatial.getContainerBounds(container);
    if (!spatialBounds || items.length === 0) {
      return this.getEmptyLayoutResult();
    }
    
    // Calculate grid layout
    const gridLayout = QuadSpatial.calculateGridLayout(
      items,
      spatialBounds.absolute,
      options
    );
    
    // Calculate individual item scales
    const itemScales = items.map((item, index) => {
      const position = gridLayout.positions[index];
      const itemOptions = {
        ...options,
        baseSize: Math.min(position.width, position.height) * 0.8
      };
      
      return this.calculateContentScale(item, {
        absolute: position,
        math: {
          aspect: position.width / position.height,
          area: position.width * position.height
        }
      }, itemOptions);
    });
    
    return {
      subdivision: gridLayout.grid,
      positions: gridLayout.positions,
      itemScales: itemScales,
      containerScale: this.calculateContentScale(container, spatialBounds, options),
      performance: {
        itemCount: items.length,
        efficiency: gridLayout.grid.efficiency,
        utilization: gridLayout.grid.utilization
      }
    };
  }

  /**
   * Generate reasoning text for adjustments
   * @param {Array} adjustments 
   * @param {number} multiplier 
   * @returns {string} Reasoning text
   */
  static generateReasoningText(adjustments, multiplier) {
    if (adjustments.length === 0) return 'No adjustments applied';
    
    const direction = multiplier > 1 ? 'increased' : multiplier < 1 ? 'decreased' : 'maintained';
    return `Scale ${direction} (${multiplier.toFixed(2)}x) due to: ${adjustments.join(', ')}`;
  }

  /**
   * Get empty result for error cases
   * @returns {Object} Empty result
   */
  static getEmptyResult() {
    return {
      scale: 1.0,
      baseScale: 1.0,
      adjustment: { multiplier: 1.0, adjustments: [], reasoning: 'No calculation performed' },
      containerType: 'unknown',
      breakpoint: 'desktop',
      cssVariables: {
        '--qt-scale': '1.000',
        '--qt-size': '100px'
      },
      spatialData: {
        aspect: 1.0,
        area: 0,
        visibility: 0
      }
    };
  }

  /**
   * Get empty layout result for error cases
   * @returns {Object} Empty layout result
   */
  static getEmptyLayoutResult() {
    return {
      subdivision: null,
      positions: [],
      itemScales: [],
      containerScale: this.getEmptyResult(),
      performance: {
        itemCount: 0,
        efficiency: 0,
        utilization: 0
      }
    };
  }

  /**
   * Analyze content complexity
   * @param {Element} container 
   * @returns {Object} Complexity analysis
   */
  static analyzeContentComplexity(container) {
    const textLength = container.textContent.trim().length;
    const imageCount = container.querySelectorAll('img, video, svg').length;
    const linkCount = container.querySelectorAll('a, button').length;
    const childCount = container.children.length;
    
    // Calculate complexity score (0-1)
    const textComplexity = Math.min(textLength / 1000, 1);
    const mediaComplexity = Math.min(imageCount / 5, 1);
    const interactionComplexity = Math.min(linkCount / 10, 1);
    const structureComplexity = Math.min(childCount / 20, 1);
    
    const overallComplexity = (
      textComplexity * 0.3 +
      mediaComplexity * 0.3 +
      interactionComplexity * 0.2 +
      structureComplexity * 0.2
    );
    
    return {
      overall: overallComplexity,
      text: textComplexity,
      media: mediaComplexity,
      interaction: interactionComplexity,
      structure: structureComplexity,
      category: overallComplexity > 0.7 ? 'complex' : 
                overallComplexity > 0.3 ? 'moderate' : 'simple'
    };
  }

  /**
   * Calculate optimal font scaling
   * @param {number} baseScale 
   * @param {string} containerType 
   * @param {Object} complexity 
   * @returns {Object} Font scaling data
   */
  static calculateFontScaling(baseScale, containerType, complexity) {
    let fontMultiplier = 1.0;
    
    // Adjust based on container type
    switch (containerType) {
      case 'hero': fontMultiplier = 1.5; break;
      case 'text': fontMultiplier = 1.0; break;
      case 'card': fontMultiplier = 0.9; break;
      case 'navigation': fontMultiplier = 0.8; break;
    }
    
    // Adjust based on complexity
    if (complexity.category === 'complex') {
      fontMultiplier *= 0.9; // Smaller fonts for dense content
    } else if (complexity.category === 'simple') {
      fontMultiplier *= 1.1; // Larger fonts for simple content
    }
    
    const finalFontScale = baseScale * fontMultiplier;
    
    return {
      scale: finalFontScale,
      multiplier: fontMultiplier,
      baseFontSize: `${(finalFontScale * 16).toFixed(1)}px`,
      headingScale: finalFontScale * 1.5,
      smallScale: finalFontScale * 0.8
    };
  }
}

console.log('🎯 QuadContent v1.0 loaded - Content-aware scaling engine ready');