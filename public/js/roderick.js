// ============================================================================
// public/js/roderick.js — V5 Session 3 (RODUX Stack / Flash Layer)
//
// Page controller for the Roderick Shoolbraid artist page.
// Owns: data fetch, DOM creation, QuadTree grid, album detail sidebar, player.
//
// Layout pipeline:
//   StateJS → RatioLayoutEngine (CSS vars for regions)
//           → RatioPosition (header elements, sidebar elements)
//           → QuadTree (album grid tile positions)
//           → paint-applier (colours, typography from paint.json)
//
// NO inline CSS Grid. NO inline styles on HTML. Everything from JSON config.
// ============================================================================

import { applyPaintForPage } from './paint-applier.js';

// ── Helpers ─────────────────────────────────────────────────────
const Q  = (id) => document.getElementById(id);
const px = (n) => `${Math.round(n)}px`;

const MOBILE_MAX = 767;
const TABLET_MAX = 1023;
function isMobile()  { return innerWidth <= MOBILE_MAX; }
function isDesktop() { return innerWidth > TABLET_MAX; }

// ── Data fetch (flash-backed API) ───────────────────────────────
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

// ── Wait for Interstellar system ────────────────────────────────
function whenReady(cb) {
  if (window.Interstellar?.position) return cb(window.Interstellar);
  const t0 = performance.now();
  const timer = setInterval(() => {
    if (window.Interstellar?.position) {
      clearInterval(timer);
      console.log('✅ Interstellar ready');
      cb(window.Interstellar);
    }
    if (performance.now() - t0 > 5000) {
      clearInterval(timer);
      console.error('❌ Interstellar timeout');
    }
  }, 50);
}

// ── Album Grid: DOM Creation ────────────────────────────────────
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

// ── Album Click → Sidebar ────────────────────────────────────────
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

// ── Sidebar: Render ─────────────────────────────────────────────
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
      <button id="sidebarCloseBtn">✕</button>
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
        ${album.production_date ? `<span class="date">${album.production_date}</span>` : ''}
        ${album.release_date ? `<span class="released">${album.release_date}</span>` : ''}
      </div>

      ${(album.songs?.length > 0) ? `
      <details class="sidebar-section" open>
        <summary>Tracks (${album.songs.length})</summary>
        <ul class="sidebar-songs">${songsHTML}</ul>
      </details>` : ''}
    </div>
  `;

  // Wire close button
  Q('sidebarCloseBtn')?.addEventListener('click', () => {
    document.querySelectorAll('.album-cover').forEach(c => c.classList.remove('selected'));
    closeSidebar();
    currentAlbum = null;
  });

  // Wire song clicks
  sidebar.querySelectorAll('.sidebar-songs li').forEach(li => {
    li.addEventListener('click', () => {
      const songId = li.dataset.songId;
      const albumId = li.dataset.albumId;
      if (window.audioPlayer) {
        window.audioPlayer.playSong(parseInt(songId), parseInt(albumId));
      }
      sidebar.querySelectorAll('.sidebar-songs li').forEach(l => l.classList.remove('playing'));
      li.classList.add('playing');
    });
  });
}

// ── Sidebar: Open / Close ───────────────────────────────────────
function openSidebar() {
  sidebarOpen = true;
  const sidebar = Q('infoRegion');
  const overlay = Q('mobileOverlay');

  if (sidebar) sidebar.classList.add('open');
  if (isMobile() && overlay) {
    overlay.style.display = 'block';
    overlay.onclick = () => {
      document.querySelectorAll('.album-cover').forEach(c => c.classList.remove('selected'));
      closeSidebar();
      currentAlbum = null;
    };
  }

  // Re-layout regions (sidebar takes space from grid on desktop)
  requestAnimationFrame(render);
}

function closeSidebar() {
  sidebarOpen = false;
  const sidebar = Q('infoRegion');
  const overlay = Q('mobileOverlay');

  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.style.display = 'none';

  requestAnimationFrame(render);
}

// ── Layout: Regions (RODUX — RatioEngine drives CSS vars, we size containers) ──
function applyRegions() {
  if (!cfg) return;

  const vw = innerWidth;
  const vh = innerHeight;

  // Header and footer heights come from RatioLayoutEngine CSS vars
  // but we need to measure them for main area calculation
  const header = Q('artistHeader');
  const footer = Q('artistControls');
  const main   = Q('artistMain');
  const albumsEl = Q('albumsRegion');
  const info   = Q('infoRegion');

  const headerH = header?.offsetHeight || 44;
  const footerH = footer?.offsetHeight || 40;
  const mainH   = vh - headerH - footerH;

  if (main) {
    main.style.height = px(mainH);
  }

  if (isMobile()) {
    // Mobile: full-width grid, sidebar overlays
    if (albumsEl) {
      Object.assign(albumsEl.style, {
        left: '0', top: '0',
        width: px(vw), height: px(mainH)
      });
    }
    if (info) {
      // Mobile sidebar is position:fixed via CSS, no JS sizing needed
    }
  } else {
    // Desktop/Tablet: grid + sidebar split
    const ms = cfg.layout?.mainSplit;
    const rightMinPx = ms?.right?.minPx ?? 340;
    const leftRatio  = ms?.left?.ratio  ?? 0.75;

    let gridW, sidebarW;

    if (sidebarOpen) {
      sidebarW = Math.max(rightMinPx, Math.round(vw * (ms?.right?.ratio ?? 0.25)));
      gridW    = vw - sidebarW;
    } else {
      gridW    = vw;
      sidebarW = 0;
    }

    if (albumsEl) {
      Object.assign(albumsEl.style, {
        left: '0', top: '0',
        width: px(gridW), height: px(mainH)
      });
    }
    if (info) {
      Object.assign(info.style, {
        left: px(gridW), top: '0',
        width: px(sidebarW), height: px(mainH)
      });
    }
  }
}

// ── Layout: Header positions (RatioPosition) ────────────────────
function applyHeaderPositions(IS) {
  if (!IS?.position?.apply || !cfg) return;
  const rp = IS.position;
  const State = IS.state || null;
  const P = cfg.positions || {};

  // Apply breakpoint-specific positions if available
  const bp = isMobile() ? 'mobile' : (innerWidth <= TABLET_MAX ? 'tablet' : 'desktop');
  const bpOverrides = cfg.positionBreakpoints?.[bp]?.positions || {};

  // Merge base positions with breakpoint overrides
  const pos = (key) => ({ ...P[key], ...bpOverrides[key] });

  if (P.brandLogo)  rp.apply(Q('brandLogo'),  Q('artistHeader'), pos('brandLogo'),  State);
  if (P.artistName) rp.apply(Q('artistName'), Q('artistHeader'), pos('artistName'), State);
  if (P.topNav)     rp.apply(Q('topNav'),     Q('artistHeader'), pos('topNav'),     State);
}

// ── Layout: QuadTree Album Grid ─────────────────────────────────
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
  const maxCols = qtCfg.columns?.[bucket]?.max ?? 6;
  const gap     = qtCfg.gap?.px ?? 16;
  const aspect  = qtCfg.tile?.aspect ?? 1.0;

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

  // Set content height so container scrolls
  gridEl.style.height = px(rows * tileH + Math.max(0, rows - 1) * gap + 16);
  console.log(`✅ Grid: ${cols}×${rows} @ ${tileW}px, margin=${margin}px`);
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
      case 'ArrowRight': e.preventDefault(); window.audioPlayer?.nextTrack(); break;
      case 'ArrowLeft':  e.preventDefault(); window.audioPlayer?.previousTrack(); break;
      case 'Escape':
        e.preventDefault();
        document.querySelectorAll('.album-cover').forEach(c => c.classList.remove('selected'));
        closeSidebar();
        currentAlbum = null;
        break;
    }
  });
}

// ── Render (called on init + resize) ────────────────────────────
let _IS = null;

function render() {
  if (_IS) {
    _IS.state?.measure?.();
    _IS.layout?.apply?.();
  }
  applyRegions();
  applyHeaderPositions(_IS);
  layoutGrid();
}

// ── Init ────────────────────────────────────────────────────────
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

  // Fetch album data
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
  setupKeyboard();

  // Wait for RODUX stack
  whenReady(async (IS) => {
    _IS = IS;

    if (document.readyState === 'loading') {
      await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
    }

    // Debounced resize
    let resizeTimer;
    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(render, 60);
    });

    await applyPaintForPage(cfg);
    render();

    // Reveal
    document.body.style.opacity = '1';
    document.body.style.transition = 'opacity 0.2s ease';

    console.log('🎉 Roderick.js V5 Session 3 initialized');
  });
})();