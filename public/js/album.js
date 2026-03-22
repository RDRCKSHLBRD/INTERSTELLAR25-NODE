// ============================================================================
// public/js/album.js — V2.0 (PlayerIO V8 / Palette-Aware Panel)
//
// Album page controller. Fetches album data, builds the lateral panel
// environment, wires navigation, tracklist, cart, playlists.
// V8: PlayerIO replaces footer. Album palette overrides --pio-* vars.
// ============================================================================

// ── Extract catalogue from URL ────────────────────────────
const pathParts = window.location.pathname.split('/');
const catalogue = pathParts[pathParts.length - 1];

if (!catalogue) {
  document.getElementById('albumPage').textContent = 'No album specified.';
  throw new Error('No catalogue in URL');
}

// ── Fetch album data ──────────────────────────────────────
const res = await fetch(`/api/albums/catalogue/${catalogue}`);
if (!res.ok) {
  document.getElementById('albumPage').textContent = 'Album not found.';
  throw new Error(`Album ${catalogue} not found`);
}

const json = await res.json();
const album = json.data;

// ── Apply palette ─────────────────────────────────────────
const root = document.documentElement;
if (album.palette) {
  // Album environment vars
  if (album.palette.bg)         root.style.setProperty('--c-bg', album.palette.bg);
  if (album.palette.text)       root.style.setProperty('--c-text', album.palette.text);
  if (album.palette.accent)     root.style.setProperty('--c-accent', album.palette.accent);
  if (album.palette.catalogue)  root.style.setProperty('--c-catalogue', album.palette.catalogue);
  if (album.palette.trackTitle) root.style.setProperty('--c-track', album.palette.trackTitle);

  // PlayerIO panel inherits album palette — panel becomes part of the album world
  if (album.palette.bg)         root.style.setProperty('--pio-bg', album.palette.bg);
  if (album.palette.text)       root.style.setProperty('--pio-text', album.palette.text);
  if (album.palette.accent)     root.style.setProperty('--pio-accent', album.palette.accent);
  if (album.palette.catalogue)  root.style.setProperty('--pio-muted', album.palette.catalogue);
  if (album.palette.trackTitle) root.style.setProperty('--pio-alt1', album.palette.trackTitle);
}

document.title = `${album.name} — ${album.artist_name} — Interstellar Packages`;

const coverUrl = album.cover_url || `/api/image/${album.catalogue}/cover.jpg`;

// ── Duration formatter ────────────────────────────────────
function fmtDur(d) {
  if (!d) return '';
  if (String(d).includes(':')) return d;
  const sec = parseInt(d);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

// ── Build the environment ─────────────────────────────────
const page = document.getElementById('albumPage');
page.className = 'album-env locked';

const songs = album.songs || [];

page.innerHTML = `
  <!-- PANEL 0: The Door -->
  <section class="panel panel-cover" id="panelCover">
    <img class="cover-img" src="${coverUrl}" alt="${album.name}" />
    <div class="cover-prompt">enter</div>
  </section>

  <!-- PANEL 1: Liner Notes Spread -->
  <section class="panel panel-liner" id="panelLiner">
    <div class="liner-artwork">
      <img src="${coverUrl}" alt="${album.name}" />
    </div>
    <div class="liner-text">
      <div>
        <div class="liner-catalogue">${album.catalogue}</div>
        <ul class="liner-tracklist">
          ${songs.map(s => `
            <li class="liner-track" data-song-id="${s.id}" data-album-id="${album.id}">
              <span class="liner-track-name">${s.name}</span>
              <span class="liner-track-dur">${fmtDur(s.duration)}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <div class="liner-description">
        ${album.description || ''}
      </div>

      <div class="liner-credits">
        ${album.credit || `All Sound &amp; Composition: ${album.artist_name}.<br>Cover Art, Photography &amp; Design: ${album.artist_name}.<br>©All Rights Reserved.`}
      </div>
    </div>
  </section>

  <!-- PANEL 2: Purchase / Environment -->
  <section class="panel panel-purchase" id="panelPurchase">
    <div class="purchase-card">
      <img class="purchase-cover" src="${coverUrl}" alt="${album.name}" />
      <div class="purchase-title">${album.name}</div>
      <div class="purchase-artist">${album.artist_name}</div>
      ${album.product ? `
        <div class="purchase-price">$${album.product.price?.toFixed(2) || '12.00'}</div>
        <button class="purchase-btn" data-catalogue="${album.catalogue}">Add to Cart</button>
      ` : ''}
    </div>
  </section>
`;


// ══════════════════════════════════════════════════════════
// NAVIGATION ENGINE
// ══════════════════════════════════════════════════════════

let currentPanel = 0;
const totalPanels = 3;
let entered = false;

const env = document.getElementById('albumPage');
const nav = document.getElementById('panelNav');
const panelCover = document.getElementById('panelCover');
const panelLiner = document.getElementById('panelLiner');

// Build nav dots
for (let i = 0; i < totalPanels; i++) {
  const dot = document.createElement('div');
  dot.className = 'panel-dot' + (i === 0 ? ' active' : '');
  dot.addEventListener('click', () => goToPanel(i));
  nav.appendChild(dot);
}

function goToPanel(idx) {
  if (idx < 0 || idx >= totalPanels) return;
  if (!entered && idx > 0) return;

  currentPanel = idx;
  env.style.transform = `translateX(-${idx * 100}vw)`;

  // Update dots
  nav.querySelectorAll('.panel-dot').forEach((d, i) => {
    d.classList.toggle('active', i === idx);
  });
}

// ── Entry interaction ─────────────────────────────────────
panelCover.addEventListener('click', () => {
  if (entered) return;
  entered = true;
  env.classList.remove('locked');
  panelCover.classList.add('entered');
  nav.classList.add('visible');

  // Slide to liner notes
  goToPanel(1);

  // Trigger reveal animations on liner panel
  setTimeout(() => {
    panelLiner.classList.add('revealed');
  }, 400);
});

// ── Cover image load ──────────────────────────────────────
const coverImg = panelCover.querySelector('.cover-img');
if (coverImg) {
  if (coverImg.complete) {
    coverImg.classList.add('loaded');
  } else {
    coverImg.addEventListener('load', () => coverImg.classList.add('loaded'));
  }
}


// ── Keyboard navigation ───────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  switch (e.key) {
    case 'ArrowRight':
      e.preventDefault();
      if (!entered) { panelCover.click(); return; }
      goToPanel(currentPanel + 1);
      break;
    case 'ArrowLeft':
      e.preventDefault();
      goToPanel(currentPanel - 1);
      break;
    case ' ':
      e.preventDefault();
      if (!entered) { panelCover.click(); return; }
      if (window.audioPlayer?.audio) {
        window.audioPlayer.audio.paused ? window.audioPlayer.play() : window.audioPlayer.pause();
      }
      break;
    case 'Escape':
      e.preventDefault();
      goToPanel(0);
      break;
  }
});

// ── Wheel / swipe navigation ──────────────────────────────
let wheelCooldown = false;

env.addEventListener('wheel', (e) => {
  if (wheelCooldown) return;

  // Use deltaX for horizontal scroll, deltaY for vertical (trackpad)
  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

  if (Math.abs(delta) < 30) return;

  wheelCooldown = true;
  setTimeout(() => { wheelCooldown = false; }, 800);

  if (!entered && delta > 0) {
    panelCover.click();
    return;
  }

  if (delta > 0) {
    goToPanel(currentPanel + 1);
  } else {
    goToPanel(currentPanel - 1);
  }
}, { passive: true });

// Touch swipe
let touchStartX = 0;
let touchStartY = 0;

env.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

env.addEventListener('touchend', (e) => {
  const dx = touchStartX - e.changedTouches[0].clientX;
  const dy = touchStartY - e.changedTouches[0].clientY;

  // Require mostly horizontal swipe
  if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;

  if (!entered && dx > 0) {
    panelCover.click();
    return;
  }

  if (dx > 0) {
    goToPanel(currentPanel + 1);
  } else {
    goToPanel(currentPanel - 1);
  }
}, { passive: true });


// ── Track click → play ────────────────────────────────────
document.querySelectorAll('.liner-track').forEach(track => {
  track.addEventListener('click', () => {
    const songId = track.dataset.songId;
    const albumId = track.dataset.albumId;
    if (window.audioPlayer) {
      window.audioPlayer.playSong(songId, albumId);
    }
    document.querySelectorAll('.liner-track').forEach(t => t.classList.remove('playing'));
    track.classList.add('playing');
  });
});

// ── Purchase button → cart ────────────────────────────────
const purchaseBtn = document.querySelector('.purchase-btn');
if (purchaseBtn) {
  purchaseBtn.addEventListener('click', () => {
    if (window.cartManager) {
      window.cartManager.addAlbumToCart(purchaseBtn.dataset.catalogue);
    }
  });
}

// ── Playlists sidebar wiring ──────────────────────────────
const playlistsBtn = document.getElementById('playlistsBtn');
if (playlistsBtn) {
  playlistsBtn.addEventListener('click', () => {
    if (window.playlistManager) window.playlistManager.toggle();
  });
}


// ── V8: No footer — PlayerIO panel overlays. Footer height is 0. ──
root.style.setProperty('--footer-h', '0px');

document.body.classList.add('ready');

console.log(`✅ Album environment: ${album.name} (${catalogue}) — ${totalPanels} panels (PlayerIO V8)`);