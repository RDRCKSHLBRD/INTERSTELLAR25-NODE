/**
 * Landing Page - Loads artists and positions elements
 * Uses modular config: /config/pages/landing.json + /config/data/artists.json
 */

function waitForInterstellar() {
  return new Promise((resolve) => {
    if (window.Interstellar?.isInitialized) return resolve();
    window.addEventListener('system:ready', resolve, { once: true });
    setTimeout(() => resolve(), 3000); // fallback
  });
}

/** Merge page positions with breakpoint overrides for current viewport */
function mergeBreakpointSpec(baseSpec, breakpoints, viewport) {
  if (!breakpoints) return { ...baseSpec };

  const v = {
    width: viewport.width,
    height: viewport.height,
    orientation: viewport.orientation
  };

  let merged = { ...baseSpec };
  for (const [, bp] of Object.entries(breakpoints)) {
    const ok =
      (bp.minWidth  == null || v.width  >= bp.minWidth)  &&
      (bp.maxWidth  == null || v.width  <= bp.maxWidth)  &&
      (bp.minHeight == null || v.height >= bp.minHeight) &&
      (bp.maxHeight == null || v.height <= bp.maxHeight) &&
      (bp.orientation == null || v.orientation === bp.orientation);

    if (!ok) continue;

    const ov = bp.positions?.artistNav;
    if (!ov) continue;

    // allow x/y aliases in overrides
    const mapped = { ...ov };
    if (mapped.y != null && mapped.top  == null) mapped.top  = mapped.y;
    if (mapped.x != null && mapped.left == null) mapped.left = mapped.x;
    delete mapped.y; delete mapped.x;

    merged = { ...merged, ...mapped, styles: { ...merged.styles, ...mapped.styles } };
  }
  return merged;
}

async function loadArtists() {
  try {
    const r = await fetch('/config/data/artists.json');
    if (!r.ok) throw new Error(`Failed to load artists: ${r.status}`);
    const data = await r.json();
    console.log('✅ Artists loaded:', data.artists?.length || 0);
    return data.artists || [];
  } catch (err) {
    console.error('❌ Failed to load artists:', err);
    return [];
  }
}

function renderArtists(artists) {
  const nav = document.getElementById('artistNav');
  if (!nav) {
    console.warn('⚠️ #artistNav element not found in HTML');
    return;
  }
  nav.innerHTML = '';

  const sorted = artists.sort((a, b) => (a.order || 0) - (b.order || 0));
  sorted.forEach((artist) => {
    const link = document.createElement('a');
    link.href = `/${artist.page || artist.id + '.html'}`;
    link.className = 'artist-link';
    link.textContent = artist.name;
    link.dataset.artistId = artist.id;
    link.addEventListener('click', () => {
      console.log('🎵 Navigating to artist:', artist.name);
    });
    nav.appendChild(link);
  });

  console.log(`✅ Rendered ${sorted.length} artist links`);
}

/** Directly set video/sidebar frames from config (no layout CSS dependency) */
function applyDirectLayout(viewport, pageConfig) {
  const videoEl   = document.querySelector('.landing-video');
  const sidebarEl = document.querySelector('.landing-sidebar');
  if (!videoEl || !sidebarEl) {
    console.warn('⚠️ Video or sidebar element not found');
    return;
  }

  if (viewport.mode === 'split') {
    const videoFlex   = pageConfig.layout?.videoSection?.flex   ?? 0.7;
    const sidebarFlex = pageConfig.layout?.sidebarSection?.flex ?? 0.3;
    const sidebarMaxWidth = pageConfig.layout?.sidebarSection?.maxWidth
      ? parseInt(pageConfig.layout.sidebarSection.maxWidth)
      : 400;

    const videoWidth   = window.innerWidth * videoFlex;
    const sidebarWidth = Math.min(window.innerWidth * sidebarFlex, sidebarMaxWidth);

    // video
    Object.assign(videoEl.style, {
      position: 'absolute', left: '0', top: '0',
      width: `${videoWidth}px`, height: '100vh'
    });

    // sidebar
    Object.assign(sidebarEl.style, {
      position: 'absolute', right: '0', top: '0',
      width: `${sidebarWidth}px`, height: '100vh'
    });

    console.log('✅ Direct layout applied (SPLIT):',
      { videoWidth: `${videoWidth.toFixed(2)}px`,
        sidebarWidth: `${sidebarWidth.toFixed(2)}px`,
        maxWidth: `${sidebarMaxWidth}px` });
  } else {
    // reset to CSS for stack
    Object.assign(videoEl.style,  { position:'', left:'', top:'', width:'', height:'', boxSizing:'border-box' });
    Object.assign(sidebarEl.style,{ position:'', right:'', top:'', width:'', height:'', boxSizing:'border-box' });
    console.log('✅ Layout reset to CSS (STACK)');
  }
}

async function initLanding() {
  try {
    console.log('🚀 Initializing landing page...');
    await waitForInterstellar();
    console.log('✅ Interstellar system ready');

    const { state, position, quadTree } = window.Interstellar;

    // load page config
    let pageConfig;
    try {
      const r = await fetch('/config/pages/landing.json');
      if (!r.ok) throw new Error(`Config not found: ${r.status}`);
      pageConfig = await r.json();
      console.log('✅ Landing page config loaded');

      // expose some vars for CSS fallbacks
      if (pageConfig.layout) {
        const root = document.documentElement;
        if (pageConfig.layout.videoSection)
          root.style.setProperty('--video-flex', pageConfig.layout.videoSection.flex ?? 0.7);
        if (pageConfig.layout.sidebarSection) {
          root.style.setProperty('--sidebar-flex', pageConfig.layout.sidebarSection.flex ?? 0.3);
          root.style.setProperty('--sidebar-max-width', pageConfig.layout.sidebarSection.maxWidth ?? '400px');
        }
        console.log('✅ Layout CSS variables applied');
      }
    } catch (err) {
      console.warn('⚠️ landing.json missing; using defaults');
      pageConfig = { positions: {}, layout: {} };
    }

    // compute viewport
    const viewport = state.calculate({
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio || 1
    });
    console.log('✅ Viewport calculated:', viewport.mode);

    document.body.setAttribute('data-mode', viewport.mode);
    document.body.setAttribute('data-orientation', viewport.orientation);

    // frame layout
    applyDirectLayout(viewport, pageConfig);

    // data + render
    const artists = await loadArtists();
    renderArtists(artists);

    // position artist nav (MERGED SPEC)
    const container = document.querySelector('.landing-sidebar');
    const artistNav = document.getElementById('artistNav');

    if (artistNav && pageConfig.positions?.artistNav) {
      // tip: set "anchor":"m-l" in JSON if you want y to be the vertical center
      const mergedSpec = mergeBreakpointSpec(
        pageConfig.positions.artistNav,
        pageConfig.positionBreakpoints,
        viewport
      );
      position.apply(artistNav, mergedSpec, container, viewport);
      console.log('✅ Artist nav positioned (merged spec):', mergedSpec);
    }

    // optional: QuadTree
    if (artistNav && pageConfig.quadTree?.artistNav?.enabled && quadTree) {
      quadTree.observe(artistNav, pageConfig.quadTree.artistNav);
      console.log('✅ QuadTree observer attached to artistNav');
    }

    // resize handler
    window.addEventListener('resize', () => {
      const vp = state.calculate({
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1
      });

      document.body.setAttribute('data-mode', vp.mode);
      document.body.setAttribute('data-orientation', vp.orientation);

      applyDirectLayout(vp, pageConfig);

      if (artistNav && pageConfig.positions?.artistNav && container) {
        const mergedSpec = mergeBreakpointSpec(
          pageConfig.positions.artistNav,
          pageConfig.positionBreakpoints,
          vp
        );
        position.apply(artistNav, mergedSpec, container, vp);
      }
    });

    console.log('🎉 Landing page initialized successfully!');
  } catch (error) {
    console.error('❌ Landing page initialization failed:', error);
  }
}

// boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLanding);
} else {
  initLanding();
}
