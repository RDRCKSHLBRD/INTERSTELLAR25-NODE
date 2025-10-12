/* ================================================================
   QUAD SPATIAL - Spatial Relationship Calculations
   Calculates how containers relate to each other spatially
   ================================================================ */

import { QuadMath, QUAD_CONSTANTS } from './QuadMath.js';
import { quadConfig } from './QuadConfig.js';

export class QuadSpatial {
  /**
   * Get container bounds and spatial context
   * @param {Element} container 
   * @returns {Object} Spatial bounds and relationships
   */
  static getContainerBounds(container) {
    if (!container) return null;
    
    const rect = container.getBoundingClientRect();
    const computedStyle = getComputedStyle(container);
    const parentRect = container.parentElement?.getBoundingClientRect();
    
    return {
      // Absolute positioning
      absolute: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom
      },
      
      // Relative to parent
      relative: parentRect ? {
        x: rect.left - parentRect.left,
        y: rect.top - parentRect.top,
        width: rect.width,
        height: rect.height,
        widthRatio: rect.width / parentRect.width,
        heightRatio: rect.height / parentRect.height
      } : null,
      
      // CSS computed values
      computed: {
        padding: {
          top: parseFloat(computedStyle.paddingTop),
          right: parseFloat(computedStyle.paddingRight),
          bottom: parseFloat(computedStyle.paddingBottom),
          left: parseFloat(computedStyle.paddingLeft)
        },
        margin: {
          top: parseFloat(computedStyle.marginTop),
          right: parseFloat(computedStyle.marginRight),
          bottom: parseFloat(computedStyle.marginBottom),
          left: parseFloat(computedStyle.marginLeft)
        },
        border: {
          top: parseFloat(computedStyle.borderTopWidth),
          right: parseFloat(computedStyle.borderRightWidth),
          bottom: parseFloat(computedStyle.borderBottomWidth),
          left: parseFloat(computedStyle.borderLeftWidth)
        }
      },
      
      // Mathematical properties
      math: {
        aspect: rect.width / rect.height,
        area: rect.width * rect.height,
        diagonal: QuadMath.distance({x: 0, y: 0}, {x: rect.width, y: rect.height}),
        center: {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        }
      },
      
      // Viewport relationships
      viewport: {
        widthPercent: (rect.width / window.innerWidth) * 100,
        heightPercent: (rect.height / window.innerHeight) * 100,
        visibilityRatio: this.calculateVisibilityRatio(rect)
      }
    };
  }

  /**
   * Calculate how much of container is visible in viewport
   * @param {DOMRect} rect 
   * @returns {number} Visibility ratio (0-1)
   */
  static calculateVisibilityRatio(rect) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate intersection with viewport
    const intersectionLeft = Math.max(0, rect.left);
    const intersectionTop = Math.max(0, rect.top);
    const intersectionRight = Math.min(viewportWidth, rect.right);
    const intersectionBottom = Math.min(viewportHeight, rect.bottom);
    
    if (intersectionRight <= intersectionLeft || intersectionBottom <= intersectionTop) {
      return 0; // No intersection
    }
    
    const intersectionArea = (intersectionRight - intersectionLeft) * (intersectionBottom - intersectionTop);
    const containerArea = rect.width * rect.height;
    
    return containerArea > 0 ? intersectionArea / containerArea : 0;
  }

  /**
   * Calculate spatial relationship between two containers
   * @param {Element} container1 
   * @param {Element} container2 
   * @returns {Object} Spatial relationship data
   */
  static calculateRelationship(container1, container2) {
    const bounds1 = this.getContainerBounds(container1);
    const bounds2 = this.getContainerBounds(container2);
    
    if (!bounds1 || !bounds2) return null;
    
    const center1 = bounds1.math.center;
    const center2 = bounds2.math.center;
    const distance = QuadMath.distance(center1, center2);
    
    return {
      distance: distance,
      angle: Math.atan2(center2.y - center1.y, center2.x - center1.x),
      overlap: this.calculateOverlap(bounds1.absolute, bounds2.absolute),
      adjacency: this.calculateAdjacency(bounds1.absolute, bounds2.absolute),
      sizeRatio: bounds1.math.area / bounds2.math.area
    };
  }

  /**
   * Calculate overlap between two rectangles
   * @param {Object} rect1 
   * @param {Object} rect2 
   * @returns {Object} Overlap information
   */
  static calculateOverlap(rect1, rect2) {
    const overlapLeft = Math.max(rect1.x, rect2.x);
    const overlapTop = Math.max(rect1.y, rect2.y);
    const overlapRight = Math.min(rect1.right, rect2.right);
    const overlapBottom = Math.min(rect1.bottom, rect2.bottom);
    
    if (overlapRight <= overlapLeft || overlapBottom <= overlapTop) {
      return { hasOverlap: false, area: 0, ratio: 0 };
    }
    
    const overlapArea = (overlapRight - overlapLeft) * (overlapBottom - overlapTop);
    const rect1Area = rect1.width * rect1.height;
    const rect2Area = rect2.width * rect2.height;
    const smallerArea = Math.min(rect1Area, rect2Area);
    
    return {
      hasOverlap: true,
      area: overlapArea,
      ratio: smallerArea > 0 ? overlapArea / smallerArea : 0,
      bounds: {
        x: overlapLeft,
        y: overlapTop,
        width: overlapRight - overlapLeft,
        height: overlapBottom - overlapTop
      }
    };
  }

  /**
   * Calculate adjacency between two rectangles
   * @param {Object} rect1 
   * @param {Object} rect2 
   * @returns {Object} Adjacency information
   */
  static calculateAdjacency(rect1, rect2) {
    const threshold = 5; // pixels
    
    const isAdjacentLeft = Math.abs(rect1.right - rect2.x) <= threshold;
    const isAdjacentRight = Math.abs(rect1.x - rect2.right) <= threshold;
    const isAdjacentTop = Math.abs(rect1.bottom - rect2.y) <= threshold;
    const isAdjacentBottom = Math.abs(rect1.y - rect2.bottom) <= threshold;
    
    return {
      isAdjacent: isAdjacentLeft || isAdjacentRight || isAdjacentTop || isAdjacentBottom,
      sides: {
        left: isAdjacentLeft,
        right: isAdjacentRight,
        top: isAdjacentTop,
        bottom: isAdjacentBottom
      }
    };
  }

  /**
   * Calculate optimal grid layout for multiple containers
   * @param {Array} containers 
   * @param {Object} parentBounds 
   * @param {Object} options 
   * @returns {Object} Grid layout configuration
   */
  static calculateGridLayout(containers, parentBounds, options = {}) {
    const itemCount = containers.length;
    if (itemCount === 0) return null;
    
    const { 
      maxColumns = 4,
      aspectRatio = QUAD_CONSTANTS.ASPECT_16_9,
      gap = 16 
    } = options;
    
    // Calculate optimal grid dimensions
    const possibleLayouts = [];
    
    for (let cols = 1; cols <= Math.min(maxColumns, itemCount); cols++) {
      const rows = Math.ceil(itemCount / cols);
      const cellWidth = (parentBounds.width - (gap * (cols - 1))) / cols;
      const cellHeight = (parentBounds.height - (gap * (rows - 1))) / rows;
      
      // Calculate efficiency (how well items fit)
      const idealCellHeight = cellWidth / aspectRatio;
      const efficiency = Math.min(cellHeight / idealCellHeight, 1);
      
      possibleLayouts.push({
        columns: cols,
        rows: rows,
        cellWidth: cellWidth,
        cellHeight: cellHeight,
        efficiency: efficiency,
        utilization: (itemCount / (cols * rows)) * efficiency
      });
    }
    
    // Select best layout
    const bestLayout = possibleLayouts.reduce((best, current) => 
      current.utilization > best.utilization ? current : best
    );
    
    return {
      grid: bestLayout,
      positions: this.calculateGridPositions(itemCount, bestLayout, gap)
    };
  }

  /**
   * Calculate individual grid positions
   * @param {number} itemCount 
   * @param {Object} gridLayout 
   * @param {number} gap 
   * @returns {Array} Position array
   */
  static calculateGridPositions(itemCount, gridLayout, gap) {
    const positions = [];
    
    for (let i = 0; i < itemCount; i++) {
      const row = Math.floor(i / gridLayout.columns);
      const col = i % gridLayout.columns;
      
      positions.push({
        index: i,
        x: col * (gridLayout.cellWidth + gap),
        y: row * (gridLayout.cellHeight + gap),
        width: gridLayout.cellWidth,
        height: gridLayout.cellHeight
      });
    }
    
    return positions;
  }
}

console.log('📐 QuadSpatial v1.0 loaded - Spatial calculation engine ready');