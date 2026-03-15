// ============================================================================
// public/js/roderick.js — V6 (RODUX Stack / CSS-Var-Driven Layout)
//
// Single controller for the Roderick Shoolbraid artist page.
// Owns: data fetch, DOM creation, region layout, QuadTree grid,
//       album detail sidebar, player wiring.
//
// V6 PRINCIPLE: JS sets CSS custom properties, CSS does all rendering.
//   roderick.json → setRegionVars()  [--header-h, --main-top, --main-h, etc.]
//                 → layoutGrid()     [--grid-cols, --tile-w, --tile-h, --grid-gap, --grid-margin]
//
// Footer (#artistControls) is position:fixed in CSS — not laid out here.
// Sidebar uses .open class toggle — CSS handles positioning/sizing.
// No Object.assign(el.style, ...) anywhere.
// ============================================================================

import { applyPaintForPage } from './paint-applier.js';

// ── Helpers ─────────────────────────────────────────────────────
const Q  = (id) => document.getElementById(id);

const MOBILE_MAX = 767;
const TABLET_MAX = 1023;
function isMobile()  { return innerWidth <= MOBILE_MAX; }
function isDesktop() { return innerWidth > TABLET_MAX; }

// Footer is position:fixed — measure its actual rendered height
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
let _layoutInProgress = false;

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

    img.addEventListener('load',  () => { img.classList.add('loaded'); });
    img.addEventListener('error', () => {
      img.src = '/images/default-album-cover.png';
      img.classList.add('loaded');
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
  document.body.classList.add('sidebar-open');
  sidebarOpen = true;

  if (isMobile() && overlay) {
    overlay.classList.add('visible');
    overlay.onclick = () => {
      document.querySelectorAll('.album-cover').forEach(c => c.classList.remove('selected'));
      closeSidebar();
      currentAlbum = null;
    };
  }

  // Recalculate layout vars (sidebar changes grid width)
  render();
}

function closeSidebar() {
  const sidebar = Q('infoRegion');
  const overlay = Q('mobileOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('visible');
  document.body.classList.remove('sidebar-open');
  sidebarOpen = false;

  render();
}


// ═══════════════════════════════════════════════════════════════
// LAYOUT — CSS Custom Property Pipeline
//
// Instead of el.style.left = '340px', we set CSS vars on :root
// and let CSS rules consume them. This is the RODUX way.
// ═══════════════════════════════════════════════════════════════

function setRegionVars() {
  if (!cfg) return;
  const root = document.documentElement;
  const vw = innerWidth;
  const vh = innerHeight;
  const fh = footerHeight();

  const headerR = cfg.layout?.regions?.header?.ratio ?? 0.06;
  const headerH = Math.round(vh * headerR);
  const mainH   = vh - headerH - fh;

  // ── Core region vars ─────────────────────────────────────────
  root.style.setProperty('--header-height', `${headerH}px`);
  root.style.setProperty('--main-top',      `${headerH}px`);
  root.style.setProperty('--main-height',   `${mainH}px`);
  root.style.setProperty('--vw',            `${vw}px`);

  // ── Sidebar split vars ───────────────────────────────────────
  if (!isMobile() && sidebarOpen) {
    const ms     = cfg.layout?.mainSplit;
    const rightR = ms?.right?.ratio ?? 0.25;
    const minR   = ms?.right?.minPx ?? 320;
    const rightW = Math.max(minR, Math.round(vw * rightR));
    const leftW  = vw - rightW;

    root.style.setProperty('--albums-width',  `${leftW}px`);
    root.style.setProperty('--sidebar-width', `${rightW}px`);
    root.style.setProperty('--sidebar-left',  `${leftW}px`);
  } else {
    root.style.setProperty('--albums-width',  `${vw}px`);
    root.style.setProperty('--sidebar-width', '0px');
    root.style.setProperty('--sidebar-left',  `${vw}px`);
  }

  // ── Breakpoint data attribute ────────────────────────────────
  const bp = isMobile() ? 'mobile' : isDesktop() ? 'desktop' : 'tablet';
  root.dataset.breakpoint = bp;
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

  // Set grid vars on the grid element itself
  const gs = gridEl.style;
  gs.setProperty('--grid-cols',   cols);
  gs.setProperty('--grid-tile-w', `${tileW}px`);
  gs.setProperty('--grid-tile-h', `${tileH}px`);
  gs.setProperty('--grid-gap',    `${gap}px`);
  gs.setProperty('--grid-margin', `${margin}px`);
  gs.setProperty('--grid-content-h', `${rows * tileH + Math.max(0, rows - 1) * gap + 16}px`);

  // Position each cover via absolute + calculated offsets
  // (This is still JS because QuadTree computes per-item positions)
  covers.forEach((cover, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    cover.style.setProperty('--col-offset', `${margin + col * (tileW + gap)}px`);
    cover.style.setProperty('--row-offset', `${row * (tileH + gap)}px`);
    cover.style.setProperty('--tile-w',     `${tileW}px`);
    cover.style.setProperty('--tile-h',     `${tileH}px`);
  });

  console.log(`✅ Grid: ${cols}×${rows} @ ${tileW}px, margin=${margin}px`);
}


// ═══════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════

function render() {
  if (_layoutInProgress) return;
  _layoutInProgress = true;

  try {
    setRegionVars();
    layoutGrid();
  } finally {
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
        if (window.audioPlayer?.audio) {
          window.audioPlayer.audio.paused ? window.audioPlayer.play() : window.audioPlayer.pause();
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
    if (gridEl) gridEl.innerHTML = '<p class="load-error">Failed to load music collection.</p>';
    return;
  }

  albums.sort((a, b) => a.id - b.id);
  buildAlbumGrid(albums);

  setupKeyboard();

  // Wait for RODUX stack
  whenInterstellarReady(async (IS) => {
    if (document.readyState === 'loading') {
      await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
    }

    // Debounced resize
    let resizeTimer;
    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(render, 80);
    });

    await applyPaintForPage(cfg);
    render();

    // Reveal
    document.body.classList.add('ready');

    console.log('🎉 roderick.js V6 initialized');
  });
})();