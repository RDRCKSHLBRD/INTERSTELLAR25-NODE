// ============================================================================
// public/js/roderick.js — V5 Session 3 (RODUX Stack / Flash Layer)
//
// Page controller for the artist browse page.
// Layout: StateJS → RatioEngine (regions) → RatioPosition (elements) → QuadTree (grid)
// Paint: paint.json → paint-applier.js → cssJSON custom properties
//
// NO inline CSS Grid. NO CSS frameworks. ALL layout from JSON config.
// ============================================================================

import { applyPaintForPage } from './paint-applier.js';

// ── Helpers ─────────────────────────────────────────────────────
const Q  = (id) => document.getElementById(id);
const px = (n) => `${Math.round(n)}px`;

const MOBILE_MAX = 767;
const TABLET_MAX = 1023;
function isMobile()  { return innerWidth <= MOBILE_MAX; }
function isTablet()  { return innerWidth > MOBILE_MAX && innerWidth <= TABLET_MAX; }
function isDesktop() { return innerWidth > TABLET_MAX; }

async function fetchJSON(endpoint) {
  const res = await fetch(endpoint, { credentials: 'include' });
  if (!res.ok) throw new Error(`${endpoint}: ${res.status}`);
  const json = await res.json();
  if (json.success && json.data) return json.data;
  if (Array.isArray(json)) return json;
  return json;
}

// ── State ───────────────────────────────────────────────────────
let albums = [];
let currentAlbum = null;
let cfg = null;
let sidebarOpen = false;

// ── RODUX System Wait ───────────────────────────────────────────
function whenInterstellarReady(cb) {
  if (window.Interstellar?.quadTree) return cb(window.Interstellar);
  const t0 = performance.now();
  const timer = setInterval(() => {
    if (window.Interstellar?.quadTree) {
      clearInterval(timer);
      console.log('✅ Interstellar + QuadTree ready');
      cb(window.Interstellar);
    }
    if (performance.now() - t0 > 5000) {
      clearInterval(timer);
      console.error('❌ Interstellar/QuadTree timeout — falling back');
      cb(null);
    }
  }, 50);
}

function resolvePositioner(IS) {
  if (!IS) return null;
  const keys = ['RatioPosition','ratioPosition','positioner','position','pos','positionEngine'];
  for (const k of keys) {
    const v = IS[k];
    if (v && typeof v.apply === 'function') return v;
    if (typeof v === 'function' && v?.prototype?.apply) {
      try { const inst = new v({ useCSSTransform: false, roundToPixel: true }); if (inst.apply) return inst; } catch {}
    }
  }
  for (const [, v] of Object.entries(IS)) {
    if (v && typeof v.apply === 'function') return v;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// REGION LAYOUT — RatioEngine drives header/main/controls
// ═══════════════════════════════════════════════════════════════

function applyRegions() {
  if (!cfg) return;

  const vh = innerHeight;
  const vw = innerWidth;
  const R  = cfg.layout?.regions || {};
  const headerR = R.header?.ratio ?? 0.05;
  const ctrlR   = R.controls?.ratio ?? 0.08;
  const mainR   = 1 - headerR - ctrlR;

  const headerH = Math.round(vh * headerR);
  const ctrlH   = Math.round(vh * ctrlR);
  const mainH   = vh - headerH - ctrlH;

  const header = Q('artistHeader');
  const main   = Q('artistMain');
  const ctrls  = Q('artistControls');

  // Header: fixed top
  if (header) Object.assign(header.style, {
    position: 'fixed', left: '0', top: '0',
    width: px(vw), height: px(headerH),
    zIndex: '100', overflow: 'hidden',
    background: '#083D5E',
    borderBottom: '1px solid rgba(43,127,140,0.2)'
  });

  // Controls/Player: fixed bottom
  if (ctrls) Object.assign(ctrls.style, {
    position: 'fixed', left: '0', bottom: '0',
    width: px(vw), height: px(ctrlH),
    zIndex: '100', overflow: 'hidden',
    background: '#083D5E',
    borderTop: '1px solid rgba(43,127,140,0.3)'
  });

  // Main: fills between header and controls, scrolls
  if (main) Object.assign(main.style, {
    position: 'fixed',
    left: '0', top: px(headerH),
    width: px(vw), height: px(mainH),
    overflowY: 'auto', overflowX: 'hidden'
  });

  // Main split: albums region + sidebar
  const albumsEl = Q('albumsRegion');
  const infoEl   = Q('infoRegion');

  if (isMobile()) {
    // Full width grid, sidebar overlays on click
    if (albumsEl) Object.assign(albumsEl.style, {
      width: '100%', minHeight: px(mainH)
    });
    if (infoEl && !sidebarOpen) infoEl.style.display = 'none';
  } else {
    const ms = cfg.layout?.mainSplit || {};
    const leftR  = sidebarOpen ? (ms.left?.ratio ?? 0.72) : 1.0;
    const rightR = sidebarOpen ? (ms.right?.ratio ?? 0.28) : 0;
    const minR   = ms.right?.minPx ?? 320;

    const leftW  = sidebarOpen ? Math.max(0, vw - Math.max(minR, Math.round(vw * rightR))) : vw;
    const rightW = sidebarOpen ? Math.max(minR, Math.round(vw * rightR)) : 0;

    if (albumsEl) Object.assign(albumsEl.style, {
      position: 'absolute', left: '0', top: '0',
      width: px(leftW), minHeight: px(mainH)
    });
    if (infoEl) Object.assign(infoEl.style, {
      display: sidebarOpen ? 'block' : 'none',
      position: 'absolute', right: '0', top: '0',
      width: px(rightW), height: px(mainH),
      overflowY: 'auto', overflowX: 'hidden',
      background: 'rgba(8, 61, 94, 0.97)',
      borderLeft: '1px solid rgba(43,127,140,0.3)'
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// HEADER POSITIONS — RatioPosition
// ═══════════════════════════════════════════════════════════════

function applyPositions(rp, State) {
  if (!rp?.apply || !cfg) return;

  // Resolve breakpoint-specific positions
  const bp = cfg.positionBreakpoints || {};
  let P = { ...(cfg.positions || {}) };

  // Merge breakpoint overrides
  for (const [, bpCfg] of Object.entries(bp)) {
    const min = bpCfg.minWidth ?? 0;
    const max = bpCfg.maxWidth ?? 99999;
    if (innerWidth >= min && innerWidth <= max && bpCfg.positions) {
      for (const [key, override] of Object.entries(bpCfg.positions)) {
        P[key] = { ...P[key], ...override };
      }
    }
  }

  if (P.brandLogo)  rp.apply(Q('brandLogo'),  Q('artistHeader'), P.brandLogo,  State);
  if (P.artistName) rp.apply(Q('artistName'), Q('artistHeader'), P.artistName, State);
  if (P.topNav)     rp.apply(Q('topNav'),     Q('artistHeader'), P.topNav,     State);
  if (P.playerControls) rp.apply(Q('playerControls'), Q('artistControls'), P.playerControls, State);
}

// ═══════════════════════════════════════════════════════════════
// ALBUM GRID — QuadTree tile layout
// ═══════════════════════════════════════════════════════════════

function buildAlbumGrid(albumsData) {
  const gridEl = Q('albumsRegion');
  if (!gridEl) return;
  gridEl.innerHTML = '';
  gridEl.style.position = 'relative';

  albumsData.forEach(album => {
    const img = document.createElement('img');
    img.src = album.cover_url;
    img.alt = album.name;
    img.dataset.albumId = album.id;
    img.dataset.catalogue = album.catalogue || '';
    img.className = 'album-cover';
    Object.assign(img.style, {
      opacity: '0', transition: 'opacity 0.3s ease', cursor: 'pointer', borderRadius: '1px'
    });
    img.addEventListener('load', () => { img.style.opacity = '1'; });
    img.addEventListener('error', () => { img.src = '/images/default-album-cover.png'; img.style.opacity = '1'; });
    img.addEventListener('click', () => onAlbumClick(album, img));
    gridEl.appendChild(img);
  });

  console.log(`✅ Built ${albumsData.length} album covers`);
}

function layoutGrid() {
  if (!cfg) return;
  const qtCfg = cfg.quadTree?.albumGrid;
  if (!qtCfg?.enabled) return;

  const gridEl = Q('albumsRegion');
  if (!gridEl) return;
  const covers = Array.from(gridEl.querySelectorAll('.album-cover'));
  if (covers.length === 0) return;

  const w = gridEl.clientWidth;
  if (w <= 0) return;

  const bucket = (w < 520) ? 'mobile' : (w < 880) ? 'tablet' : (w > 1400) ? 'ultra' : 'desktop';
  const maxCols = qtCfg.columns?.[bucket]?.max ?? 4;
  const gap     = qtCfg.gap?.px ?? 12;
  const aspect  = qtCfg.tile?.aspect ?? 1.0;
  const marginPct = qtCfg.margin?.pct ?? 0.015;

  const margin = Math.round(w * marginPct);
  const availW = w - (margin * 2);
  const tileW  = Math.floor((availW - (gap * (maxCols - 1))) / maxCols);
  const tileH  = Math.round(tileW / aspect);
  const cols   = Math.max(1, Math.min(maxCols, Math.floor((availW + gap) / (tileW + gap))));
  const rows   = Math.ceil(covers.length / cols);

  covers.forEach((cover, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    Object.assign(cover.style, {
      position: 'absolute',
      left:   px(margin + col * (tileW + gap)),
      top:    px(margin + row * (tileH + gap)),
      width:  px(tileW),
      height: px(tileH),
      objectFit: 'cover'
    });
  });

  const totalH = (margin * 2) + rows * tileH + Math.max(0, rows - 1) * gap;
  gridEl.style.height = px(totalH);
}

// ═══════════════════════════════════════════════════════════════
// SIDEBAR — Album detail, collapsible sections
// ═══════════════════════════════════════════════════════════════

async function onAlbumClick(album, imgEl) {
  const allCovers = document.querySelectorAll('.album-cover');
  const wasSelected = imgEl.dataset.selected === 'true';

  allCovers.forEach(c => { c.dataset.selected = 'false'; c.style.outline = 'none'; });

  if (wasSelected) {
    closeSidebar();
    currentAlbum = null;
    return;
  }

  imgEl.dataset.selected = 'true';
  imgEl.style.outline = '2px solid #3AA0A0';

  try {
    const full = await fetchJSON(`/api/albums/${album.id}`);
    currentAlbum = full;
    renderSidebar(full, album.cover_url);
    openSidebar();
  } catch (err) {
    console.error('Failed to load album detail:', err);
  }
}

function renderSidebar(album, coverUrl) {
  const el = Q('infoRegion');
  if (!el) return;

  const typo = cfg.sidebar?.typography || {};
  const fmtDur = (d) => {
    if (!d) return '';
    if (typeof d === 'string' && d.includes(':')) return d;
    const s = parseInt(d); if (isNaN(s)) return d;
    return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  };

  const songs = (album.songs || []).map((s, i) =>
    `<div class="ip-track" data-sid="${s.id}" data-aid="${album.id}">
       <span>${s.track_id || (i+1)}. ${s.name}</span>
       <span style="font-family:monospace;font-size:${typo.duration?.fontSize||'11.5px'};color:#8ab7ce;margin-left:8px;flex-shrink:0">${fmtDur(s.duration)}</span>
     </div>`
  ).join('');

  el.innerHTML = `
    <div style="padding:12px 16px">
      <div style="text-align:right;margin-bottom:8px">
        <span id="sidebarClose" style="cursor:pointer;font-size:11px;color:#8ab7ce;border:1px solid rgba(138,183,206,0.3);padding:3px 8px;border-radius:2px">✕ Close</span>
      </div>
      <img src="${coverUrl || album.cover_url || ''}" alt="${album.name}"
           style="width:100%;max-width:${cfg.sidebar?.cover?.maxWidth||'260px'};display:block;margin:0 auto 12px auto;border-radius:2px">
      <h2 style="font-size:${typo.title?.fontSize||'17px'};font-weight:${typo.title?.fontWeight||'600'};color:#3AA0A0;margin:0 0 10px 0;padding-bottom:6px;border-bottom:1px solid rgba(43,127,140,0.4);line-height:1.25">${album.name}</h2>

      ${album.description ? `
      <details open style="margin-bottom:4px">
        <summary style="font-size:${typo.section?.fontSize||'10px'};font-weight:600;color:#8ab7ce;text-transform:uppercase;letter-spacing:1px;padding:6px 0;cursor:pointer;list-style:none">▾ About</summary>
        <p style="font-size:${typo.description?.fontSize||'12.5px'};font-weight:200;color:#8ab7ce;line-height:${typo.description?.lineHeight||'1.55'};margin:0 0 8px 0">${album.description}</p>
      </details>` : ''}

      ${album.credit ? `
      <details style="margin-bottom:4px">
        <summary style="font-size:${typo.section?.fontSize||'10px'};font-weight:600;color:#8ab7ce;text-transform:uppercase;letter-spacing:1px;padding:6px 0;cursor:pointer;list-style:none">▸ Credits</summary>
        <p style="font-size:${typo.credit?.fontSize||'11.5px'};font-weight:200;font-style:italic;color:#829D9E;line-height:1.45;margin:0 0 8px 0">${album.credit}</p>
      </details>` : ''}

      <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:${typo.meta?.fontSize||'11px'};padding:8px 0;border-top:1px solid rgba(43,127,140,0.2)">
        ${album.catalogue ? `<span style="color:#0AAAC3;font-weight:600;font-family:monospace;font-size:12px">${album.catalogue}</span>` : ''}
        ${album.production_date ? `<span style="color:#7E8D9B">${album.production_date}</span>` : ''}
        ${album.release_date ? `<span style="color:#0AAAC3">${album.release_date}</span>` : ''}
      </div>

      ${album.songs?.length ? `
      <details open style="margin-top:4px">
        <summary style="font-size:${typo.section?.fontSize||'10px'};font-weight:600;color:#8ab7ce;text-transform:uppercase;letter-spacing:1px;padding:6px 0;cursor:pointer;list-style:none">▾ Tracks (${album.songs.length})</summary>
        <div id="sidebarTracks">${songs}</div>
      </details>` : ''}
    </div>
  `;

  // Wire close
  Q('sidebarClose')?.addEventListener('click', () => {
    document.querySelectorAll('.album-cover').forEach(c => { c.dataset.selected = 'false'; c.style.outline = 'none'; });
    closeSidebar();
    currentAlbum = null;
  });

  // Wire track clicks
  el.querySelectorAll('.ip-track').forEach(t => {
    Object.assign(t.style, {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '5px 6px', fontSize: typo.track?.fontSize || '12.5px',
      fontWeight: '200', color: '#cadbda', cursor: 'pointer',
      borderBottom: '1px solid rgba(224,224,224,0.06)', transition: 'background 0.15s'
    });
    t.addEventListener('mouseenter', () => { t.style.background = 'rgba(43,127,140,0.25)'; });
    t.addEventListener('mouseleave', () => {
      t.style.background = t.dataset.playing === 'true' ? '#19606b' : 'transparent';
    });
    t.addEventListener('click', () => {
      const sid = parseInt(t.dataset.sid);
      const aid = parseInt(t.dataset.aid);
      if (window.audioPlayer) window.audioPlayer.playSong(sid, aid);
      el.querySelectorAll('.ip-track').forEach(x => {
        x.dataset.playing = 'false';
        x.style.background = 'transparent';
        x.style.borderLeft = 'none';
      });
      t.dataset.playing = 'true';
      t.style.background = '#19606b';
      t.style.borderLeft = '3px solid #3AA0A0';
    });
  });
}

function openSidebar() {
  sidebarOpen = true;
  applyRegions();
  requestAnimationFrame(layoutGrid);

  if (isMobile()) {
    const infoEl = Q('infoRegion');
    if (infoEl) Object.assign(infoEl.style, {
      display: 'block', position: 'fixed',
      top: '0', right: '0',
      width: '85vw', maxWidth: '380px',
      height: '100vh', zIndex: '200',
      overflowY: 'auto', background: 'rgba(8,61,94,0.98)',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.5)'
    });
  }
}

function closeSidebar() {
  sidebarOpen = false;
  applyRegions();
  requestAnimationFrame(layoutGrid);
}

// ═══════════════════════════════════════════════════════════════
// KEYBOARD
// ═══════════════════════════════════════════════════════════════

function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    switch (e.key) {
      case ' ':
        e.preventDefault();
        if (window.audioPlayer?.currentAudio) {
          window.audioPlayer.currentAudio.paused ? window.audioPlayer.play() : window.audioPlayer.pause();
        }
        break;
      case 'ArrowRight': e.preventDefault(); window.audioPlayer?.nextTrack(); break;
      case 'ArrowLeft':  e.preventDefault(); window.audioPlayer?.previousTrack(); break;
      case 'Escape':
        e.preventDefault();
        document.querySelectorAll('.album-cover').forEach(c => { c.dataset.selected = 'false'; c.style.outline = 'none'; });
        closeSidebar();
        currentAlbum = null;
        break;
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// STYLE APPLICATION — from config, no external CSS files needed
// ═══════════════════════════════════════════════════════════════

function applyTypography() {
  if (!cfg) return;
  const t = isMobile() ? (cfg.typography?.mobile?.header || cfg.typography?.header) : cfg.typography?.header;
  if (!t) return;

  const logo = Q('brandLogo')?.querySelector('img');
  if (logo && t.logo?.width) logo.style.width = t.logo.width;

  const name = Q('artist-name');
  if (name && t.artistName) {
    Object.assign(name.style, {
      fontSize: t.artistName.fontSize || '15px',
      fontWeight: t.artistName.fontWeight || '200',
      letterSpacing: t.artistName.letterSpacing || '0.5px',
      color: '#cadbda', whiteSpace: 'nowrap'
    });
  }

  const nav = Q('topNav');
  if (nav && t.nav) {
    Object.assign(nav.style, {
      display: 'flex', alignItems: 'center',
      gap: t.nav.gap || '16px', fontSize: t.nav.fontSize || '13px'
    });
    nav.querySelectorAll('a').forEach(a => {
      Object.assign(a.style, { color: '#cadbda', textDecoration: 'none' });
    });
    nav.querySelectorAll('button').forEach(btn => {
      Object.assign(btn.style, {
        background: 'none', border: '1px solid rgba(202,219,218,0.4)',
        color: '#cadbda', padding: '3px 10px', cursor: 'pointer',
        fontSize: t.nav.fontSize || '13px', borderRadius: '2px'
      });
    });
    const cartImg = nav.querySelector('#cartBtn img');
    if (cartImg) Object.assign(cartImg.style, { width: '16px', height: '16px', display: 'block' });
    const cartCount = Q('cartCount');
    if (cartCount) Object.assign(cartCount.style, { display: 'none' });
  }
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

(async function init() {
  // Player shim
  window.apiClient = {
    getAlbum: (id) => fetchJSON(`/api/albums/${id}`),
    getSong:  (id) => fetchJSON(`/api/songs/${id}`)
  };

  // Load config
  const cfgRes = await fetch('/config/pages/roderick.json', { cache: 'no-store' });
  if (!cfgRes.ok) throw new Error('roderick.json not found');
  cfg = await cfgRes.json();

  // Fetch albums
  try {
    albums = await fetchJSON('/api/albums');
    console.log(`📡 Loaded ${albums.length} albums from flash`);
  } catch (err) {
    console.error('❌ Failed to load albums:', err);
    const g = Q('albumsRegion');
    if (g) g.innerHTML = '<p style="color:#cadbda;padding:20px">Failed to load music collection.</p>';
    return;
  }

  albums.sort((a, b) => a.id - b.id);
  buildAlbumGrid(albums);

  const nameEl = Q('artist-name');
  if (nameEl && albums.length > 0) nameEl.textContent = albums[0].artist_name || 'Roderick Shoolbraid';

  setupKeyboard();

  whenInterstellarReady(async (IS) => {
    const State = IS?.State || IS?.ViewportState || IS?.state || null;
    const rp = resolvePositioner(IS);

    function render() {
      State?.measure?.();
      applyRegions();
      applyPositions(rp, State);
      applyTypography();
      layoutGrid();
    }

    // Debounced resize
    let rTimer;
    addEventListener('resize', () => { clearTimeout(rTimer); rTimer = setTimeout(render, 60); });

    await applyPaintForPage(cfg);
    render();

    document.body.style.opacity = '1';
    document.body.style.transition = 'opacity 0.15s ease';
    console.log('🎉 Roderick.js V5.3 initialized');
  });
})();