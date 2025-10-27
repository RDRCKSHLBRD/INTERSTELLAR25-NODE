function waitForInterstellar() {
  return new Promise((resolve) => {
    if (window.Interstellar?.isInitialized) return resolve();
    window.addEventListener('system:ready', resolve, { once: true });
  });
}

async function initLanding() {
  await waitForInterstellar();
  const { state, position, quadTree } = window.Interstellar;

  let cfg;
  try {
    cfg = await fetch('/config/pages/landing.json').then(r => r.json());
  } catch {
    console.warn('landing.json missing; using minimal defaults');
    cfg = { positions: {} };
  }

  const viewport = state.calculate({
    width:  window.innerWidth,
    height: window.innerHeight,
    dpr:    window.devicePixelRatio || 1
  });

  const container = document.body;
  const heroTitle = document.getElementById('heroTitle');
  const cta       = document.getElementById('cta');
  const albumGrid = document.getElementById('albumGrid');

  if (heroTitle && cfg.positions?.heroTitle) {
    position.apply(heroTitle, container, cfg.positions.heroTitle, viewport);
  }
  if (cta && cfg.positions?.cta) {
    position.apply(cta, container, cfg.positions.cta, viewport);
  }
  if (albumGrid && cfg.positions?.albumGrid) {
    position.apply(albumGrid, container, cfg.positions.albumGrid, viewport);
    if (cfg.quadTree?.albumGrid?.enabled && quadTree?.observer) {
      quadTree.observer.observeContainer(albumGrid, () => {
        // hook: compute layout using albumGrid bounds + cfg.quadTree.albumGrid
      });
    }
  }
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', initLanding)
  : initLanding();
