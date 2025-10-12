/* ================================================================
   QUAD MATH - Pure Mathematical Core
   30 lines of mathematical relationships - no side effects
   ================================================================ */

export const QUAD_CONSTANTS = {
  PHI: 1.618033988749,           // Golden ratio
  ASPECT_16_9: 16 / 9,           // Standard video aspect
  ASPECT_4_3: 4 / 3,             // Classic screen aspect
  SCALE_MIN: 0.1,                // Minimum scale factor
  SCALE_MAX: 10,                 // Maximum scale factor
  PRECISION: 0.001               // Calculation precision
};

export class QuadMath {
  /**
   * Calculate optimal scale factor for container
   * @param {number} containerWidth 
   * @param {number} containerHeight 
   * @param {number} baseSize 
   * @param {number} targetAspect 
   * @returns {number} Scale factor
   */
  static calculateScale(containerWidth, containerHeight, baseSize, targetAspect = QUAD_CONSTANTS.ASPECT_16_9) {
    const containerAspect = containerWidth / containerHeight;
    const scaleFactor = containerAspect > targetAspect 
      ? containerHeight / baseSize 
      : containerWidth / (baseSize * targetAspect);
    
    return Math.max(QUAD_CONSTANTS.SCALE_MIN, Math.min(QUAD_CONSTANTS.SCALE_MAX, scaleFactor));
  }

  /**
   * Calculate subdivision ratios using golden ratio
   * @param {number} totalSpace 
   * @param {number} divisions 
   * @returns {Array} Division ratios
   */
  static calculateSubdivision(totalSpace, divisions = 2) {
    if (divisions === 2) {
      const phi = QUAD_CONSTANTS.PHI;
      return [totalSpace / phi, totalSpace - (totalSpace / phi)];
    }
    
    return Array(divisions).fill(totalSpace / divisions);
  }

  /**
   * Clamp value between min and max
   * @param {number} value 
   * @param {number} min 
   * @param {number} max 
   * @returns {number} Clamped value
   */
  static clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Calculate distance between two points
   * @param {Object} point1 {x, y}
   * @param {Object} point2 {x, y}
   * @returns {number} Distance
   */
  static distance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Round to precision
   * @param {number} value 
   * @param {number} precision 
   * @returns {number} Rounded value
   */
  static round(value, precision = QUAD_CONSTANTS.PRECISION) {
    return Math.round(value / precision) * precision;
  }
}

console.log('🧮 QuadMath v1.0 loaded - Mathematical core ready');