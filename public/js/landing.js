/**
 * LANDING PAGE INITIALIZATION
 * Uses RatioPosition for precise element positioning
 */

async function initLanding() {
  try {
    console.log('🎬 Landing page initializing...');

    // Wait for InterstellarSystem to be ready
    await waitForSystem();

    // Get system instances
    const system = window.Interstellar;
    const position = system.position;
    const state = system.state;

    if (!position) {
      console.error('❌ RatioPosition not available');
      return;
    }

    // Load landing configuration
    const config = await loadLandingConfig();
    
    // Store config in system for layout management
    system.pageConfig = config;

    // Apply theme CSS variables
    applyThemeVariables(config);
    
    // Load and render artists
    await loadArtists(config);
    
    // Position artist nav using RatioPosition
    positionArtistNav(position, config, state);
    
    // Listen for breakpoint changes
    system.on('system:update', (detail) => {
      console.log('🔄 System updated, repositioning...');
      positionArtistNav(position, config, state);
    });

    console.log('✅ Landing page initialized with RatioPosition');
    
  } catch (error) {
    console.error('❌ Landing page initialization failed:', error);
  }
}

/**
 * Wait for InterstellarSystem to be ready
 */
function waitForSystem() {
  return new Promise((resolve) => {
    if (window.Interstellar?.isInitialized) {
      resolve();
    } else {
      window.addEventListener('system:ready', resolve, { once: true });
      // Timeout fallback
      setTimeout(resolve, 3000);
    }
  });
}

/**
 * Load landing page configuration
 */
async function loadLandingConfig() {
  try {
    const response = await fetch('/config/landing.json');
    if (!response.ok) {
      throw new Error(`Config load failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Failed to load landing config:', error);
    // Return minimal config as fallback
    return {
      positions: {
        artistNav: {
          system: 'cartesian',
          top: 0.7,
          left: 0,
          anchor: 'top-left'
        }
      }
    };
  }
}

/**
 * Apply theme CSS variables
 */
function applyThemeVariables(config) {
  const root = document.documentElement;
  const theme = config.theme;
  
  if (!theme) return;
  
  // Colors
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([key, value]) => {
      const varName = `--color-${key.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}`;
      root.style.setProperty(varName, value);
    });
  }
  
  // Typography
  if (theme.typography) {
    root.style.setProperty('--font-family', theme.typography.fontFamily);
    root.style.setProperty('--qt-font-size', `${theme.typography.fontSize}px`);
    root.style.setProperty('--qt-font-weight', theme.typography.fontWeight);
    root.style.setProperty('--qt-letter-spacing', theme.typography.letterSpacing);
    root.style.setProperty('--qt-letter-spacing-hover', theme.typography.letterSpacingHover);
  }
  
  // Spacing
  if (theme.spacing) {
    root.style.setProperty('--qt-padding', `${theme.spacing.padding}px`);
    root.style.setProperty('--qt-gap', `${theme.spacing.gap}px`);
  }
  
  // Animation
  if (theme.animation) {
    root.style.setProperty('--qt-slide-distance', `${theme.animation.slideDistance}px`);
    root.style.setProperty('--qt-hover-distance', `${theme.animation.hoverDistance}px`);
  }
}

/**
 * Load and render artists
 */
async function loadArtists(config) {
  try {
    const response = await fetch('/config/artists.json');
    const artistsData = await response.json();
    
    const artistNav = document.getElementById('artistNav');
    
    if (!artistNav) {
      console.warn('⚠️ Artist nav element not found');
      return;
    }

    // Clear existing content
    artistNav.innerHTML = '';
    
    // Render artist links
    artistsData.artists
      .sort((a, b) => a.order - b.order)
      .forEach(artist => {
        const link = document.createElement('a');
        link.href = `/${artist.page}`;
        link.className = 'artist-link';
        link.textContent = artist.name;
        artistNav.appendChild(link);
      });
    
    console.log(`✅ Loaded ${artistsData.artists.length} artists`);
    
  } catch (error) {
    console.error('❌ Failed to load artists:', error);
  }
}

/**
 * Position artist nav using RatioPosition
 */
function positionArtistNav(position, config, state) {
  const artistNav = document.getElementById('artistNav');
  const sidebar = document.querySelector('.landing-sidebar');
  
  if (!artistNav || !sidebar) {
    console.warn('⚠️ Artist nav or sidebar element not found');
    return;
  }
  
  // Get viewport info
  const viewport = state ? state.calculate({
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio || 1
  }) : null;

  // Get base position config
  let posConfig = config.positions?.artistNav;
  
  if (!posConfig) {
    console.warn('⚠️ No position config for artistNav');
    return;
  }

  // Merge breakpoint-specific overrides
  if (viewport && config.breakpoints) {
    const bpConfig = config.breakpoints[viewport.bp];
    if (bpConfig?.positions?.artistNav) {
      posConfig = {
        ...posConfig,
        ...bpConfig.positions.artistNav
      };
      
      // Merge styles separately
      if (bpConfig.positions.artistNav.styles) {
        posConfig.styles = {
          ...posConfig.styles,
          ...bpConfig.positions.artistNav.styles
        };
      }
    }
  }
  
  // Apply positioning
  position.apply(artistNav, sidebar, posConfig, viewport);
  
  console.log('🎯 Artist nav positioned:', {
    breakpoint: viewport?.bp,
    top: posConfig.top,
    system: posConfig.system
  });
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLanding);
} else {
  initLanding();
}

// Export for debugging
window.LandingPage = {
  initLanding
};