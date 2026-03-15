/* ================================================================
   QUAD INTEGRATION - Bridge Between Systems
   Coordinates QuadTree, RatioPosition, and RatioLayoutEngine
   ================================================================ */

/**
 * QuadIntegration - Orchestrates all three systems together
 * 
 * ARCHITECTURE:
 * 1. RatioLayoutEngine: Defines region sizes (header: 8%, main: 84%, etc.)
 * 2. RatioPosition: Places elements within regions (logo at 0.02, 0.50)
 * 3. QuadTree: Optimizes grids and provides microFunctions
 */

export class QuadIntegration {
  constructor(interstellar, quadTree) {
    this.interstellar = interstellar;  // window.Interstellar
    this.quadTree = quadTree;           // QuadTreeSystem instance
    
    this.ratioPosition = interstellar?.RatioPosition || interstellar?.position;
    this.ratioEngine = interstellar?.RatioLayoutEngine || interstellar?.layout;
    this.state = interstellar?.State || interstellar?.state;
    
    console.log('🔗 QuadIntegration initialized');
  }
  
  /**
   * Apply complete layout using all systems
   * @param {Object} config - Page configuration (from JSON)
   * @param {Object} options - Additional options
   */
  applyIntegratedLayout(config, options = {}) {
    console.log('🎯 Applying integrated layout...');
    
    const startTime = performance.now();
    
    // STEP 1: RatioLayoutEngine defines regions
    if (this.ratioEngine && config.layout) {
      this.applyRegions(config.layout);
    }
    
    // STEP 2: RatioPosition places elements
    if (this.ratioPosition && config.positions) {
      this.applyPositions(config.positions);
    }
    
    // STEP 3: QuadTree optimizes grids
    if (this.quadTree && config.quadTree) {
      this.applyQuadTreeLayouts(config.quadTree);
    }
    
    const duration = performance.now() - startTime;
    console.log(`✅ Integrated layout applied (${duration.toFixed(2)}ms)`);
    
    return {
      success: true,
      duration,
      systemsUsed: {
        ratioEngine: !!this.ratioEngine,
        ratioPosition: !!this.ratioPosition,
        quadTree: !!this.quadTree
      }
    };
  }
  
  /**
   * Apply regions using RatioLayoutEngine
   * @param {Object} layoutConfig - Layout configuration
   */
  applyRegions(layoutConfig) {
    if (!this.ratioEngine) return;
    
    const { regions, mainSplit } = layoutConfig;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    // Calculate region sizes
    if (regions) {
      const headerH = vh * (regions.header?.ratio || 0.08);
      const mainH = vh * (regions.main?.ratio || 0.84);
      const controlsH = vh * (regions.controls?.ratio || 0.08);
      
      this.applyRegionStyles('artistHeader', { width: vw, height: headerH, top: 0 });
      this.applyRegionStyles('artistMain', { width: vw, height: mainH, top: headerH });
      this.applyRegionStyles('artistControls', { width: vw, height: controlsH, top: headerH + mainH });
    }
    
    // Calculate main split (left/right columns)
    if (mainSplit && document.getElementById('artistMain')) {
      const leftW = vw * (mainSplit.left?.ratio || 0.66);
      const rightW = vw * (mainSplit.right?.ratio || 0.34);
      const minW = mainSplit.right?.minPx || 360;
      
      this.applyRegionStyles('albumsRegion', { width: leftW, height: '100%', left: 0 });
      this.applyRegionStyles('infoRegion', { width: Math.max(minW, rightW), height: '100%', left: leftW });
    }
    
    console.log('📐 Regions applied via RatioLayoutEngine');
  }
  
  /**
   * Apply element positions using RatioPosition
   * @param {Object} positionsConfig - Positions configuration
   */
  applyPositions(positionsConfig) {
    if (!this.ratioPosition || !this.state) return;
    
    const Q = (id) => document.getElementById(id);
    
    Object.entries(positionsConfig).forEach(([elementId, posConfig]) => {
      if (elementId.startsWith('_')) return; // Skip comments
      
      const element = Q(elementId);
      const container = this.getContainerForElement(elementId);
      
      if (element && container && posConfig.system === 'cartesian') {
        try {
          this.ratioPosition.apply(element, container, posConfig, this.state);
        } catch (error) {
          console.warn(`⚠️ Failed to position ${elementId}:`, error.message);
        }
      }
    });
    
    console.log('📍 Positions applied via RatioPosition');
  }
  
  /**
   * Apply QuadTree layouts (grids, special calculations)
   * @param {Object} quadTreeConfig - QuadTree configuration
   */
  applyQuadTreeLayouts(quadTreeConfig) {
    if (!this.quadTree) return;
    
    Object.entries(quadTreeConfig).forEach(([layoutId, layoutConfig]) => {
      if (layoutId.startsWith('_')) return; // Skip comments
      
      if (layoutId === 'albumGrid' && layoutConfig.enabled) {
        this.applyAlbumGrid(layoutConfig);
      }
      
      // Add more layout types as needed
    });
    
    console.log('🌳 QuadTree layouts applied');
  }
  
  /**
   * Apply album grid using QuadTree spatial calculations
   * @param {Object} gridConfig - Grid configuration
   */
  applyAlbumGrid(gridConfig) {
    const gridContainer = document.getElementById('albumsRegion');
    if (!gridContainer) return;
    
    const albums = Array.from(gridContainer.querySelectorAll('.album-cover'));
    if (albums.length === 0) {
      setTimeout(() => this.applyAlbumGrid(gridConfig), 100);
      return;
    }
    
    const rect = gridContainer.getBoundingClientRect();
    const width = rect.width;
    
    // Determine breakpoint
    const breakpoint = width < 520 ? 'mobile' :
                      width < 880 ? 'tablet' :
                      width > 1400 ? 'ultra' : 'desktop';
    
    const maxCols = gridConfig.columns?.[breakpoint]?.max || 4;
    const gap = gridConfig.gap?.px || 16;
    const aspect = gridConfig.tile?.aspect || 1.0;
    
    // Use QuadTree microFunction for layout
    const layout = this.quadTree.callMicro('calculateGridLayout', {
      itemCount: albums.length,
      containerWidth: width * 0.92,
      maxColumns: maxCols,
      gap,
      aspect
    });
    
    // Apply calculated positions
    if (layout) {
      albums.forEach((album, i) => {
        const pos = layout.positions[i];
        if (pos) {
          Object.assign(album.style, {
            position: 'absolute',
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            width: `${pos.width}px`,
            height: `${pos.height}px`
          });
        }
      });
      
      gridContainer.style.height = `${layout.totalHeight}px`;
    }
  }
  
  /**
   * Apply microFunction result to layout
   * @param {string} microFunctionName - Name of microFunction
   * @param {Array} args - Arguments for function
   * @param {Function} applyCallback - Callback to apply results
   */
  applyMicroFunction(microFunctionName, args, applyCallback) {
    if (!this.quadTree) return;
    
    const result = this.quadTree.callMicro(microFunctionName, ...args);
    
    if (result && applyCallback) {
      applyCallback(result);
    }
    
    return result;
  }
  
  /**
   * Calculate header layout using microFunction
   * @param {number} containerWidth - Header width
   * @returns {Object} Header layout
   */
  calculateHeaderLayout(containerWidth) {
    return this.applyMicroFunction(
      'headerLayout',
      [containerWidth, {
        logoWidth: 200,
        artistNameWidth: 300,
        navWidth: 400,
        leftMargin: 0.02,
        rightMargin: 0.08
      }],
      (layout) => {
        // Apply calculated positions
        this.applyHeaderPositions(layout);
      }
    );
  }
  
  /**
   * Apply header positions from calculated layout
   * @param {Object} layout - Header layout from microFunction
   */
  applyHeaderPositions(layout) {
    const elements = {
      logo: document.getElementById('brandLogo'),
      artistName: document.getElementById('pageCrumbs'),
      nav: document.getElementById('topNav')
    };
    
    if (elements.logo && layout.logo) {
      elements.logo.style.left = `${layout.logo.x}px`;
    }
    
    if (elements.artistName && layout.artistName) {
      elements.artistName.style.left = `${layout.artistName.x}px`;
    }
    
    if (elements.nav && layout.nav) {
      elements.nav.style.left = `${layout.nav.x}px`;
    }
  }
  
  /**
   * Get container element for a positioned element
   * @param {string} elementId - Element ID
   * @returns {Element|null} Container element
   */
  getContainerForElement(elementId) {
    const Q = (id) => document.getElementById(id);
    
    // Map elements to their containers
    const containerMap = {
      'brandLogo': 'artistHeader',
      'pageCrumbs': 'artistHeader',
      'topNav': 'artistHeader',
      'albumGrid': 'albumsRegion',
      'albumInfo': 'infoRegion',
      'songList': 'infoRegion',
      'playerControls': 'artistControls'
    };
    
    const containerId = containerMap[elementId];
    return containerId ? Q(containerId) : null;
  }
  
  /**
   * Apply styles to region element
   * @param {string} elementId - Element ID
   * @param {Object} styles - Style object
   */
  applyRegionStyles(elementId, styles) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    Object.assign(element.style, {
      position: 'absolute',
      ...Object.entries(styles).reduce((acc, [key, val]) => {
        acc[key] = typeof val === 'number' ? `${val}px` : val;
        return acc;
      }, {})
    });
  }
  
  /**
   * Force refresh all layouts
   */
  forceRefresh() {
    if (this.state) {
      this.state.measure?.();
    }
    
    if (this.quadTree) {
      this.quadTree.forceUpdate();
    }
    
    console.log('🔄 Force refresh triggered');
  }
  
  /**
   * Respond to viewport changes
   */
  onViewportChange() {
    // This would be called by ViewportState or QuadObserver
    this.forceRefresh();
  }
}

/* ================================================================
   USAGE IN RODERICK.JS:
   
   import { QuadIntegration } from './QuadIntegration.js';
   
   whenInterstellarReady((IS) => {
     const integration = new QuadIntegration(IS, IS.quadTree);
     
     // Apply everything
     integration.applyIntegratedLayout(cfg);
     
     // Or step-by-step
     integration.applyRegions(cfg.layout);
     integration.applyPositions(cfg.positions);
     integration.applyQuadTreeLayouts(cfg.quadTree);
     
     // Respond to resize
     window.addEventListener('resize', () => {
       integration.forceRefresh();
     });
   });
   
   ================================================================ */

export default QuadIntegration;