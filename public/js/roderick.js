// ============================================================================
// public/js/roderick.js — V5 Session 3b (RODUX Stack / Flash Layer)
//
// Single controller for the Roderick Shoolbraid artist page.
// Owns: data fetch, DOM creation, region layout, QuadTree grid,
//       album detail sidebar, player wiring.
//
// Layout pipeline:
//   roderick.json → applyRegions()  [header/main sizing, absolute pos]
//                 → applyPositions() [RatioPosition for header elements]
//                 → layoutGrid()     [QuadTree for album tiles]
//
// Footer (#artistControls) is position:fixed in CSS — not laid out by JS.
// albumsRegion has overflow-y:auto so grid content scrolls.
// Sidebar hidden until album click, then RODUX positions it.
//
// Session 3b fixes:
//   - ResizeObserver guarded to prevent layout thrashing loop
//   - HTML and JS aligned (no CSS Grid, pure absolute positioning)
//   - No hover scale on album covers
// ============================================================================

import { applyPaintForPage } from './paint-applier.js';

// ── Helpers ─────────────────────────────────────────────────────
const Q  = (id) => document.getElementById(id);
const px = (n) => `${Math.round(n)}px`;

const MOBILE_MAX = 767;
const TABLET_MAX = 1023;
function isMobile()  { return innerWidth <= MOBILE_MAX; }
function isDesktop() { return innerWidth > TABLET_MAX; }

// Footer is position:fixed — measure its actual height
function footerHeight() {
  const f = Q('artistControls');
  return f ? f.offsetHeight : 40;
}

// ── Data fetch ──────────────────────────────────────────────────
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
let _layoutInProgress = false;  // guard against ResizeObserver loop

// ── Wait for Interstellar + QuadTree ────────────────────────────
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
      console.error('❌ Interstellar/QuadTree timeout');
    }
  }, 50);
}

function resolvePositioner(IS) {
  const keys = ['RatioPosition','ratioPosition','positioner','position','pos','positionEngine']
    .filter(k => k in IS);
  for (const k of keys) {
    const v = IS[k];
    if (v && typeof v.apply === 'function') return v;
    if (typeof v === 'function' && v?.prototype?.apply) {
      try {
        const inst = new v({ useCSSTransform: false, roundToPixel: true });
        if (inst.apply) return inst;
      } catch {}
    }
  }
  for (const [, v] of Object.entries(IS)) {
    if (v && typeof v.apply === 'function') return v;
  }
  console.error('[roderick] RatioPosition not found');
  return null;
}

// ═══════════════════════════════════════════════════════════════
// DOM CREATION
// ═══════════════════════════════════════════════════════════════

function buildAlbumGrid(albumsData) {
  const gridEl = Q('albumsRegion');
  if (!gridEl) return;
  gridEl.innerHTML = '';

  albumsData.forEach(album => {
    const img = document.createElement('img');
    img.src = album.cover_url;
    img.alt = album.name;
    img.dataset.albumId = album.id;
    img.dataset.catalogue = album.catalogue || '';
    img.className = 'album-cover';

    // Fade in on load
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.3s ease';
    img.addEventListener('load', () => { img.style.opacity = '1'; });
    img.addEventListener('error', () => {
      img.src = '/images/default-album-cover.png';
      img.style.opacity = '1';
    });

    img.addEventListener('click', () => onAlbumClick(album, img));
    gridEl.appendChild(img);
  });

  console.log(`✅ Built ${albumsData.length} album covers`);
}

// ═══════════════════════════════════════════════════════════════
// ALBUM CLICK → SIDEBAR
// ═══════════════════════════════════════════════════════════════

async function onAlbumClick(album, imgEl) {
  const allCovers = document.querySelectorAll('.album-cover');
  const wasSelected = imgEl.classList.contains('selected');

  allCovers.forEach(c => c.classList.remove('selected'));

  if (wasSelected) {
    closeSidebar();
    currentAlbum = null;
    return;
  }

  imgEl.classList.add('selected');

  try {
    const full = await fetchJSON(`/api/albums/${album.id}`);
    currentAlbum = full;
    renderSidebar(full, album.cover_url);
    openSidebar();
  } catch (err) {
    console.error('Failed to load album detail:', err);
  }
}

// ── Sidebar Render ──────────────────────────────────────────────
function renderSidebar(album, coverUrl) {
  const sidebar = Q('infoRegion');
  if (!sidebar) return;

  const fmtDur = (d) => {
    if (!d) return '';
    if (typeof d === 'string' && d.includes(':')) return d;
    const s = parseInt(d);
    if (isNaN(s)) return String(d);
    return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  };

  const songsHTML = (album.songs || []).map((s, i) => `
    <li data-song-id="${s.id}" data-album-id="${album.id}">
      <span>${s.track_id || (i+1)}. ${s.name}</span>
      <span class="song-dur">${fmtDur(s.duration)}</span>
    </li>
  `).join('');

  sidebar.innerHTML = `
    <div class="sidebar-close">
      <button id="sidebarCloseBtn">✕ Close</button>
    </div>
    <div class="sidebar-inner">
      <img class="sidebar-album-cover" src="${coverUrl || album.cover_url || ''}" alt="${album.name}">
      <h2 class="sidebar-album-title">${album.name}</h2>

      ${album.description ? `
      <details class="sidebar-section" open>
        <summary>About</summary>
        <p class="sidebar-description">${album.description}</p>
      </details>` : ''}

      ${album.credit ? `
      <details class="sidebar-section">
        <summary>Credits</summary>
        <p class="sidebar-credits">${album.credit}</p>
      </details>` : ''}

      <div class="sidebar-meta">
        ${album.catalogue ? `<span class="cat">${album.catalogue}</span>` : ''}
        ${album.production_date ? `<span>${album.production_date}</span>` : ''}
        ${album.release_date ? `<span>${album.release_date}</span>` : ''}
      </div>

      ${(album.songs && album.songs.length > 0) ? `
      <details class="sidebar-section" open>
        <summary>Tracks (${album.songs.length})</summary>
        <ul class="sidebar-songs">${songsHTML}</ul>
      </details>` : ''}
    </div>
  `;

  // Wire close
  Q('sidebarCloseBtn')?.addEventListener('click', () => {
    document.querySelectorAll('.album-cover').forEach(c => c.classList.remove('selected'));
    closeSidebar();
    currentAlbum = null;
  });

  // Wire song clicks
  sidebar.querySelectorAll('.sidebar-songs li').forEach(li => {
    li.addEventListener('click', () => {
      const songId = parseInt(li.dataset.songId);
      const albumId = parseInt(li.dataset.albumId);
      if (window.audioPlayer) {
        window.audioPlayer.playSong(songId, albumId);
      }
      sidebar.querySelectorAll('.sidebar-songs li').forEach(l => l.classList.remove('playing'));
      li.classList.add('playing');
    });
  });
}

function openSidebar() {
  const sidebar = Q('infoRegion');
  const overlay = Q('mobileOverlay');
  if (sidebar) sidebar.classList.add('open');
  sidebarOpen = true;

  if (isMobile() && overlay) {
    overlay.style.display = 'block';
    overlay.onclick = () => {
      document.querySelectorAll('.album-cover').forEach(c => c.classList.remove('selected'));
      closeSidebar();
      currentAlbum = null;
    };
  }

  // Re-layout everything (main split changes)
  render();
}

function closeSidebar() {
  const sidebar = Q('infoRegion');
  const overlay = Q('mobileOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.style.display = 'none';
  sidebarOpen = false;

  render();
}

// ═══════════════════════════════════════════════════════════════
// LAYOUT — RODUX Region Positioning
// ═══════════════════════════════════════════════════════════════

function applyRegions() {
  if (!cfg) return;
  const vw = innerWidth;
  const vh = innerHeight;
  const fh = footerHeight();

  const headerR = cfg.layout?.regions?.header?.ratio ?? 0.06;
  const headerH = Math.round(vh * headerR);
  const mainH   = vh - headerH - fh;

  const header   = Q('artistHeader');
  const main     = Q('artistMain');
  const albumsEl = Q('albumsRegion');
  const info     = Q('infoRegion');

  // Header
  if (header) {
    Object.assign(header.style, {
      position: 'absolute', left: '0', top: '0',
      width: px(vw), height: px(headerH)
    });
    document.documentElement.style.setProperty('--header-height', px(headerH));
  }

  // Main
  if (main) {
    Object.assign(main.style, {
      position: 'absolute', left: '0', top: px(headerH),
      width: px(vw), height: px(mainH)
    });
  }

  if (isMobile()) {
    // Mobile: full width grid, sidebar overlays separately
    if (albumsEl) Object.assign(albumsEl.style, {
      left: '0', top: '0',
      width: px(vw), height: px(mainH)
    });
    if (info && !sidebarOpen) info.style.display = 'none';
  } else {
    // Desktop/Tablet
    const ms     = cfg.layout?.mainSplit;
    const leftR  = ms?.left?.ratio  ?? 0.75;
    const rightR = ms?.right?.ratio ?? 0.25;
    const minR   = ms?.right?.minPx ?? 320;

    if (sidebarOpen) {
      const rightW = Math.max(minR, Math.round(vw * rightR));
      const leftW  = vw - rightW;

      if (albumsEl) Object.assign(albumsEl.style, {
        left: '0', top: '0',
        width: px(leftW), height: px(mainH)
      });
      if (info) Object.assign(info.style, {
        display: 'block',
        left: px(leftW), top: '0',
        width: px(rightW), height: px(mainH)
      });
    } else {
      // No sidebar — grid takes full width
      if (albumsEl) Object.assign(albumsEl.style, {
        left: '0', top: '0',
        width: px(vw), height: px(mainH)
      });
    }
  }
}

// ── Header Positions (RatioPosition) ────────────────────────────
function applyPositions(rp, State) {
  if (!rp?.apply || !cfg) return;
  const P = cfg.positions || {};
  const header = Q('artistHeader');

  if (P.brandLogo)  rp.apply(Q('brandLogo'),  header, P.brandLogo,  State);
  if (P.artistName) rp.apply(Q('artistName'), header, P.artistName, State);
  if (P.topNav)     rp.apply(Q('topNav'),     header, P.topNav,     State);
}

// ── QuadTree Album Grid ─────────────────────────────────────────
function layoutGrid() {
  if (!cfg) return;

  const qtCfg = cfg.quadTree?.albumGrid;
  if (!qtCfg?.enabled) {
    console.warn('⚠️ QuadTree albumGrid not enabled');
    return;
  }

  const gridEl = Q('albumsRegion');
  if (!gridEl) return;

  const covers = Array.from(gridEl.querySelectorAll('.album-cover'));
  if (covers.length === 0) return;

  const w = gridEl.clientWidth;
  if (w <= 0) return;

  const bucket = (w < 520) ? 'mobile' : (w < 880) ? 'tablet' : (w > 1400) ? 'ultra' : 'desktop';
  const maxCols = qtCfg.columns?.[bucket]?.max ?? 4;
  const gap     = qtCfg.gap?.px ?? 16;
  const aspect  = qtCfg.tile?.aspect ?? 1.0;

  // Symmetric margin
  const marginPct = 0.02;
  const margin    = Math.round(w * marginPct);
  const availW    = w - (margin * 2);

  const tileW  = Math.floor((availW - (gap * (maxCols - 1))) / maxCols);
  const tileH  = Math.round(tileW / aspect);
  const cols   = Math.max(1, Math.min(maxCols, Math.floor((availW + gap) / (tileW + gap))));
  const rows   = Math.ceil(covers.length / cols);

  gridEl.style.position = 'relative';

  covers.forEach((cover, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    Object.assign(cover.style, {
      position: 'absolute',
      left:   px(margin + col * (tileW + gap)),
      top:    px(row * (tileH + gap)),
      width:  px(tileW),
      height: px(tileH),
      objectFit: 'cover',
    });
  });

  // Set min-height so scrolling works inside the albumsRegion
  const contentH = rows * tileH + Math.max(0, rows - 1) * gap + 16;
  gridEl.style.minHeight = `${contentH}px`;

  console.log(`✅ Grid: ${cols}×${rows} @ ${tileW}px, margin=${margin}px`);
}

// ═══════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════

let _rp = null;
let _State = null;

function render() {
  if (_layoutInProgress) return;  // prevent re-entrant calls from ResizeObserver
  _layoutInProgress = true;

  try {
    _State?.measure?.();
    applyRegions();
    applyPositions(_rp, _State);
    layoutGrid();
  } finally {
    // Release guard after a frame so ResizeObserver doesn't re-trigger immediately
    requestAnimationFrame(() => { _layoutInProgress = false; });
  }
}

// ── Keyboard ────────────────────────────────────────────────────
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
      case 'ArrowRight':
        e.preventDefault();
        window.audioPlayer?.nextTrack();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        window.audioPlayer?.previousTrack();
        break;
      case 'Escape':
        e.preventDefault();
        document.querySelectorAll('.album-cover').forEach(c => c.classList.remove('selected'));
        closeSidebar();
        currentAlbum = null;
        break;
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

(async function init() {
  // Shim for player.js
  window.apiClient = {
    getAlbum: (id) => fetchJSON(`/api/albums/${id}`),
    getSong:  (id) => fetchJSON(`/api/songs/${id}`)
  };

  // Load page config
  const cfgRes = await fetch('/config/pages/roderick.json', { cache: 'no-store' });
  if (!cfgRes.ok) throw new Error('roderick.json not found');
  cfg = await cfgRes.json();

  // Fetch albums from flash
  try {
    albums = await fetchJSON('/api/albums');
    console.log(`📡 Loaded ${albums.length} albums from flash`);
  } catch (err) {
    console.error('❌ Failed to load albums:', err);
    const gridEl = Q('albumsRegion');
    if (gridEl) gridEl.innerHTML = '<p style="padding:20px;">Failed to load music collection.</p>';
    return;
  }

  albums.sort((a, b) => a.id - b.id);
  buildAlbumGrid(albums);

  // Artist name
  const artistNameEl = Q('artist-name');
  if (artistNameEl && albums.length > 0) {
    artistNameEl.textContent = albums[0].artist_name || 'Roderick Shoolbraid';
  }

  setupKeyboard();

  // Wait for RODUX stack
  whenInterstellarReady(async (IS) => {
    _State = IS.State || IS.ViewportState || IS.state || null;
    _rp = resolvePositioner(IS);

    if (document.readyState === 'loading') {
      await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
    }

    // Debounced resize
    let resizeTimer;
    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(render, 80);
    });

    // NO ResizeObserver — render() already handles everything via resize + sidebar open/close.
    // The ResizeObserver was causing infinite layout loops.

    await applyPaintForPage(cfg);
    render();

    // Reveal
    document.body.style.opacity = '1';
    document.body.style.transition = 'opacity 0.2s ease';

    console.log('🎉 roderick.js V5 Session 3b initialized');
  });
})();