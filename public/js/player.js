// ============================================================================
// public/js/player.js — V5 Session 3
//
// Custom audio player. No browser user-agent controls.
// All UI built by DOM creation, styled inline from paint tokens.
// Exposes window.audioPlayer for global access.
//
// Layout: horizontal bar — [prev][play/pause][next] [stop] [progress] [time] [vol] [loop] [cart]
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

    // Player bar
    const bar = document.createElement('div');
    Object.assign(bar.style, {
      display: 'flex', alignItems: 'center', gap: '8px',
      width: '100%', padding: '4px 12px', fontFamily: 'Helvetica, sans-serif'
    });

    // Song title
    this.els.title = this._el('span', {
      fontSize: '12px', fontWeight: '400', color: '#cadbda',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      maxWidth: '180px', minWidth: '60px'
    }, '—');
    bar.appendChild(this.els.title);

    // Separator
    bar.appendChild(this._el('span', { color: 'rgba(138,183,206,0.3)', margin: '0 2px' }, '|'));

    // Transport buttons
    const btns = [
      { key: 'prev',  label: '⏮', title: 'Previous',   fn: () => this.previousTrack() },
      { key: 'play',  label: '▶',  title: 'Play',       fn: () => this.togglePlay() },
      { key: 'next',  label: '⏭', title: 'Next',       fn: () => this.nextTrack() },
      { key: 'stop',  label: '■',  title: 'Stop',       fn: () => this.stop() },
    ];

    btns.forEach(b => {
      const btn = this._btn(b.label, b.title, b.fn);
      this.els[b.key] = btn;
      bar.appendChild(btn);
    });

    // Progress bar
    const progWrap = document.createElement('div');
    Object.assign(progWrap.style, {
      flex: '1', height: '6px', background: 'rgba(138,183,206,0.15)',
      borderRadius: '3px', cursor: 'pointer', position: 'relative',
      minWidth: '80px'
    });
    this.els.progFill = document.createElement('div');
    Object.assign(this.els.progFill.style, {
      height: '100%', width: '0%', background: '#3AA0A0',
      borderRadius: '3px', transition: 'width 0.1s linear', pointerEvents: 'none'
    });
    progWrap.appendChild(this.els.progFill);
    progWrap.addEventListener('click', (e) => this._seekTo(e, progWrap));
    bar.appendChild(progWrap);

    // Time
    this.els.time = this._el('span', {
      fontSize: '11px', fontFamily: 'monospace', color: '#8ab7ce',
      whiteSpace: 'nowrap', minWidth: '70px', textAlign: 'center'
    }, '0:00 / 0:00');
    bar.appendChild(this.els.time);

    // Volume
    const volWrap = document.createElement('div');
    Object.assign(volWrap.style, { display: 'flex', alignItems: 'center', gap: '4px' });
    volWrap.appendChild(this._el('span', { fontSize: '11px', color: '#8ab7ce' }, '🔊'));

    const volTrack = document.createElement('div');
    Object.assign(volTrack.style, {
      width: '50px', height: '4px', background: 'rgba(138,183,206,0.15)',
      borderRadius: '2px', cursor: 'pointer', position: 'relative'
    });
    this.els.volFill = document.createElement('div');
    Object.assign(this.els.volFill.style, {
      height: '100%', width: '80%', background: '#3AA0A0',
      borderRadius: '2px', pointerEvents: 'none'
    });
    volTrack.appendChild(this.els.volFill);
    volTrack.addEventListener('click', (e) => this._setVolume(e, volTrack));
    volWrap.appendChild(volTrack);
    bar.appendChild(volWrap);

    // Loop button
    this.els.loop = this._btn('↻', 'Loop', () => this.toggleLoop());
    bar.appendChild(this.els.loop);

    // Add to cart button
    this.els.cart = this._btn('🛒', 'Add Track to Cart', () => {
      if (window.cartManager && this.currentSong) {
        window.cartManager.addSongToCart(this.currentSong.id, this.currentSong);
      }
    });
    bar.appendChild(this.els.cart);

    this.container.appendChild(bar);

    // Audio events
    this.audio.addEventListener('loadedmetadata', () => this._updateDuration());
    this.audio.addEventListener('timeupdate', () => this._updateProgress());
    this.audio.addEventListener('ended', () => this._onEnded());
    this.audio.addEventListener('error', () => this._showError('Audio playback error'));

    // Set initial volume
    this.audio.volume = this.volume;
  }

  // ── DOM helpers ──────────────────────────────────────────────
  _el(tag, styles, text) {
    const el = document.createElement(tag);
    if (styles) Object.assign(el.style, styles);
    if (text) el.textContent = text;
    return el;
  }

  _btn(label, title, fn) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.title = title;
    btn.setAttribute('aria-label', title);
    Object.assign(btn.style, {
      background: 'none', border: 'none', color: '#cadbda',
      fontSize: '14px', cursor: 'pointer', padding: '2px 5px',
      borderRadius: '2px', transition: 'color 0.15s, background 0.15s',
      lineHeight: '1'
    });
    btn.addEventListener('mouseenter', () => { btn.style.color = '#3AA0A0'; });
    btn.addEventListener('mouseleave', () => {
      btn.style.color = btn.dataset.active === 'true' ? '#3AA0A0' : '#cadbda';
    });
    btn.addEventListener('click', fn);
    return btn;
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
    this.els.loop.style.color = this.isLooping ? '#3AA0A0' : '#cadbda';
  }

  // ── Internal UI updates ──────────────────────────────────────
  _updatePlayBtn(playing) {
    if (this.els.play) this.els.play.textContent = playing ? '⏸' : '▶';
  }

  _updateDuration() {
    this._updateProgress();
  }

  _updateProgress() {
    if (!this.audio) return;
    const cur = this.audio.currentTime || 0;
    const dur = this.audio.duration || 0;
    const pct = dur > 0 ? (cur / dur) * 100 : 0;
    if (this.els.progFill) this.els.progFill.style.width = `${pct}%`;
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

// Build immediately when container exists
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => audioPlayer.build());
} else {
  audioPlayer.build();
}