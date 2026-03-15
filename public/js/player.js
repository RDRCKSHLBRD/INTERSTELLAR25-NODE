// ============================================================================
// public/js/player.js — V6 (RODUX Stack / Zero Inline Styles)
//
// Audio player. Builds DOM with classnames only — CSS handles all presentation.
// Transport icons mapped via CSS classes (.btn-prev, .btn-play, etc.)
// Seek, volume, time all rendered by player.css custom properties.
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
    this.container = null;
    this.els = {};
    this.built = false;
  }

  // ── Build player DOM (once) ──────────────────────────────────
  build() {
    this.container = document.getElementById('playerControls');
    if (!this.container || this.built) return;
    this.built = true;

    // Audio element (hidden)
    this.audio = document.createElement('audio');
    this.audio.preload = 'metadata';
    this.container.appendChild(this.audio);

    // ── Song title ─────────────────────────────────────────────
    this.els.title = document.createElement('span');
    this.els.title.className = 'player-title';
    this.els.title.textContent = '—';
    this.container.appendChild(this.els.title);

    // Separator
    const sep = document.createElement('span');
    sep.className = 'player-separator';
    sep.textContent = '|';
    this.container.appendChild(sep);

    // ── Transport buttons ──────────────────────────────────────
    const transport = document.createElement('div');
    transport.className = 'player-transport';

    const buttons = [
      { key: 'prev', cls: 'btn-prev', title: 'Previous',        fn: () => this.previousTrack() },
      { key: 'play', cls: 'btn-play', title: 'Play',            fn: () => this.togglePlay() },
      { key: 'next', cls: 'btn-next', title: 'Next',            fn: () => this.nextTrack() },
      { key: 'stop', cls: 'btn-stop', title: 'Stop',            fn: () => this.stop() },
    ];

    buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.className = b.cls;
      btn.title = b.title;
      btn.setAttribute('aria-label', b.title);
      btn.addEventListener('click', b.fn);
      this.els[b.key] = btn;
      transport.appendChild(btn);
    });

    this.container.appendChild(transport);

    // ── Seek bar ───────────────────────────────────────────────
    const seek = document.createElement('div');
    seek.className = 'player-seek';

    this.els.seekFill = document.createElement('div');
    this.els.seekFill.className = 'player-seek-fill';
    seek.appendChild(this.els.seekFill);
    seek.addEventListener('click', (e) => this._seekTo(e, seek));

    this.container.appendChild(seek);

    // ── Time display ───────────────────────────────────────────
    this.els.time = document.createElement('span');
    this.els.time.className = 'player-time';
    this.els.time.textContent = '0:00 / 0:00';
    this.container.appendChild(this.els.time);

    // ── Volume ─────────────────────────────────────────────────
    const vol = document.createElement('div');
    vol.className = 'player-volume';

    const volIcon = document.createElement('span');
    volIcon.className = 'player-volume-icon';
    volIcon.textContent = '🔊';
    vol.appendChild(volIcon);

    const volTrack = document.createElement('div');
    volTrack.className = 'player-volume-track';

    this.els.volFill = document.createElement('div');
    this.els.volFill.className = 'player-volume-fill';
    volTrack.appendChild(this.els.volFill);
    volTrack.addEventListener('click', (e) => this._setVolume(e, volTrack));
    vol.appendChild(volTrack);

    this.container.appendChild(vol);

    // ── Loop button ────────────────────────────────────────────
    this.els.loop = document.createElement('button');
    this.els.loop.className = 'btn-loop';
    this.els.loop.title = 'Loop';
    this.els.loop.setAttribute('aria-label', 'Loop');
    this.els.loop.addEventListener('click', () => this.toggleLoop());
    // Put loop inside transport cluster visually
    transport.appendChild(this.els.loop);

    // ── Cart button ────────────────────────────────────────────
    this.els.cart = document.createElement('button');
    this.els.cart.className = 'btn-cart';
    this.els.cart.title = 'Add Track to Cart';
    this.els.cart.setAttribute('aria-label', 'Add Track to Cart');
    this.els.cart.addEventListener('click', () => {
      if (window.cartManager && this.currentSong) {
        window.cartManager.addSongToCart(this.currentSong.id, this.currentSong);
      }
    });
    transport.appendChild(this.els.cart);

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

  // ── Internal UI updates ──────────────────────────────────────
  _updatePlayBtn(playing) {
    if (!this.els.play) return;
    // Swap CSS class for play/pause icon
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
      currentAlbum: this.currentAlbum
    };
  }
}

// Global instance
const audioPlayer = new AudioPlayer();
window.audioPlayer = audioPlayer;
window.playSong = (songId, albumId) => audioPlayer.playSong(songId, albumId);

// Build when container exists
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => audioPlayer.build());
} else {
  audioPlayer.build();
}