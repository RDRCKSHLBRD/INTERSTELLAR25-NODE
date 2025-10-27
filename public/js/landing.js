/**
 * LANDING PAGE INITIALIZATION
 * Complete implementation with orientation-aware breakpoint matching
 */

async function initLanding() {
  try {
    console.log('🎬 Landing page initializing...');

    await waitForSystem();

    const system = window.Interstellar;
    const position = system.position;
    const state = system.state;

    if (!position) {
      console.error('❌ RatioPosition not available');
      return;
    }

    const config = await loadLandingConfig();
    system.pageConfig = config;
    applyThemeVariables(config);
    await loadArtists(config);
    
    await waitForLayoutSettlement();
    
    positionArtistNav(position, config, state);
    
    system.on('system:update', async (detail) => {
      console.log('🔄 System updated, repositioning...');
      await waitForLayoutSettlement();
      positionArtistNav(position, config, state);
    });

    console.log('✅ Landing page initialized with RatioPosition');
    
  } catch (error) {
    console.error('❌ Landing page initialization failed:', error);
  }
}

function waitForSystem() {
  return new Promise((resolve) => {
    if (window.Interstellar?.isInitialized) {
      resolve();
    } else {
      window.addEventListener('system:ready', resolve, { once: true });
      setTimeout(resolve, 3000);
    }
  });
}

function waitForLayoutSettlement() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });
  });
}

async function loadLandingConfig() {
  try {
    const response = await fetch('/config/landing.json');
    if (!response.ok) {
      throw new Error(`Config load failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Failed to load landing config:', error);
    return {
      positions: {
        artistNav: {
          system: 'cartesian',
          top: 0.1,
          left: 0,
          anchor: 'top-left',
          styles: { height: '80%' }
        }
      },
      breakpoints: {
        desktop: {
          positions: {
            artistNav: { top: 0.55, styles: { height: '35%' } }
          }
        }
      }
    };
  }
}

function applyThemeVariables(config) {
  const root = document.documentElement;
  const theme = config.theme;
  
  if (!theme) return;
  
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([key, value]) => {
      const varName = `--color-${key.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}`;
      root.style.setProperty(varName, value);
    });
  }
  
  if (theme.typography) {
    root.style.setProperty('--font-family', theme.typography.fontFamily);
    root.style.setProperty('--qt-font-size', `${theme.typography.fontSize}px`);
    root.style.setProperty('--qt-font-weight', theme.typography.fontWeight);
    root.style.setProperty('--qt-letter-spacing', theme.typography.letterSpacing);
    root.style.setProperty('--qt-letter-spacing-hover', theme.typography.letterSpacingHover);
  }
  
  if (theme.spacing) {
    root.style.setProperty('--qt-padding', `${theme.spacing.padding}px`);
    root.style.setProperty('--qt-gap', `${theme.spacing.gap}px`);
  }
  
  if (theme.animation) {
    root.style.setProperty('--qt-slide-distance', `${theme.animation.slideDistance}px`);
    root.style.setProperty('--qt-hover-distance', `${theme.animation.hoverDistance}px`);
  }
}

async function loadArtists(config) {
  try {
    const response = await fetch('/config/artists.json');
    const artistsData = await response.json();
    
    const artistNav = document.getElementById('artistNav');
    
    if (!artistNav) {
      console.warn('⚠️ Artist nav element not found');
      return;
    }

    artistNav.innerHTML = '';
    
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

function getBreakpointConfig(viewport, config) {
  if (!viewport || !config.breakpoints) {
    console.warn('⚠️ No breakpoints config found, using fallback');
    return config.breakpoints?.desktop || null;
  }

  const w = viewport.w || viewport.vw || window.innerWidth;
  const h = viewport.h || viewport.vh || window.innerHeight;
  const orientation = h > w ? 'portrait' : 'landscape';
  
  console.log('🔍 Breakpoint matching:', {
    width: w,
    height: h,
    orientation,
    aspect: (w/h).toFixed(2),
    mode: viewport.mode
  });

  // Desktop (1280+)
  if (w >= 1280) {
    console.log('✅ Using: desktop config');
    return config.breakpoints.desktop;
  }
  
  // Tablet Portrait (768-1279, portrait)
  if (w >= 768 && w < 1280 && orientation === 'portrait') {
    if (config.breakpoints['tablet-portrait']) {
      console.log('✅ Using: tablet-portrait config');
      return config.breakpoints['tablet-portrait'];
    }
    console.log('⚠️ tablet-portrait not found, using tablet');
    return config.breakpoints.tablet;
  }
  
  // Tablet Landscape (768-1279, landscape)
  if (w >= 768 && w < 1280 && orientation === 'landscape') {
    if (config.breakpoints['tablet-landscape']) {
      console.log('✅ Using: tablet-landscape config');
      return config.breakpoints['tablet-landscape'];
    }
    console.log('⚠️ tablet-landscape not found, using tablet');
    return config.breakpoints.tablet;
  }
  
  // Mobile Landscape (<768, landscape)
  if (w < 768 && orientation === 'landscape') {
    if (config.breakpoints['mobile-landscape']) {
      console.log('✅ Using: mobile-landscape config');
      return config.breakpoints['mobile-landscape'];
    }
    console.log('⚠️ mobile-landscape not found, using mobile');
    return config.breakpoints.mobile;
  }
  
  // Mobile Portrait (<768, portrait)
  if (w < 768 && orientation === 'portrait') {
    if (config.breakpoints['mobile-portrait']) {
      console.log('✅ Using: mobile-portrait config');
      return config.breakpoints['mobile-portrait'];
    }
    console.log('⚠️ mobile-portrait not found, using mobile');
    return config.breakpoints.mobile;
  }
  
  // Fallback
  console.warn('⚠️ No breakpoint matched, using desktop as fallback');
  return config.breakpoints.desktop || null;
}

function positionArtistNav(position, config, state) {
  const artistNav = document.getElementById('artistNav');
  const sidebar = document.querySelector('.landing-sidebar');
  
  if (!artistNav) {
    console.error('❌ Artist nav element not found (#artistNav)');
    return;
  }
  
  if (!sidebar) {
    console.error('❌ Sidebar element not found (.landing-sidebar)');
    return;
  }
  
  const sidebarRect = sidebar.getBoundingClientRect();
  console.log('📏 Sidebar dimensions:', {
    width: Math.round(sidebarRect.width),
    height: Math.round(sidebarRect.height),
    viewport: `${window.innerWidth} x ${window.innerHeight}`
  });
  
  const viewport = state ? state.calculate({
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio || 1
  }) : { 
    w: window.innerWidth, 
    h: window.innerHeight 
  };

  let posConfig = config.positions?.artistNav;
  
  if (!posConfig) {
    console.error('❌ No position config found for artistNav');
    return;
  }

  posConfig = JSON.parse(JSON.stringify(posConfig));

  const breakpointConfig = getBreakpointConfig(viewport, config);
  
  if (breakpointConfig?.positions?.artistNav) {
    const bpArtistNav = breakpointConfig.positions.artistNav;
    
    if (bpArtistNav.top !== undefined) posConfig.top = bpArtistNav.top;
    if (bpArtistNav.left !== undefined) posConfig.left = bpArtistNav.left;
    if (bpArtistNav.anchor) posConfig.anchor = bpArtistNav.anchor;
    if (bpArtistNav.clamp !== undefined) posConfig.clamp = bpArtistNav.clamp;
    if (bpArtistNav.padding !== undefined) posConfig.padding = bpArtistNav.padding;
    
    if (bpArtistNav.styles) {
      posConfig.styles = {
        ...(posConfig.styles || {}),
        ...bpArtistNav.styles
      };
    }
  }
  
  const expectedY = posConfig.top * sidebarRect.height;
  
  position.apply(artistNav, sidebar, posConfig, viewport);
  
  console.log('🎯 Artist nav positioned:', {
    top: posConfig.top,
    height: posConfig.styles?.height,
    expectedY: `${Math.round(expectedY)}px`,
    actualTop: artistNav.style.top,
    actualHeight: artistNav.style.height
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLanding);
} else {
  initLanding();
}

window.LandingPage = {
  initLanding,
  positionArtistNav,
  getBreakpointConfig
};