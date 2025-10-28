/**
 * Landing Page - Loads artists and positions elements
 * Uses modular config: /config/pages/landing.json + /config/data/artists.json
 */

function waitForInterstellar() {
  return new Promise((resolve) => {
    if (window.Interstellar?.isInitialized) {
      return resolve();
    }
    window.addEventListener('system:ready', resolve, { once: true });
    // Fallback timeout
    setTimeout(() => resolve(), 3000);
  });
}

async function loadArtists() {
  try {
    const response = await fetch('/config/data/artists.json');
    if (!response.ok) {
      throw new Error(`Failed to load artists: ${response.status}`);
    }
    const data = await response.json();
    console.log('✅ Artists loaded:', data.artists?.length || 0);
    return data.artists || [];
  } catch (error) {
    console.error('❌ Failed to load artists:', error);
    return [];
  }
}

function renderArtists(artists) {
  const nav = document.getElementById('artistNav');
  if (!nav) {
    console.warn('⚠️ #artistNav element not found in HTML');
    return;
  }

  // Clear existing content
  nav.innerHTML = '';

  // Sort by order
  const sortedArtists = artists.sort((a, b) => (a.order || 0) - (b.order || 0));

  // Render each artist link
  sortedArtists.forEach(artist => {
    const link = document.createElement('a');
    link.href = `/${artist.page || artist.id + '.html'}`;
    link.className = 'artist-link';
    link.textContent = artist.name;
    link.dataset.artistId = artist.id;

    // Add click handler (optional - for SPA-like behavior)
    link.addEventListener('click', (e) => {
      console.log('🎵 Navigating to artist:', artist.name);
      // Let default navigation happen
    });

    nav.appendChild(link);
  });

  console.log(`✅ Rendered ${sortedArtists.length} artist links`);
}

// NEW: Apply layout directly via JavaScript (bypass CSS flex/grid)
function applyDirectLayout(viewport, pageConfig) {
  const videoEl = document.querySelector('.landing-video');
  const sidebarEl = document.querySelector('.landing-sidebar');
  
  if (!videoEl || !sidebarEl) {
    console.warn('⚠️ Video or sidebar element not found');
    return;
  }

  if (viewport.mode === 'split') {
    // READ FROM CONFIG (not hardcoded!)
    const videoFlex = pageConfig.layout?.videoSection?.flex || 0.7;
    const sidebarFlex = pageConfig.layout?.sidebarSection?.flex || 0.3;
    
    // ✅ READ maxWidth FROM CONFIG
    const sidebarMaxWidth = pageConfig.layout?.sidebarSection?.maxWidth 
      ? parseInt(pageConfig.layout.sidebarSection.maxWidth) 
      : 400;
    
    const videoWidth = window.innerWidth * videoFlex;
    const sidebarWidth = Math.min(window.innerWidth * sidebarFlex, sidebarMaxWidth);
    
    // Apply video layout
    videoEl.style.position = 'absolute';
    videoEl.style.left = '0';
    videoEl.style.top = '0';
    videoEl.style.width = `${videoWidth}px`;
    videoEl.style.height = '100vh';
    
    // Apply sidebar layout
    sidebarEl.style.position = 'absolute';
    sidebarEl.style.right = '0';
    sidebarEl.style.top = '0';
    sidebarEl.style.width = `${sidebarWidth}px`;
    sidebarEl.style.height = '100vh';
    
    console.log('✅ Direct layout applied (SPLIT):', { 
      videoWidth: `${videoWidth.toFixed(2)}px`, 
      sidebarWidth: `${sidebarWidth.toFixed(2)}px`,
      maxWidth: `${sidebarMaxWidth}px`
    });
    
  } else {
    // STACK mode - reset
    videoEl.style.position = '';
    videoEl.style.left = '';
    videoEl.style.top = '';
    videoEl.style.width = '';
    videoEl.style.height = '';
    videoEl.style.boxSizing = 'border-box';  // ← ADD THIS

    
    sidebarEl.style.position = '';
    sidebarEl.style.right = '';
    sidebarEl.style.top = '';
    sidebarEl.style.width = '';
    sidebarEl.style.height = '';
    sidebarEl.style.boxSizing = 'border-box';  // ← ADD THIS

    
    console.log('✅ Layout reset to CSS (STACK)');
  }
}

async function initLanding() {
  try {
    console.log('🚀 Initializing landing page...');

    // 1. Wait for global system
    await waitForInterstellar();
    console.log('✅ Interstellar system ready');

    const { state, position, quadTree } = window.Interstellar;

    // 2. Load page config
    let pageConfig;
    try {
      const response = await fetch('/config/pages/landing.json');
      if (!response.ok) {
        throw new Error(`Config not found: ${response.status}`);
      }
      pageConfig = await response.json();
      console.log('✅ Landing page config loaded');

      // Keep CSS variables for fallback/reference
      if (pageConfig.layout) {
        const root = document.documentElement;
        
        if (pageConfig.layout.videoSection) {
          root.style.setProperty('--video-flex', pageConfig.layout.videoSection.flex || 0.7);
        }
        
        if (pageConfig.layout.sidebarSection) {
          root.style.setProperty('--sidebar-flex', pageConfig.layout.sidebarSection.flex || 0.3);
          root.style.setProperty('--sidebar-max-width', pageConfig.layout.sidebarSection.maxWidth || '400px');
        }
        
        console.log('✅ Layout CSS variables applied');
      }

    } catch (error) {
      console.warn('⚠️ landing.json missing; using defaults');
      pageConfig = { positions: {}, layout: {} };
    }

    // 3. Calculate viewport
    const viewport = state.calculate({
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio || 1
    });
    console.log('✅ Viewport calculated:', viewport.mode);

    // Set data attributes
    document.body.setAttribute('data-mode', viewport.mode);
    document.body.setAttribute('data-orientation', viewport.orientation);

    // NEW: Apply layout directly (bypass CSS)
    applyDirectLayout(viewport, pageConfig);

    // 4. Load and render artists
    const artists = await loadArtists();
    renderArtists(artists);

    // 5. Apply positions if configured
    const container = document.querySelector('.landing-sidebar');
    const artistNav = document.getElementById('artistNav');

    if (artistNav && pageConfig.positions?.artistNav) {
      position.apply(artistNav, container, pageConfig.positions.artistNav, viewport);
      console.log('✅ Artist nav positioned');
    }

    // 6. Set up QuadTree observers if configured
    if (artistNav && pageConfig.quadTree?.artistNav?.enabled && quadTree) {
      quadTree.observe(artistNav, pageConfig.quadTree.artistNav);
      console.log('✅ QuadTree observer attached to artistNav');
    }

    // 7. Handle window resize
    window.addEventListener('resize', () => {
      const newViewport = state.calculate({
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1
      });

      // Update data attributes
      document.body.setAttribute('data-mode', newViewport.mode);
      document.body.setAttribute('data-orientation', newViewport.orientation);

      // NEW: Reapply layout directly
      applyDirectLayout(newViewport, pageConfig);

      // Reposition artist nav
      if (artistNav && pageConfig.positions?.artistNav && container) {
        position.apply(artistNav, container, pageConfig.positions.artistNav, newViewport);
      }
    });

    console.log('🎉 Landing page initialized successfully!');

  } catch (error) {
    console.error('❌ Landing page initialization failed:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLanding);
} else {
  initLanding();
}