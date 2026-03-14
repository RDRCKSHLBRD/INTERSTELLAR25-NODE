// ============================================================================
// public/js/roderick.js — V5 (RODUX Stack / Flash Layer)
//
// Single controller for the Roderick Shoolbraid artist page.
// Owns: data fetch, DOM creation, QuadTree grid, album detail sidebar, player wiring.
// Replaces: main.js, ui-manager.js, api-client.js on this page.
//
// Data flow: flash.db → /api/albums (Express) → fetch → DOM → QuadTree layout
// ============================================================================

import { applyPaintForPage } from './paint-applier.js';

// ── Helpers ─────────────────────────────────────────────────────
const Q  = (id) => document.getElementById(id);
const px = (n) => `${Math.round(n)}px`;

const MOBILE_MAX = 767;
const TABLET_MAX = 1023;
function isMobile()  { return innerWidth <= MOBILE_MAX; }
function isDesktop() { return innerWidth > TABLET_MAX; }

// ── Data fetch (single source, flash-backed) ────────────────────
async function fetchJSON(endpoint) {
  const res = await fetch(endpoint, { credentials: 'include' });
  if (!res.ok) throw new Error(`${endpoint}: ${res.status}`);
  const json = await res.json();
  // Normalize: our flash routes return { success, data }
  if (json.success && json.data) return json.data;
  if (Array.isArray(json)) return json;
  return json;
}

// ── State ───────────────────────────────────────────────────────
let albums = [];        // flat array from /api/albums
let currentAlbum = null; // full album object (with songs) when detail is open

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
  const keys = ['RatioPosition','ratioPosition','positioner','position','pos','positionEngine'].filter(k => k in IS);
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

    // Prevent layout reflow flash — hide until loaded
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

// ── Album Click → Sidebar Detail ────────────────────────────────
async function onAlbumClick(album, imgEl) {
  // Toggle enlarged
  const allCovers = document.querySelectorAll('.album-cover');
  const wasEnlarged = imgEl.classList.contains('enlarged');

  allCovers.forEach(c => c.classList.remove('enlarged'));

  if (wasEnlarged) {
    hideSidebar();
    currentAlbum = null;
    return;
  }

  imgEl.classList.add('enlarged');

  // Fetch full album (songs, palette, liner notes) from flash
  try {
    const full = await fetchJSON(`/api/albums/${album.id}`);
    currentAlbum = full;
    showAlbumDetail(full);
    showSidebar();
  } catch (err) {
    console.error('Failed to load album detail:', err);
  }
}

// ── Album Detail Sidebar ────────────────────────────────────────
function showAlbumDetail(album) {
  const sidebarContent = Q('albumInfo');
  if (!sidebarContent) return;

  sidebarContent.innerHTML = '';

  // Title
  const title = document.createElement('h2');
  title.className = 'albumName';
  title.textContent = album.name;
  sidebarContent.appendChild(title);

  // Description
  if (album.description) {
    const desc = document.createElement('p');
    desc.className = 'albumDescription';
    desc.innerHTML = album.description;
    sidebarContent.appendChild(desc);
  }

  // Credit
  if (album.credit) {
    const credit = document.createElement('p');
    credit.className = 'albumCredit';
    credit.innerHTML = album.credit;
    sidebarContent.appendChild(credit);
  }

  // Metadata row
  const meta = document.createElement('div');
  meta.className = 'album-info';
  meta.innerHTML = `
    <div class="catalogue-number">${album.catalogue || ''}</div>
    <div class="production-date">${album.production_date || ''}</div>
    <div class="release-date">${album.release_date || ''}</div>
  `;
  sidebarContent.appendChild(meta);

  // Song list
  const songListEl = Q('songList');
  if (songListEl) {
    songListEl.innerHTML = '';

    if (album.songs && album.songs.length > 0) {
      const ul = document.createElement('ul');
      ul.className = 'songList';

      album.songs.forEach(song => {
        const li = document.createElement('li');

        const songInfo = document.createElement('div');
        songInfo.className = 'song-info';
        songInfo.innerHTML = `
          <span class="song-text">${song.track_id}. ${song.name}</span>
          <span class="song-duration">${song.duration || ''}</span>
        `;

        // Click to play
        songInfo.addEventListener('click', () => {
          if (window.audioPlayer) {
            window.audioPlayer.playSong(song.id, album.id);
          }
          // Highlight active song
          ul.querySelectorAll('li').forEach(l => l.classList.remove('playing'));
          li.classList.add('playing');
        });

        li.appendChild(songInfo);
        ul.appendChild(li);
      });

      songListEl.appendChild(ul);
    }
  }
}

function showSidebar() {
  const sidebar = Q('infoRegion');
  if (sidebar && !isMobile()) {
    sidebar.style.display = 'block';
  }
}

function hideSidebar() {
  const sidebar = Q('infoRegion');
  if (sidebar) {
    sidebar.style.display = isMobile() ? 'none' : 'block';
  }
  const sidebarContent = Q('albumInfo');
  if (sidebarContent) sidebarContent.innerHTML = '';
  const songListEl = Q('songList');
  if (songListEl) songListEl.innerHTML = '';
}

// ── Layout: Regions (header / main / controls) ──────────────────
function chooseControlsRatio(c) {
  const range = c.layout?.regions?.controls?.ratioRange;
  c.layout.regions.controls.ratio = range
    ? (range[0] + range[1]) / 2
    : (c.layout.regions.controls.ratio ?? 0.24);
}

function applyMobileLayout(c, headerH, mainH, ctrlH) {
  const vw = innerWidth;
  console.log('📱 Applying MOBILE layout');

  const header = Q('artistHeader');
  const main   = Q('artistMain');
  const ctrls  = Q('artistControls');
  const albumsEl = Q('albumsRegion');
  const info   = Q('infoRegion');

  if (header) Object.assign(header.style, { position: 'absolute', left: '0', top: '0', width: px(vw), height: px(headerH) });
  if (main)   Object.assign(main.style,   { position: 'absolute', left: '0', top: px(headerH), width: px(vw), height: px(mainH), overflow: 'hidden' });
  if (ctrls)  Object.assign(ctrls.style,  { position: 'absolute', left: '0', top: px(headerH + mainH), width: px(vw), height: px(ctrlH) });
  if (albumsEl) Object.assign(albumsEl.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: px(mainH), maxWidth: '100vw', overflow: 'auto' });
  if (info) info.style.display = 'none';
}

function applyDesktopLayout(c, headerH, mainH, ctrlH) {
  const vw = innerWidth;
  console.log('🖥️  Applying DESKTOP/TABLET layout');

  const header = Q('artistHeader');
  const main   = Q('artistMain');
  const ctrls  = Q('artistControls');
  const albumsEl = Q('albumsRegion');
  const info   = Q('infoRegion');

  if (header) Object.assign(header.style, { position: 'absolute', left: '0', top: '0', width: px(vw), height: px(headerH) });
  if (main)   Object.assign(main.style,   { position: 'absolute', left: '0', top: px(headerH), width: px(vw), height: px(mainH) });
  if (ctrls)  Object.assign(ctrls.style,  { position: 'absolute', left: '0', top: px(headerH + mainH), width: px(vw), height: px(ctrlH) });

  const ms = c.layout?.mainSplit;
  const leftR  = ms?.left?.ratio  ?? 0.75;
  const rightR = ms?.right?.ratio ?? 0.25;
  const minR   = ms?.right?.minPx ?? 360;
  const leftW  = Math.max(0, Math.round(vw * leftR));
  const rightW = Math.max(minR, Math.round(vw * rightR));

  if (albumsEl) Object.assign(albumsEl.style, { position: 'absolute', left: '0', top: '0', width: px(leftW), height: px(mainH), overflow: 'auto' });
  if (info) Object.assign(info.style, { display: 'block', position: 'absolute', left: px(leftW), top: '0', width: px(rightW), height: px(mainH), overflow: 'auto' });
}

function applyRegions(c) {
  const vh = innerHeight;
  const headerR = c.layout?.regions?.header?.ratio   ?? 0.12;
  const mainR   = c.layout?.regions?.main?.ratio     ?? 0.80;
  const ctrlR   = c.layout?.regions?.controls?.ratio ?? 0.08;

  if (isMobile()) {
    applyMobileLayout(c, vh * headerR, vh * mainR, vh * ctrlR);
  } else {
    applyDesktopLayout(c, vh * headerR, vh * mainR, vh * ctrlR);
  }
}

// ── Layout: Positions (RatioPosition) ───────────────────────────
function applyPositions(c, rp, State) {
  if (!rp?.apply) return;
  const P = c.positions || {};

  if (P.brandLogo)  rp.apply(Q('brandLogo'),  Q('artistHeader'), P.brandLogo,  State);
  if (P.artistName) rp.apply(Q('artistName'), Q('artistHeader'), P.artistName, State);
  if (P.topNav)     rp.apply(Q('topNav'),     Q('artistHeader'), P.topNav,     State);

  if (!isMobile()) {
    const albumInfoCfg = P.albumInfo || P.bioSection;
    if (albumInfoCfg) rp.apply(Q('albumInfo'), Q('infoRegion'), albumInfoCfg, State);
    if (P.songList)   rp.apply(Q('songList'),  Q('infoRegion'), P.songList,   State);
  }

  if (P.playerControls) rp.apply(Q('playerControls'), Q('artistControls'), P.playerControls, State);
}

// ── Layout: QuadTree Album Grid ─────────────────────────────────
function layoutAlbumGridWithQuadTree(c) {
  const qtCfg = c.quadTree?.albumGrid;
  if (!qtCfg?.enabled) {
    console.warn('⚠️ QuadTree albumGrid not enabled');
    return;
  }

  const gridEl = Q('albumsRegion');
  if (!gridEl) return;

  const covers = Array.from(gridEl.querySelectorAll('.album-cover'));
  if (covers.length === 0) return;

  const rect = gridEl.getBoundingClientRect();
  const w = rect.width;

  const bucket = (w < 520) ? 'mobile' : (w < 880) ? 'tablet' : (w > 1400) ? 'ultra' : 'desktop';
  const maxCols = qtCfg.columns?.[bucket]?.max ?? 4;
  const gap     = qtCfg.gap?.px ?? 16;
  const aspect  = qtCfg.tile?.aspect ?? 1.0;

  const margin = w * 0.02;
  const availW = w * 0.92;
  const tileW  = Math.floor((availW - (gap * (maxCols - 1))) / maxCols);
  const tileH  = Math.round(tileW / aspect);
  const cols   = Math.max(1, Math.min(maxCols, Math.floor((availW + gap) / (tileW + gap))));
  const rows   = Math.ceil(covers.length / cols);

  gridEl.style.position = 'relative';
  gridEl.style.width = '100%';
  gridEl.style.maxWidth = '100%';
  gridEl.style.paddingLeft = px(margin);

  covers.forEach((cover, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    Object.assign(cover.style, {
      position: 'absolute',
      left: px(col * (tileW + gap)),
      top:  px(row * (tileH + gap)),
      width:  px(tileW),
      height: px(tileH),
      objectFit: 'cover',
      maxWidth: '100%'
    });
  });

  gridEl.style.height = px(rows * tileH + Math.max(0, rows - 1) * gap);
  console.log(`✅ Grid layout: ${cols}×${rows} tiles @ ${tileW}px`);
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
        document.querySelectorAll('.album-cover').forEach(c => c.classList.remove('enlarged'));
        hideSidebar();
        currentAlbum = null;
        break;
    }
  });
}

// ── Init ────────────────────────────────────────────────────────
(async function init() {
  // Shim for player.js — it expects window.apiClient.getAlbum/getSong
  window.apiClient = {
    getAlbum: (id) => fetchJSON(`/api/albums/${id}`),
    getSong:  (id) => fetchJSON(`/api/songs/${id}`)
  };

  // Load page config
  const cfgRes = await fetch('/config/pages/roderick.json', { cache: 'no-store' });
  if (!cfgRes.ok) throw new Error('roderick.json not found');
  const cfg = await cfgRes.json();

  // Fetch album data from flash-backed API
  try {
    albums = await fetchJSON('/api/albums');
    console.log(`📡 Loaded ${albums.length} albums from flash`);
  } catch (err) {
    console.error('❌ Failed to load albums:', err);
    const gridEl = Q('albumsRegion');
    if (gridEl) gridEl.innerHTML = '<p style="color:#cadbda;padding:20px;">Failed to load music collection.</p>';
    return;
  }

  // Sort by ID for consistent order
  albums.sort((a, b) => a.id - b.id);

  // Build the album grid DOM
  buildAlbumGrid(albums);

  // Set artist name
  const artistNameEl = Q('artist-name');
  if (artistNameEl && albums.length > 0) {
    artistNameEl.textContent = albums[0].artist_name || 'Roderick Shoolbraid';
  }

  // Keyboard
  setupKeyboard();

  // Wait for RODUX stack
  whenInterstellarReady(async (IS) => {
    const State = IS.State || IS.ViewportState || IS.state || null;
    const layoutEngine = IS.RatioLayoutEngine || IS.layoutEngine || null;
    const rp = resolvePositioner(IS);

    function render() {
      State?.measure?.();
      layoutEngine?.update?.(cfg.layout);
      chooseControlsRatio(cfg);
      applyRegions(cfg);
      applyPositions(cfg, rp, State);
      layoutAlbumGridWithQuadTree(cfg);
    }

    if (document.readyState === 'loading') {
      await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
    }

    addEventListener('resize', render);
    await applyPaintForPage(cfg);
    render();

    // Reveal page after first render — no layout flash
    document.body.style.opacity = '1';
    document.body.style.transition = 'opacity 0.2s ease';

    console.log('🎉 Roderick.js V5 initialized');
  });
})();