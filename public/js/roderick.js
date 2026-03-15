// ============================================================================
// public/js/roderick.js — V5 Session 3 (RODUX Stack / Flash Layer)
//
// Single controller for the Roderick Shoolbraid artist page.
// Owns: data fetch, DOM creation, QuadTree grid, album detail sidebar,
//       region layout (via RatioEngine), player wiring.
//
// ALL layout driven from config/pages/roderick.json:
//   StateJS  → measures viewport
//   RatioEngine → sizes regions (header, main, sidebar, controls)
//   QuadTree → album tile grid
//   paint.json → colors via paint-applier.js
//
// Replaces: main.js, ui-manager.js, api-client.js on this page.
// Data flow: flash.db → /api/albums (Express) → fetch → DOM → QuadTree
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
      console.error('❌ Interstellar/QuadTree timeout — falling back');
      cb(null);
    }
  }, 50);
}

function resolvePositioner(IS) {
  if (!IS) return null;
  const keys = ['RatioPosition','ratioPosition','positioner','position','pos','positionEngine'].filter(k => k in IS);
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
    if (isNaN(s)) return d;
    return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  };

  const songsHTML = (album.songs || []).map((s, i) => `
    <li data-song-id="${s.id}" data-album-id="${album.id}">
      <span>${s.track_id || (i+1)}. ${s.name}</span>
      <span class="sb-dur">${fmtDur(s.duration)}</span>
    </li>
  `).join('');

  sidebar.innerHTML = `
    <div class="sb-close">
      <button id="sidebarCloseBtn">&times;</button>
    </div>
    <div class="sb-inner">
      <img class="sb-cover" src="${coverUrl || album.cover_url || ''}" alt="${album.name}">
      <h2 class="sb-title">${album.name}</h2>

      ${album.description ? `
      <details class="sb-section" open>
        <summary>About</summary>
        <p class="sb-desc">${album.description}</p>
      </details>` : ''}

      ${album.credit ? `
      <details class="sb-section">
        <summary>Credits</summary>
        <p class="sb-credit">${album.credit}</p>
      </details>` : ''}

      <div class="sb-meta">
        ${album.catalogue ? `<span class="cat">${album.catalogue}</span>` : ''}
        ${album.production_date ? `<span class="date">${album.production_date}</span>` : ''}
        ${album.release_date ? `<span class="released">${album.release_date}</span>` : ''}
      </div>

      ${(album.songs && album.songs.length > 0) ? `
      <details class="sb-section" open>
        <summary>Tracks (${album.songs.length})</summary>
        <ul class="sb-songs">${songsHTML}</ul>
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
  sidebar.querySelectorAll('.sb-songs li').forEach(li => {
    li.addEventListener('click', () => {
      const songId = li.dataset.songId;
      const albumId = li.dataset.albumId;
      if (window.audioPlayer) {
        window.audioPlayer.playSong(parseInt(songId), parseInt(albumId));
      }
      sidebar.querySelectorAll('.sb-songs li').forEach(l => l.classList.remove('playing'));
      li.classList.add('playing');
    });
  });
}

function openSidebar() {
  sidebarOpen = true;
  const sidebar = Q('infoRegion');
  const overlay = Q('mobileOverlay');

  if (sidebar) sidebar.classList.add('open');

  if (isMobile() && overlay) {
    overlay.classList.add('active');
    overlay.onclick = () => {
      document.querySelectorAll('.album-cover').forEach(c => c.classList.remove('selected'));
      closeSidebar();
      currentAlbum = null;
    };
  }

  // Re-layout after sidebar opens (grid width changes)
  requestAnimationFrame(() => renderLayout());
}

function closeSidebar() {
  sidebarOpen = false;
  const sidebar = Q('infoRegion');
  const overlay = Q('mobileOverlay');

  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');

  requestAnimationFrame(() => renderLayout());
}

// ════════════════════════════════════════════════════════════════
// LAYOUT ENGINE — All driven from roderick.json
// ════════════════════════════════════════════════════════════════

// ── Region Layout (header, main, controls) ──────────────────────
function applyRegions() {
  if (!cfg) return;

  const vw = innerWidth;
  const vh = innerHeight;
  const r = cfg.layout?.regions || {};

  // Heights from ratios
  const headerH = Math.round(vh * (r.header?.ratio ?? 0.06));
  const ctrlH   = Math.round(vh * (r.controls?.ratio ?? 0.06));
  const mainH   = vh - headerH - ctrlH;

  const header = Q('artistHeader');
  const main   = Q('artistMain');
  const ctrls  = Q('artistControls');
  const gridEl = Q('albumsRegion');
  const sidebar = Q('infoRegion');

  // Header: fixed top bar
  if (header) Object.assign(header.style, {
    height: px(headerH),
    padding: `0 ${Math.round(vw * 0.015)}px`
  });

  // Main: fills between header and player
  if (main) Object.assign(main.style, {
    marginTop: px(headerH),
    marginBottom: px(ctrlH),
    height: px(mainH),
    overflowY: 'auto',
    overflowX: 'hidden'
  });

  // Player bar: fixed bottom
  if (ctrls) Object.assign(ctrls.style, {
    height: px(ctrlH),
    padding: `0 ${Math.round(vw * 0.015)}px`
  });

  // Main split: grid + sidebar
  if (isMobile()) {
    // Full width grid, sidebar overlays
    if (gridEl) Object.assign(gridEl.style, {
      width: '100%',
      minHeight: px(mainH)
    });
    // Sidebar handled by CSS (fixed overlay)
  } else {
    const ms = cfg.layout?.mainSplit || {};
    const leftR  = ms.left?.ratio  ?? 0.75;
    const rightR = ms.right?.ratio ?? 0.25;
    const minR   = ms.right?.minPx ?? 320;

    if (sidebarOpen) {
      const rightW = Math.max(minR, Math.round(vw * rightR));
      const leftW  = vw - rightW;

      if (gridEl) Object.assign(gridEl.style, {
        width: px(leftW),
        minHeight: px(mainH)
      });
      if (sidebar) Object.assign(sidebar.style, {
        position: 'absolute',
        right: '0', top: '0',
        width: px(rightW),
        height: px(mainH)
      });
    } else {
      if (gridEl) Object.assign(gridEl.style, {
        width: '100%',
        minHeight: px(mainH)
      });
    }
  }
}

// ── Header Positions (RatioPosition drives element placement) ───
function applyPositions(rp, State) {
  if (!rp?.apply || !cfg) return;

  const P = cfg.positions || {};
  const header = Q('artistHeader');

  // Apply position breakpoints if they exist
  let positions = { ...P };
  if (cfg.positionBreakpoints) {
    const vw = innerWidth;
    for (const [bpName, bp] of Object.entries(cfg.positionBreakpoints)) {
      const minOk = bp.minWidth == null || vw >= bp.minWidth;
      const maxOk = bp.maxWidth == null || vw <= bp.maxWidth;
      if (minOk && maxOk && bp.positions) {
        // Deep merge breakpoint positions
        for (const [key, val] of Object.entries(bp.positions)) {
          positions[key] = { ...(positions[key] || {}), ...val };
          if (val.styles) {
            positions[key].styles = { ...(positions[key]?.styles || {}), ...val.styles };
          }
        }
      }
    }
  }

  if (positions.brandLogo)  rp.apply(Q('brandLogo'),  header, positions.brandLogo,  State);
  if (positions.artistName) rp.apply(Q('artistName'), header, positions.artistName, State);
  if (positions.topNav)     rp.apply(Q('topNav'),     header, positions.topNav,     State);
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
      objectFit: 'cover'
    });
  });

  const gridH = rows * tileH + Math.max(0, rows - 1) * gap + 16;
  gridEl.style.height = px(gridH);

  console.log(`✅ Grid: ${cols}×${rows} @ ${tileW}px, margin=${margin}px`);
}

// ── Combined render pass ────────────────────────────────────────
let _rp = null;
let _State = null;

function renderLayout() {
  _State?.measure?.();
  applyRegions();
  applyPositions(_rp, _State);
  layoutGrid();
}

// ── Keyboard shortcuts ──────────────────────────────────────────
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

// ════════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════════

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

  const artistNameEl = Q('artist-name');
  if (artistNameEl && albums.length > 0) {
    artistNameEl.textContent = albums[0].artist_name || 'Roderick Shoolbraid';
  }

  setupKeyboard();

  // Wait for RODUX stack
  whenInterstellarReady(async (IS) => {
    _State = IS?.State || IS?.ViewportState || IS?.state || null;
    _rp = resolvePositioner(IS);

    if (document.readyState === 'loading') {
      await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
    }

    // Debounced resize
    let resizeTimer;
    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderLayout, 50);
    });

    await applyPaintForPage(cfg);
    renderLayout();

    // Reveal
    document.body.style.opacity = '1';
    document.body.style.transition = 'opacity 0.2s ease';

    console.log('🎉 Roderick.js V5 Session 3 initialized');
  });
})();