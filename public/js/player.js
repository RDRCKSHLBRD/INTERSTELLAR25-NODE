// public/js/player.js
// Browser-compatible Audio Player

/**
 * Fixed Audio Player for Current Data Structure
 * Handles the actual API response format
 */
class AudioPlayer {
  constructor() {
    this.currentAudio = null;
    this.currentSong = null;
    this.currentAlbum = null;
    this.isLooping = false;
    this.playerContainer = null;
  }

  /**
   * Initialize the player with song and album data
   */
  async playSong(songId, albumId) {
    try {
      console.log(`🎵 Playing song ${songId} from album ${albumId}`);
      
      // Get album data first (which should include songs)
      let album = null;
      
      // Try to get album from API if apiClient is available
      if (window.apiClient) {
        album = await window.apiClient.getAlbum(albumId);
      }
      
      // Fallback to global data if no API client
      if (!album && window.data && window.data.albums) {
        album = window.data.albums[albumId];
      }

      if (!album) {
        throw new Error('Album not found');
      }

      // Find the song in the album's songs array
      let song = null;
      if (album.songs && Array.isArray(album.songs)) {
        song = album.songs.find(s => s.id === songId);
      }

      // If not found in album, try to get from global data
      if (!song && window.data && window.data.songs) {
        song = window.data.songs[songId];
      }

      // If still not found, try direct API call
      if (!song && window.apiClient) {
        try {
          song = await window.apiClient.getSong(songId);
        } catch (error) {
          console.warn('Direct song API call failed:', error);
        }
      }

      if (!song) {
        throw new Error(`Song ${songId} not found`);
      }

      console.log('🎵 Song found:', song);
      console.log('📀 Album data:', album);

      this.currentSong = song;
      this.currentAlbum = album;

      this.setupPlayer();
      this.loadAudio();
      
    } catch (error) {
      console.error('Failed to play song:', error);
      this.showError(`Failed to load song: ${error.message}`);
    }
  }

  /**
   * Set up the player UI
   */
  setupPlayer() {
    this.playerContainer = document.querySelector('.player');
    if (!this.playerContainer) {
      console.error('Player container not found');
      return;
    }

    this.playerContainer.innerHTML = ''; // Clear previous content
    this.createPlayerUI();
    this.attachEventListeners();
  }

  /**
   * Create the player user interface
   */
  createPlayerUI() {
    // Now Playing Title
    const nowPlaying = document.createElement('p');
    nowPlaying.textContent = this.currentSong.name;
    nowPlaying.classList.add('PlayerSong');
    this.playerContainer.appendChild(nowPlaying);

    // Audio element
    const audio = document.createElement('audio');
    audio.src = this.currentSong.audio_url;
    audio.id = 'audio-player';
    audio.preload = 'metadata';
    this.playerContainer.appendChild(audio);
    this.currentAudio = audio;

    // Custom controls container
    const controls = document.createElement('div');
    controls.classList.add('custom-audio-controls');

    // Control buttons
    const buttons = [
      { id: 'play', class: 'play', title: 'Play', },
      { id: 'pause', class: 'pause', title: 'Pause', },
      { id: 'stop', class: 'stop', title: 'Stop', },
      { id: 'back-30', class: 'back30', title: 'Back 30s',},
      { id: 'forward-30', class: 'forward30', title: 'Forward 30s',},
      { id: 'prev-track', class: 'back', title: 'Previous Track',},
      { id: 'next-track', class: 'next', title: 'Next Track',},
      { id: 'loop', class: 'loop', title: 'Loop', }
    ];

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.id = btn.id;
      button.classList.add(btn.class);
      button.title = btn.title;
      button.textContent = btn.text;
      button.setAttribute('aria-label', btn.title);
      controls.appendChild(button);
    });

    // Volume control
    const volumeControl = document.createElement('div');
    volumeControl.classList.add('volume-control');
    
    const volumeLabel = document.createElement('label');
   
    volumeLabel.className = 'volume-label';
    volumeControl.appendChild(volumeLabel);
    
    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.id = 'volume-slider';
    volumeSlider.min = 0;
    volumeSlider.max = 1;
    volumeSlider.step = 0.01;
    volumeSlider.value = 1;
    volumeSlider.setAttribute('aria-label', 'Volume control');
    volumeControl.appendChild(volumeSlider);
    
    controls.appendChild(volumeControl);

    // Progress container
    const progressContainer = document.createElement('div');
    progressContainer.classList.add('progress-container');
    progressContainer.setAttribute('role', 'progressbar');
    progressContainer.setAttribute('aria-label', 'Song progress');
    
    const progressBar = document.createElement('div');
    progressBar.classList.add('progress-bar');
    progressContainer.appendChild(progressBar);
    
    controls.appendChild(progressContainer);

    // Time display
    const timeDisplay = document.createElement('div');
    timeDisplay.classList.add('time-display');
    
    const currentTime = document.createElement('span');
    currentTime.id = 'current-time';
    currentTime.textContent = '0:00';
    timeDisplay.appendChild(currentTime);

    const separator = document.createElement('span');
    separator.textContent = ' / ';
    timeDisplay.appendChild(separator);

    const duration = document.createElement('span');
    duration.id = 'duration';
    duration.textContent = '0:00';
    timeDisplay.appendChild(duration);

    controls.appendChild(timeDisplay);

    // Append controls to player
    this.playerContainer.appendChild(controls);
  }

  /**
   * Attach event listeners to player controls
   */
  attachEventListeners() {
    const audio = this.currentAudio;
    
    // Control button events
    document.getElementById('play').addEventListener('click', () => this.play());
    document.getElementById('pause').addEventListener('click', () => this.pause());
    document.getElementById('stop').addEventListener('click', () => this.stop());
    document.getElementById('forward-30').addEventListener('click', () => this.seekForward(30));
    document.getElementById('back-30').addEventListener('click', () => this.seekBackward(30));
    document.getElementById('next-track').addEventListener('click', () => this.nextTrack());
    document.getElementById('prev-track').addEventListener('click', () => this.previousTrack());
    document.getElementById('loop').addEventListener('click', () => this.toggleLoop());

    // Volume control
    const volumeSlider = document.getElementById('volume-slider');
    volumeSlider.addEventListener('input', (e) => {
      audio.volume = e.target.value;
    });

    // Progress bar click to seek
    const progressContainer = document.querySelector('.progress-container');
    progressContainer.addEventListener('click', (e) => this.seekToPosition(e));

    // Audio events
    audio.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
    audio.addEventListener('timeupdate', () => this.onTimeUpdate());
    audio.addEventListener('ended', () => this.onEnded());
    audio.addEventListener('error', (e) => this.onError(e));
    audio.addEventListener('loadstart', () => this.onLoadStart());
    audio.addEventListener('canplay', () => this.onCanPlay());
  }

  /**
   * Enhanced autoplay with fallback (matches original)
   */
  async loadAudio() {
    if (this.currentAudio) {
      this.currentAudio.load();
      
      // Try autoplay, handle if blocked
      try {
        await this.play();
      } catch (error) {
        console.log('Autoplay blocked, user interaction required');
        // Show play button as active state
        this.updatePlayButton(true);
      }
    }
  }

  /**
   * Play audio
   */
  async play() {
    if (!this.currentAudio) return;
    
    try {
      await this.currentAudio.play();
      this.updatePlayButton(false);
    } catch (error) {
      console.error('Playback failed:', error);
      this.showError('Playback failed. Please try again.');
    }
  }

  /**
   * Pause audio
   */
  pause() {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      this.updatePlayButton(true);
    }
  }

  /**
   * Stop audio
   */
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.updatePlayButton(true);
    }
  }

  /**
   * Seek forward by specified seconds
   */
  seekForward(seconds) {
    if (this.currentAudio) {
      this.currentAudio.currentTime = Math.min(
        this.currentAudio.currentTime + seconds, 
        this.currentAudio.duration
      );
    }
  }

  /**
   * Seek backward by specified seconds
   */
  seekBackward(seconds) {
    if (this.currentAudio) {
      this.currentAudio.currentTime = Math.max(
        this.currentAudio.currentTime - seconds, 
        0
      );
    }
  }

  /**
   * Toggle loop mode
   */
  toggleLoop() {
    this.isLooping = !this.isLooping;
    const loopButton = document.getElementById('loop');
    loopButton.classList.toggle('active', this.isLooping);
    loopButton.setAttribute('aria-pressed', this.isLooping);
    console.log(`🔄 Loop ${this.isLooping ? 'enabled' : 'disabled'}`);
  }

  /**
   * Play next track in album
   */
  async nextTrack() {
    if (!this.currentAlbum || !this.currentSong) {
      console.log('No album or song for next track');
      return;
    }

    const songs = this.currentAlbum.songs;
    if (!songs || !Array.isArray(songs)) {
      console.log('No songs array in current album');
      return;
    }

    const currentIndex = songs.findIndex(song => song.id === this.currentSong.id);
    
    if (currentIndex !== -1 && currentIndex + 1 < songs.length) {
      const nextSong = songs[currentIndex + 1];
      console.log(`⏭️ Playing next track: ${nextSong.name}`);
      await this.playSong(nextSong.id, this.currentAlbum.id);
    } else {
      console.log('Already at last track');
    }
  }

  /**
   * Play previous track in album
   */
  async previousTrack() {
    if (!this.currentAlbum || !this.currentSong) {
      console.log('No album or song for previous track');
      return;
    }

    const songs = this.currentAlbum.songs;
    if (!songs || !Array.isArray(songs)) {
      console.log('No songs array in current album');
      return;
    }

    const currentIndex = songs.findIndex(song => song.id === this.currentSong.id);

    if (currentIndex > 0) {
      const prevSong = songs[currentIndex - 1];
      console.log(`⏮️ Playing previous track: ${prevSong.name}`);
      await this.playSong(prevSong.id, this.currentAlbum.id);
    } else {
      console.log('Already at first track');
    }
  }

  /**
   * Seek to specific position on progress bar
   */
  seekToPosition(event) {
    if (!this.currentAudio) return;

    const progressContainer = event.currentTarget;
    const rect = progressContainer.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const clickRatio = offsetX / rect.width;
    
    this.currentAudio.currentTime = clickRatio * this.currentAudio.duration;
  }

  /**
   * Update play button state
   */
  updatePlayButton(showPlay) {
    const playButton = document.getElementById('play');
    const pauseButton = document.getElementById('pause');
    
    if (playButton && pauseButton) {
      if (showPlay) {
        playButton.style.display = 'inline-block';
        pauseButton.style.display = 'none';
      } else {
        playButton.style.display = 'none';
        pauseButton.style.display = 'inline-block';
      }
    }
  }

  /**
   * Audio event handlers
   */
  onLoadedMetadata() {
    const durationElement = document.getElementById('duration');
    if (durationElement && this.currentAudio) {
      durationElement.textContent = this.formatTime(this.currentAudio.duration);
    }
  }

  onTimeUpdate() {
    if (!this.currentAudio) return;

    const progressBar = document.querySelector('.progress-bar');
    const currentTimeElement = document.getElementById('current-time');

    if (progressBar) {
      const progressPercent = (this.currentAudio.currentTime / this.currentAudio.duration) * 100;
      progressBar.style.width = `${progressPercent}%`;
    }

    if (currentTimeElement) {
      currentTimeElement.textContent = this.formatTime(this.currentAudio.currentTime);
    }
  }

  onEnded() {
    if (this.isLooping) {
      this.currentAudio.currentTime = 0;
      this.play();
    } else {
      this.nextTrack();
    }
  }

  onError(event) {
    console.error('Audio error:', event);
    this.showError('Audio playback error. Please try again.');
  }

  onLoadStart() {
    console.log('🔄 Loading audio...');
  }

  onCanPlay() {
    console.log('✅ Audio ready to play');
  }

  /**
   * Format time in MM:SS format
   */
  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  /**
   * Show error message
   */
  showError(message) {
    // Use global showError if available, otherwise create simple alert
    if (window.showError) {
      window.showError(message);
    } else {
      console.error(message);
      // Create simple error display
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:#f44336;color:white;padding:10px;border-radius:4px;z-index:10000;';
      errorDiv.textContent = message;
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
    }
  }

  /**
   * Cleanup when changing songs
   */
  cleanup() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
  }

  /**
   * Get current playback state
   */
  getState() {
    return {
      isPlaying: this.currentAudio && !this.currentAudio.paused,
      currentTime: this.currentAudio ? this.currentAudio.currentTime : 0,
      duration: this.currentAudio ? this.currentAudio.duration : 0,
      volume: this.currentAudio ? this.currentAudio.volume : 1,
      isLooping: this.isLooping,
      currentSong: this.currentSong,
      currentAlbum: this.currentAlbum
    };
  }
}

// Global player instance
const audioPlayer = new AudioPlayer();

// Global function for compatibility with existing code
window.playSong = function(songId, albumId) {
  audioPlayer.playSong(songId, albumId);
};

// Make available globally
window.audioPlayer = audioPlayer;