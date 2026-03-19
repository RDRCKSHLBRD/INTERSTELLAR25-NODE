// ============================================================================
// public/js/player.js — V7.0.0 (RODUX Stack / Group-Based Footer)
//
// Audio player. Builds DOM into V7 group containers:
//   .group-transport  → 3-col button grid (transport-grid)
//   .group-information → title row, seek+time row, volume row
//
// CSS handles all presentation. JS builds DOM with classnames only.
// Transport icons mapped via CSS classes (.btn-prev, .btn-play, etc.)
//
// V7.0.0: Group-based architecture. Transport grid. Info column.
//
// Exposes window.audioPlayer for global access.
// ============================================================================

class AudioPlayer {
  constructor() {
    this.audio = null;
    this.currentSong = null;
    this.currentAlbum = null;
    this.isLooping = false;
    this.volume = 0.8;
    this.els = {};
    this.built = false;
  }

  // ── Build player DOM (once) ──────────────────────────────────
  build() {
    const transportContainer = document.querySelector('.group-transport');
    const infoContainer      = document.querySelector('.group-information');

    if (!transportContainer || !infoContainer || this.built) return;
    this.built = true;

    // ═══════════════════════════════════════════════════════════
    // TRANSPORT GROUP — 3-column button grid
    // ═══════════════════════════════════════════════════════════

    const grid = document.createElement('div');
    grid.className = 'transport-grid';

    // Audio element (hidden, lives in transport)
    this.audio = document.createElement('audio');
    this.audio.preload = 'metadata';
    transportContainer.appendChild(this.audio);

    const buttons = [
      { key: 'prev',     cls: 'btn-prev',      title: 'Previous',     fn: () => this.previousTrack() },
      { key: 'skipBack', cls: 'btn-skip-back',  title: 'Back 30s',    fn: () => this.skip(-30) },
      { key: 'play',     cls: 'btn-play',       title: 'Play',        fn: () => this.togglePlay() },
      { key: 'skipFwd',  cls: 'btn-skip-fwd',   title: 'Forward 30s', fn: () => this.skip(30) },
      { key: 'next',     cls: 'btn-next',       title: 'Next',        fn: () => this.nextTrack() },
      { key: 'stop',     cls: 'btn-stop',       title: 'Stop',        fn: () => this.stop() },
      { key: 'loop',     cls: 'btn-loop',       title: 'Loop',        fn: () => this.toggleLoop() },
      { key: 'plist',    cls: 'btn-plist',      title: 'Add to Playlist', fn: () => this._addToPlaylist() },
      { key: 'cart',     cls: 'btn-cart',       title: 'Add to Cart', fn: () => this._addToCart() },
    ];

    buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.className = b.cls;
      btn.title = b.title;
      btn.setAttribute('aria-label', b.title);
      btn.addEventListener('click', b.fn);
      this.els[b.key] = btn;
      grid.appendChild(btn);
    });

    transportContainer.appendChild(grid);


    // ═══════════════════════════════════════════════════════════
    // INFORMATION GROUP — title, seek+time, volume (column layout)
    // ═══════════════════════════════════════════════════════════

    // Row 1: Song title
    const titleRow = document.createElement('div');
    titleRow.className = 'info-row info-title-row';
    this.els.title = document.createElement('span');
    this.els.title.className = 'player-title';
    this.els.title.textContent = '—';
    titleRow.appendChild(this.els.title);
    infoContainer.appendChild(titleRow);

    // Row 2: Seek bar + Time
    const seekRow = document.createElement('div');
    seekRow.className = 'info-row info-seek-row';

    const seek = document.createElement('div');
    seek.className = 'player-seek';
    this.els.seekFill = document.createElement('div');
    this.els.seekFill.className = 'player-seek-fill';
    seek.appendChild(this.els.seekFill);
    seek.addEventListener('click', (e) => this._seekTo(e, seek));
    seekRow.appendChild(seek);

    this.els.time = document.createElement('span');
    this.els.time.className = 'player-time';
    this.els.time.textContent = '0:00 / 0:00';
    seekRow.appendChild(this.els.time);

    infoContainer.appendChild(seekRow);

    // Row 3: Volume (pointer devices only — visibility controlled by QuadTree)
    const volRow = document.createElement('div');
    volRow.className = 'info-row info-volume-row';

    const vol = document.createElement('div');
    vol.className = 'player-volume';

    const volIcon = document.createElement('span');
    volIcon.className = 'player-volume-icon';
    vol.appendChild(volIcon);

    const volTrack = document.createElement('div');
    volTrack.className = 'player-volume-track';
    this.els.volFill = document.createElement('div');
    this.els.volFill.className = 'player-volume-fill';
    volTrack.appendChild(this.els.volFill);
    volTrack.addEventListener('click', (e) => this._setVolume(e, volTrack));
    vol.appendChild(volTrack);

    volRow.appendChild(vol);
    infoContainer.appendChild(volRow);


    // ── Audio events ───────────────────────────────────────────
    this.audio.addEventListener('loadedmetadata', () => this._updateProgress());
    this.audio.addEventListener('timeupdate', () => this._updateProgress());
    this.audio.addEventListener('ended', () => this._onEnded());
    this.audio.addEventListener('error', () => this._showError('Audio playback error'));

    this.audio.volume = this.volume;
  }


  // ── Playback ─────────────────────────────────────────────────

  async playSong(songId, albumId) {
    try {
      if (!this.built) this.build();

      let album = window.apiClient ? await window.apiClient.getAlbum(albumId) : null;
      if (!album) throw new Error('Album not found');

      let song = album.songs?.find(s => s.id === songId);
      if (!song && window.apiClient) {
        try { song = await window.apiClient.getSong(songId); } catch {}
      }
      if (!song) throw new Error(`Song ${songId} not found`);

      this.currentSong = song;
      this.currentAlbum = album;

      this.els.title.textContent = song.name;
      this.audio.src = song.audio_url;
      this.audio.load();

      try {
        await this.audio.play();
        this._updatePlayBtn(true);
      } catch {
        this._updatePlayBtn(false);
      }
    } catch (err) {
      console.error('Failed to play:', err);
      this._showError(err.message);
    }
  }

  togglePlay() {
    if (!this.audio?.src) return;
    if (this.audio.paused) {
      this.audio.play().then(() => this._updatePlayBtn(true));
    } else {
      this.audio.pause();
      this._updatePlayBtn(false);
    }
  }

  play()  { if (this.audio) this.audio.play().then(() => this._updatePlayBtn(true)); }
  pause() { if (this.audio) { this.audio.pause(); this._updatePlayBtn(false); } }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this._updatePlayBtn(false);
      this._updateProgress();
    }
  }

  skip(seconds) {
    if (!this.audio?.duration) return;
    this.audio.currentTime = Math.max(0, Math.min(this.audio.duration, this.audio.currentTime + seconds));
  }

  async nextTrack() {
    if (!this.currentAlbum?.songs || !this.currentSong) return;
    const songs = this.currentAlbum.songs;
    const idx = songs.findIndex(s => s.id === this.currentSong.id);
    if (idx !== -1 && idx + 1 < songs.length) {
      await this.playSong(songs[idx + 1].id, this.currentAlbum.id);
    }
  }

  async previousTrack() {
    if (!this.currentAlbum?.songs || !this.currentSong) return;
    const songs = this.currentAlbum.songs;
    const idx = songs.findIndex(s => s.id === this.currentSong.id);
    if (idx > 0) {
      await this.playSong(songs[idx - 1].id, this.currentAlbum.id);
    }
  }

  toggleLoop() {
    this.isLooping = !this.isLooping;
    this.els.loop.dataset.active = this.isLooping ? 'true' : 'false';
  }


  // ── Actions ──────────────────────────────────────────────────

  _addToCart() {
    if (window.cartManager && this.currentSong) {
      window.cartManager.addSongToCart(this.currentSong.id, this.currentSong);
    }
  }

  _addToPlaylist() {
    if (this.currentSong) {
      window.dispatchEvent(new CustomEvent('addToPlaylist', {
        detail: {
          songId: this.currentSong.id,
          songName: this.currentSong.name,
          albumId: this.currentAlbum?.id,
          albumName: this.currentAlbum?.name
        }
      }));
    }
  }


  // ── Internal UI updates ──────────────────────────────────────

  _updatePlayBtn(playing) {
    if (!this.els.play) return;
    this.els.play.classList.toggle('btn-play', !playing);
    this.els.play.classList.toggle('btn-pause', playing);
    this.els.play.title = playing ? 'Pause' : 'Play';
    this.els.play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  }

  _updateProgress() {
    if (!this.audio) return;
    const cur = this.audio.currentTime || 0;
    const dur = this.audio.duration || 0;
    const pct = dur > 0 ? (cur / dur) * 100 : 0;

    if (this.els.seekFill) this.els.seekFill.style.width = `${pct}%`;
    if (this.els.time) this.els.time.textContent = `${this._fmt(cur)} / ${this._fmt(dur)}`;
  }

  _onEnded() {
    if (this.isLooping) {
      this.audio.currentTime = 0;
      this.audio.play();
    } else {
      this.nextTrack();
    }
  }

  _seekTo(e, wrap) {
    if (!this.audio?.duration) return;
    const rect = wrap.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    this.audio.currentTime = ratio * this.audio.duration;
  }

  _setVolume(e, wrap) {
    const rect = wrap.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    this.volume = ratio;
    this.audio.volume = ratio;
    if (this.els.volFill) this.els.volFill.style.width = `${ratio * 100}%`;
  }

  _fmt(s) {
    if (isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  }

  _showError(msg) {
    console.error('🎵 Player error:', msg);
  }

  getState() {
    return {
      isPlaying: this.audio && !this.audio.paused,
      currentTime: this.audio?.currentTime || 0,
      duration: this.audio?.duration || 0,
      volume: this.volume,
      isLooping: this.isLooping,
      currentSong: this.currentSong,
      currentAlbum: this.currentAlbum,
    };
  }
}

// Global instance
const audioPlayer = new AudioPlayer();
window.audioPlayer = audioPlayer;
window.playSong = (songId, albumId) => audioPlayer.playSong(songId, albumId);

// Build when group containers exist
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => audioPlayer.build());
} else {
  audioPlayer.build();
}