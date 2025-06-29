/**
 * API Client for Interstellar Packages - FIXED VERSION
 * Handles actual API response formats correctly
 */

class APIClient {
  constructor() {
    this.baseURL = '';  // Same origin
    this.cache = {
      artists: null,
      albums: null,
      songs: null
    };
  }

  /**
   * Generic fetch wrapper with error handling
   */
  async fetchAPI(endpoint, options = {}) {
    const url = `${this.baseURL}/api${endpoint}`;
    
    try {
      console.log(`🔗 Fetching: ${url}`);
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API Response for ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`❌ API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get all artists
   */
  async getArtists() {
    if (this.cache.artists) {
      return this.cache.artists;
    }

    try {
      const response = await this.fetchAPI('/artists');
      
      // Handle different response formats
      let artists;
      if (response.success && response.data && Array.isArray(response.data)) {
        artists = response.data;
      } else if (Array.isArray(response)) {
        artists = response;
      } else if (response.artists && Array.isArray(response.artists)) {
        artists = response.artists;
      } else {
        console.warn('Unexpected artists response format:', response);
        artists = [];
      }

      this.cache.artists = artists;
      return artists;
    } catch (error) {
      console.error('Failed to fetch artists:', error);
      return [];
    }
  }

  /**
   * Get all albums with their songs - FIXED VERSION
   */
  async getAlbums() {
    if (this.cache.albums && Array.isArray(this.cache.albums)) {
      return this.cache.albums;
    }

    try {
      const response = await this.fetchAPI('/albums');
      
      let albums;
      // Handle the API response structure correctly
      if (response.success && response.data && Array.isArray(response.data)) {
        // This is the correct path for your API response
        albums = response.data;
      } else if (Array.isArray(response)) {
        // Fallback for direct array
        albums = response;
      } else if (response.albums && Array.isArray(response.albums)) {
        // Another possible structure
        albums = response.albums;
      } else {
        console.warn('Unexpected albums response format:', response);
        albums = [];
      }

      console.log('📚 Albums loaded:', albums.length);

      const transformedAlbums = albums.map(album => ({
        id: album.id,
        catalogue: album.catalogue,
        name: album.name,
        cover_url: album.cover_url,
        production_date: album.production_date,
        release_date: album.release_date,
        artist_id: album.artist_id,
        credit: album.credit,
        description: album.description,
        tracks: album.tracks,
        songs: album.songs || [] // This should be empty for the albums list
      }));

      // Cache the array
      this.cache.albums = transformedAlbums;
      return transformedAlbums;
    } catch (error) {
      console.error('Failed to fetch albums:', error);
      return [];
    }
  }

  /**
   * Get specific album with songs - FIXED VERSION
   */
  async getAlbum(albumId) {
    try {
      const response = await this.fetchAPI(`/albums/${albumId}`);
      
      // Handle the API response structure correctly
      let album;
      if (response.success && response.data) {
        // This is the correct path for your API response
        album = response.data;
      } else if (response && response.id) {
        // Fallback for direct album object
        album = response;
      } else if (response.album) {
        // Another possible structure
        album = response.album;
      } else {
        console.warn('Unexpected album response format:', response);
        return null;
      }

      console.log('📀 Album loaded with songs:', album);
      console.log('🎵 Song count:', album.songs?.length || 0);
      
      // Log the track_ids to debug the numbering issue
      if (album.songs) {
        console.log('🔢 Track IDs:', album.songs.map(s => s.track_id));
      }

      return album;
    } catch (error) {
      console.error(`Failed to fetch album ${albumId}:`, error);
      return null;
    }
  }

  /**
   * Get all songs - FIXED VERSION
   */
  async getSongs() {
    // Return cached copy if we already fetched once
    if (this.cache.songs) return this.cache.songs;

    try {
      // Hit the API
      const response = await this.fetchAPI('/songs');

      // Normalize payload to a flat array
      const songs =
        response.success && Array.isArray(response.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : Array.isArray(response?.songs)
              ? response.songs
              : (console.warn('[API] Unexpected /songs payload', response), []);

      // Cache and return
      this.cache.songs = songs;
      return songs;
    } catch (err) {
      console.error('Failed to fetch songs:', err);
      return [];
    }
  }

  /**
   * Get specific song
   */
  async getSong(songId) {
    try {
      const response = await this.fetchAPI(`/songs/${songId}`);
      
      // Handle single song response
      let song;
      if (response.success && response.data) {
        song = response.data;
      } else if (response && response.id) {
        song = response;
      } else if (response.song) {
        song = response.song;
      } else {
        console.warn('Unexpected song response format:', response);
        return null;
      }

      return song;
    } catch (error) {
      console.error(`Failed to fetch song ${songId}:`, error);
      return null;
    }
  }

  /**
   * Search functionality
   */
  async searchAlbums(query) {
    try {
      const albums = await this.getAlbums();
      if (!Array.isArray(albums)) {
        console.warn('Albums is not an array for search:', albums);
        return [];
      }
      
      return albums.filter(album => 
        album.name && album.name.toLowerCase().includes(query.toLowerCase()) ||
        album.description && album.description.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  /**
   * Clear cache (useful for refreshing data)
   */
  clearCache() {
    this.cache = {
      artists: null,
      albums: null,
      songs: null
    };
  }

  /**
   * Get organized data structure (compatible with existing frontend)
   */
  async getOrganizedData() {
    try {
      console.log('🔄 Getting organized data...');
      
      const [artists, albums, songs] = await Promise.all([
        this.getArtists(),
        this.getAlbums(),
        this.getSongs()
      ]);

      console.log('📊 Raw API data:', { 
        artists: artists?.length || 0, 
        albums: albums?.length || 0, 
        songs: songs?.length || 0 
      });

      // Create data structure compatible with existing frontend
      const data = {
        artists: {},
        albums: {},
        songs: {}
      };

      // Safely handle artists
      if (Array.isArray(artists)) {
        artists.forEach(artist => {
          data.artists[artist.id] = {
            ...artist,
            albums: []
          };
        });
      } else {
        console.warn('Artists is not an array:', artists);
      }

      // Safely handle albums
      if (Array.isArray(albums)) {
        albums.forEach(album => {
          data.albums[album.id] = album;
          
          if (data.artists[album.artist_id]) {
            data.artists[album.artist_id].albums.push(album);
          }
        });
      } else {
        console.warn('Albums is not an array:', albums);
      }

      // Safely handle songs
      if (Array.isArray(songs)) {
        songs.forEach(song => {
          data.songs[song.id] = song;
        });
      } else {
        console.warn('Songs is not an array:', songs);
      }

      console.log('✅ Organized data structure:', {
        artists: Object.keys(data.artists).length,
        albums: Object.keys(data.albums).length,
        songs: Object.keys(data.songs).length
      });

      return data;
    } catch (error) {
      console.error('Failed to get organized data:', error);
      return { artists: {}, albums: {}, songs: {} };
    }
  }

  /**
   * Test API connectivity
   */
  async testConnection() {
    try {
      console.log('🔍 Testing API connection...');
      const response = await fetch('/api/health');
      if (response.ok) {
        console.log('✅ API connection successful');
        return true;
      } else {
        console.warn('⚠️ API health check failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ API connection failed:', error);
      return false;
    }
  }
}

/**
 * Loading state management
 */
class LoadingManager {
  constructor() {
    this.isLoading = false;
    this.loadingElement = null;
  }

  showLoading(message = 'Loading...') {
    if (this.isLoading) return;
    
    this.isLoading = true;
    
    // Create loading overlay
    this.loadingElement = document.createElement('div');
    this.loadingElement.className = 'loading-overlay';
    this.loadingElement.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
    `;
    
    document.body.appendChild(this.loadingElement);
  }

  hideLoading() {
    if (!this.isLoading || !this.loadingElement) return;
    
    this.isLoading = false;
    if (this.loadingElement.parentNode) {
      document.body.removeChild(this.loadingElement);
    }
    this.loadingElement = null;
  }
}

/**
 * Error handling
 */
function showError(message, duration = 5000) {
  const errorElement = document.createElement('div');
  errorElement.className = 'error-notification';
  errorElement.innerHTML = `
    <div class="error-content">
      <span class="error-icon">⚠️</span>
      <span class="error-message">${message}</span>
      <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  document.body.appendChild(errorElement);
  
  // Auto-remove after duration
  setTimeout(() => {
    if (errorElement.parentNode) {
      errorElement.remove();
    }
  }, duration);
}

// Global instances
const apiClient = new APIClient();
const loadingManager = new LoadingManager();

// Make available globally for non-ESM scripts
window.apiClient = apiClient;
window.loadingManager = loadingManager;
window.showError = showError;

// Test API on load
document.addEventListener('DOMContentLoaded', async () => {
  await apiClient.testConnection();
});

// ESM exports
export default apiClient;
export { APIClient, LoadingManager, showError, loadingManager };