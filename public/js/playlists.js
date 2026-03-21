// ============================================================================
// public/js/playlists.js — V1.0 (Interstellar Packages)
//
// Client-side playlist manager. Mirrors CartManager pattern:
//   - localStorage cache for instant sidebar display (no DB on page load)
//   - Postgres only on user action (open sidebar, create, add song)
//   - Lazy init — first interaction triggers auth check + data fetch
//
// Two audiences:
//   Anonymous: sees public/curated playlists (read-only, from /api/playlists/public)
//   Logged-in: sees own playlists + public, can create/edit/add songs
//
// Transport btn-plist dispatches 'addToPlaylist' event → caught here
// Footer playlistsBtn triggers toggleSidebar() → delegated from roderick.js
//
// RODUX: JS builds DOM with classnames. CSS renders. No inline styles.
// ============================================================================

const PL_CACHE_KEY = 'interstellar.playlistsCache';

class PlaylistManager {
  constructor() {
    this.publicPlaylists = [];
    this.userPlaylists = [];
    this.isLoggedIn = false;
    this.userId = null;
    this._initialized = false;

    this.sidebarEl = null;
    this.backdropEl = null;
    this.isOpen = false;

    this._restoreFromCache();
    this._bindEvents();
  }


  // ── Cache Layer ─────────────────────────────────────────────

  _saveToCache() {
    try {
      localStorage.setItem(PL_CACHE_KEY, JSON.stringify({
        publicPlaylists: this.publicPlaylists,
        userPlaylists: this.userPlaylists,
        ts: Date.now()
      }));
    } catch (_) {}
  }

  _restoreFromCache() {
    try {
      const raw = localStorage.getItem(PL_CACHE_KEY);
      if (!raw) return;
      const c = JSON.parse(raw);
      // Expire after 1 hour
      if (c.ts && (Date.now() - c.ts) > 3600000) {
        localStorage.removeItem(PL_CACHE_KEY);
        return;
      }
      this.publicPlaylists = c.publicPlaylists || [];
      this.userPlaylists = c.userPlaylists || [];
    } catch (_) {
      localStorage.removeItem(PL_CACHE_KEY);
    }
  }

  _clearCache() {
    localStorage.removeItem(PL_CACHE_KEY);
  }


  // ── Lazy Init ───────────────────────────────────────────────

  async _ensureInitialized() {
    if (this._initialized) return;
    this._initialized = true;
    await this._checkAuth();
    await this._fetchPlaylists();
  }

  async _checkAuth() {
    try {
      if (window.authManager && window.authManager.isLoggedIn()) {
        this.isLoggedIn = true;
        this.userId = window.authManager.getCurrentUser()?.id;
        return;
      }
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          this.isLoggedIn = true;
          this.userId = data.user.id;
        }
      }
    } catch (_) {
      this.isLoggedIn = false;
    }
  }

  async _fetchPlaylists() {
    try {
      // Always fetch public
      const pubRes = await fetch('/api/playlists/public');
      if (pubRes.ok) {
        const pubData = await pubRes.json();
        this.publicPlaylists = pubData.data || [];
      }

      // Fetch user playlists if logged in
      if (this.isLoggedIn) {
        const myRes = await fetch('/api/playlists/mine', { credentials: 'include' });
        if (myRes.ok) {
          const myData = await myRes.json();
          this.userPlaylists = myData.data || [];
        }
      }

      this._saveToCache();
    } catch (err) {
      console.error('❌ Playlist fetch failed:', err);
    }
  }


  // ── Events ──────────────────────────────────────────────────

  _bindEvents() {
    // Listen for addToPlaylist from player.js btn-plist
    window.addEventListener('addToPlaylist', (e) => {
      this._handleAddToPlaylist(e.detail);
    });

    // Auth state changes
    window.addEventListener('userLoggedIn', async (e) => {
      this.isLoggedIn = true;
      this.userId = e.detail.user.id;
      this._initialized = false; // re-fetch with auth
      if (this.isOpen) {
        await this._ensureInitialized();
        this._renderContent();
      }
    });

    window.addEventListener('userLoggedOut', () => {
      this.isLoggedIn = false;
      this.userId = null;
      this.userPlaylists = [];
      this._clearCache();
      this._initialized = false;
      if (this.isOpen) this._renderContent();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.hide();
    });
  }


  // ══════════════════════════════════════════════════════════════
  // SIDEBAR — open / close / build
  // ══════════════════════════════════════════════════════════════

  async toggle() {
    this.isOpen ? this.hide() : await this.show();
  }

  async show() {
    await this._ensureInitialized();
    this._buildSidebar();
    this._renderContent();
    this.isOpen = true;

    requestAnimationFrame(() => {
      if (this.sidebarEl) this.sidebarEl.classList.add('open');
      if (this.backdropEl) this.backdropEl.classList.add('visible');
    });
  }

  hide() {
    if (this.sidebarEl) this.sidebarEl.classList.remove('open');
    if (this.backdropEl) this.backdropEl.classList.remove('visible');

    setTimeout(() => {
      if (this.sidebarEl?.parentNode) this.sidebarEl.remove();
      if (this.backdropEl?.parentNode) this.backdropEl.remove();
      this.sidebarEl = null;
      this.backdropEl = null;
    }, 300);

    this.isOpen = false;
  }

  _buildSidebar() {
    // Clean up any existing
    if (this.sidebarEl) this.sidebarEl.remove();
    if (this.backdropEl) this.backdropEl.remove();

    // Backdrop
    this.backdropEl = document.createElement('div');
    this.backdropEl.className = 'playlists-backdrop';
    this.backdropEl.addEventListener('click', () => this.hide());
    document.body.appendChild(this.backdropEl);

    // Sidebar shell
    this.sidebarEl = document.createElement('aside');
    this.sidebarEl.id = 'playlistsSidebar';
    this.sidebarEl.className = 'playlists-sidebar';
    this.sidebarEl.innerHTML = `
      <div class="playlists-sidebar-header">
        <h2>Playlists</h2>
        <button class="playlists-close" aria-label="Close">✕</button>
      </div>
      <div class="playlists-sidebar-content" id="playlistsSidebarContent">
        <div class="playlists-loading">Loading playlists...</div>
      </div>
    `;
    document.body.appendChild(this.sidebarEl);

    // Close button
    this.sidebarEl.querySelector('.playlists-close')
      .addEventListener('click', () => this.hide());
  }


  // ══════════════════════════════════════════════════════════════
  // RENDER — content inside sidebar
  // ══════════════════════════════════════════════════════════════

  _renderContent() {
    const container = document.getElementById('playlistsSidebarContent');
    if (!container) return;

    let html = '';

    // ── Create playlist button (logged-in only) ──────────────
    if (this.isLoggedIn) {
      html += `
        <div class="playlists-create-section">
          <button class="playlists-create-btn" id="createPlaylistBtn">
            <span class="playlists-create-icon">+</span>
            <span>Create Playlist</span>
          </button>
        </div>
      `;
    }

    // ── User playlists ────────────────────────────────────────
    if (this.isLoggedIn && this.userPlaylists.length > 0) {
      html += `<div class="playlists-section-label">Your Playlists</div>`;
      html += this.userPlaylists.map(p => this._renderPlaylistItem(p, true)).join('');
    }

    // ── Public playlists ──────────────────────────────────────
    if (this.publicPlaylists.length > 0) {
      html += `<div class="playlists-section-label">Curated</div>`;
      html += this.publicPlaylists.map(p => this._renderPlaylistItem(p, false)).join('');
    }

    // ── Empty state ───────────────────────────────────────────
    if (!this.isLoggedIn && this.publicPlaylists.length === 0) {
      html += `<div class="playlists-empty">No playlists yet.</div>`;
    }

    if (this.isLoggedIn && this.userPlaylists.length === 0 && this.publicPlaylists.length === 0) {
      html += `<div class="playlists-empty">Create your first playlist above.</div>`;
    }

    // ── Login prompt (anonymous) ──────────────────────────────
    if (!this.isLoggedIn) {
      html += `
        <div class="playlists-login-prompt">
          <p>Log in to create and save playlists.</p>
          <button class="playlists-login-btn" id="playlistsLoginBtn">Log In</button>
        </div>
      `;
    }

    container.innerHTML = html;

    // ── Wire events ───────────────────────────────────────────
    this._wireContentEvents(container);
  }

  _renderPlaylistItem(playlist, isOwned) {
    const songCount = playlist.song_count || 0;
    const countLabel = songCount === 1 ? '1 track' : `${songCount} tracks`;

    return `
      <div class="playlists-item" data-playlist-id="${playlist.id}" data-owned="${isOwned}">
        <div class="playlists-item-info">
          <span class="playlists-item-name">${this._esc(playlist.name)}</span>
          <span class="playlists-item-count">${countLabel}</span>
        </div>
        <div class="playlists-item-actions">
          <button class="playlists-item-play" data-playlist-id="${playlist.id}" title="Play">▶</button>
          ${isOwned ? `<button class="playlists-item-delete" data-playlist-id="${playlist.id}" title="Delete">✕</button>` : ''}
        </div>
      </div>
    `;
  }

  _wireContentEvents(container) {
    // Create playlist
    const createBtn = container.querySelector('#createPlaylistBtn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this._showCreateForm());
    }

    // Login prompt
    const loginBtn = container.querySelector('#playlistsLoginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        this.hide();
        // Trigger auth modal (same pattern as loginBtn in footer)
        const authModal = document.getElementById('authModal');
        if (authModal) authModal.classList.add('active');
      });
    }

    // Play playlist
    container.querySelectorAll('.playlists-item-play').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._playPlaylist(parseInt(btn.dataset.playlistId));
      });
    });

    // Delete playlist
    container.querySelectorAll('.playlists-item-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._deletePlaylist(parseInt(btn.dataset.playlistId));
      });
    });

    // Click playlist item to expand
    container.querySelectorAll('.playlists-item').forEach(item => {
      item.addEventListener('click', () => {
        this._expandPlaylist(parseInt(item.dataset.playlistId));
      });
    });
  }


  // ══════════════════════════════════════════════════════════════
  // CREATE PLAYLIST
  // ══════════════════════════════════════════════════════════════

  _showCreateForm() {
    const container = document.getElementById('playlistsSidebarContent');
    if (!container) return;

    const section = container.querySelector('.playlists-create-section');
    if (!section) return;

    // Replace create button with form
    section.innerHTML = `
      <div class="playlists-create-form">
        <input type="text" class="playlists-create-input" id="newPlaylistName"
               placeholder="Playlist name" maxlength="100" autofocus />
        <div class="playlists-create-form-actions">
          <button class="playlists-create-save" id="saveNewPlaylist">Create</button>
          <button class="playlists-create-cancel" id="cancelNewPlaylist">Cancel</button>
        </div>
      </div>
    `;

    const input = document.getElementById('newPlaylistName');
    const save = document.getElementById('saveNewPlaylist');
    const cancel = document.getElementById('cancelNewPlaylist');

    input.focus();

    const doCreate = async () => {
      const name = input.value.trim();
      if (!name) { input.classList.add('input-error'); return; }
      save.disabled = true;
      save.textContent = '...';

      try {
        const res = await fetch('/api/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name })
        });

        if (res.ok) {
          const data = await res.json();
          this.userPlaylists.unshift(data.data);
          this._saveToCache();
          this._renderContent();
          this._notify(`"${name}" created`);
        } else {
          const err = await res.json();
          this._notify(err.message || 'Failed to create playlist', 'error');
          save.disabled = false;
          save.textContent = 'Create';
        }
      } catch (err) {
        console.error('❌ Create playlist failed:', err);
        this._notify('Failed to create playlist', 'error');
        save.disabled = false;
        save.textContent = 'Create';
      }
    };

    save.addEventListener('click', doCreate);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') doCreate(); });
    cancel.addEventListener('click', () => this._renderContent());
  }


  // ══════════════════════════════════════════════════════════════
  // DELETE PLAYLIST
  // ══════════════════════════════════════════════════════════════

  async _deletePlaylist(playlistId) {
    const pl = this.userPlaylists.find(p => p.id === playlistId);
    if (!pl) return;

    // Simple confirm
    if (!confirm(`Delete "${pl.name}"?`)) return;

    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        this.userPlaylists = this.userPlaylists.filter(p => p.id !== playlistId);
        this._saveToCache();
        this._renderContent();
        this._notify(`"${pl.name}" deleted`);
      } else {
        this._notify('Failed to delete', 'error');
      }
    } catch (err) {
      console.error('❌ Delete playlist failed:', err);
      this._notify('Failed to delete', 'error');
    }
  }


  // ══════════════════════════════════════════════════════════════
  // EXPAND PLAYLIST (show songs inline)
  // ══════════════════════════════════════════════════════════════

  async _expandPlaylist(playlistId) {
    try {
      const res = await fetch(`/api/playlists/${playlistId}`);
      if (!res.ok) return;
      const data = await res.json();
      const playlist = data.data;

      if (!playlist || !playlist.songs?.length) {
        this._notify('Playlist is empty');
        return;
      }

      // Find the item element and toggle expansion
      const item = this.sidebarEl?.querySelector(`.playlists-item[data-playlist-id="${playlistId}"]`);
      if (!item) return;

      // If already expanded, collapse
      const existing = item.querySelector('.playlists-item-songs');
      if (existing) { existing.remove(); return; }

      const isOwned = item.dataset.owned === 'true';

      const songsHtml = `
        <div class="playlists-item-songs">
          ${playlist.songs.map(s => `
            <div class="playlists-song" data-song-id="${s.song_id}" data-album-id="${s.album_id}">
              <span class="playlists-song-name">${this._esc(s.song_name)}</span>
              <span class="playlists-song-album">${this._esc(s.album_name)}</span>
              ${isOwned ? `<button class="playlists-song-remove" data-playlist-id="${playlistId}" data-song-id="${s.song_id}" title="Remove">✕</button>` : ''}
            </div>
          `).join('')}
        </div>
      `;
      item.insertAdjacentHTML('beforeend', songsHtml);

      // Wire song click to play
      item.querySelectorAll('.playlists-song').forEach(songEl => {
        songEl.addEventListener('click', (e) => {
          if (e.target.closest('.playlists-song-remove')) return;
          const songId = parseInt(songEl.dataset.songId);
          const albumId = parseInt(songEl.dataset.albumId);
          if (window.audioPlayer) {
            window.audioPlayer.playSong(songId, albumId);
          }
        });
      });

      // Wire remove buttons
      item.querySelectorAll('.playlists-song-remove').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          await this._removeSong(
            parseInt(btn.dataset.playlistId),
            parseInt(btn.dataset.songId)
          );
          // Re-expand to refresh
          const expanded = item.querySelector('.playlists-item-songs');
          if (expanded) expanded.remove();
          this._expandPlaylist(playlistId);
        });
      });

    } catch (err) {
      console.error('❌ Expand playlist failed:', err);
    }
  }


  // ══════════════════════════════════════════════════════════════
  // PLAY PLAYLIST (queue all songs)
  // ══════════════════════════════════════════════════════════════

  async _playPlaylist(playlistId) {
    try {
      const res = await fetch(`/api/playlists/${playlistId}`);
      if (!res.ok) return;
      const data = await res.json();
      const playlist = data.data;

      if (!playlist?.songs?.length) {
        this._notify('Playlist is empty');
        return;
      }

      // Play first song
      const first = playlist.songs[0];
      if (window.audioPlayer) {
        window.audioPlayer.playSong(parseInt(first.song_id), parseInt(first.album_id));
        this._notify(`Playing "${playlist.name}"`);
      }

      // TODO: Queue remaining songs for sequential playback
      // This will integrate with the player queue system when built

    } catch (err) {
      console.error('❌ Play playlist failed:', err);
    }
  }


  // ══════════════════════════════════════════════════════════════
  // ADD TO PLAYLIST — triggered by transport btn-plist
  // ══════════════════════════════════════════════════════════════

  async _handleAddToPlaylist(detail) {
    if (!detail?.songId) return;

    await this._ensureInitialized();

    if (!this.isLoggedIn) {
      this._notify('Log in to add songs to playlists', 'error');
      return;
    }

    if (this.userPlaylists.length === 0) {
      // No playlists yet — open sidebar to create one
      this._notify('Create a playlist first');
      await this.show();
      return;
    }

    // Show picker modal
    this._showPlaylistPicker(detail);
  }

  _showPlaylistPicker(detail) {
    // Remove any existing picker
    const existing = document.getElementById('playlistPicker');
    if (existing) existing.remove();

    const picker = document.createElement('div');
    picker.id = 'playlistPicker';
    picker.className = 'playlist-picker';
    picker.innerHTML = `
      <div class="playlist-picker-backdrop"></div>
      <div class="playlist-picker-inner">
        <div class="playlist-picker-header">
          <span>Add "${this._esc(detail.songName)}" to...</span>
          <button class="playlist-picker-close">✕</button>
        </div>
        <div class="playlist-picker-list">
          ${this.userPlaylists.map(p => `
            <button class="playlist-picker-option" data-playlist-id="${p.id}">
              <span class="playlist-picker-name">${this._esc(p.name)}</span>
              <span class="playlist-picker-count">${p.song_count || 0} tracks</span>
            </button>
          `).join('')}
        </div>
        <button class="playlist-picker-new" id="pickerCreateNew">+ New Playlist</button>
      </div>
    `;

    document.body.appendChild(picker);

    requestAnimationFrame(() => picker.classList.add('open'));

    const closePicker = () => {
      picker.classList.remove('open');
      setTimeout(() => picker.remove(), 200);
    };

    picker.querySelector('.playlist-picker-backdrop').addEventListener('click', closePicker);
    picker.querySelector('.playlist-picker-close').addEventListener('click', closePicker);

    // Pick a playlist
    picker.querySelectorAll('.playlist-picker-option').forEach(opt => {
      opt.addEventListener('click', async () => {
        const playlistId = parseInt(opt.dataset.playlistId);
        await this._addSongToPlaylist(playlistId, detail.songId, detail.songName);
        closePicker();
      });
    });

    // Create new from picker
    document.getElementById('pickerCreateNew')?.addEventListener('click', () => {
      closePicker();
      this.show().then(() => this._showCreateForm());
    });

    // Escape key
    const esc = (e) => {
      if (e.key === 'Escape') { closePicker(); document.removeEventListener('keydown', esc); }
    };
    document.addEventListener('keydown', esc);
  }

  async _addSongToPlaylist(playlistId, songId, songName) {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ songId })
      });

      if (res.ok) {
        // Update local count
        const pl = this.userPlaylists.find(p => p.id === playlistId);
        if (pl) pl.song_count = (pl.song_count || 0) + 1;
        this._saveToCache();
        this._notify(`Added "${songName}" to playlist`);
      } else if (res.status === 409) {
        this._notify('Song already in playlist');
      } else {
        this._notify('Failed to add song', 'error');
      }
    } catch (err) {
      console.error('❌ Add song to playlist failed:', err);
      this._notify('Failed to add song', 'error');
    }
  }

  async _removeSong(playlistId, songId) {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/songs/${songId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        const pl = this.userPlaylists.find(p => p.id === playlistId);
        if (pl && pl.song_count > 0) pl.song_count--;
        this._saveToCache();
      }
    } catch (err) {
      console.error('❌ Remove song failed:', err);
    }
  }


  // ══════════════════════════════════════════════════════════════
  // UTILITIES
  // ══════════════════════════════════════════════════════════════

  _esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  _notify(message, type = 'success') {
    // Reuse cart notification pattern
    const el = document.createElement('div');
    el.className = 'cart-notification';
    if (type === 'error') el.classList.add('error');
    el.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    setTimeout(() => {
      el.classList.remove('visible');
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }
}


// ── Init ────────────────────────────────────────────────────
const playlistManager = new PlaylistManager();
window.playlistManager = playlistManager;