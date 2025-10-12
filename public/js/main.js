/**
 * Main Application Script for Interstellar Packages
 * API-driven version with InterstellarSystem integration
 */

import apiClient, { loadingManager, showError } from './api-client.js';
import uiManager from './ui-manager.js';

// Import the new system (optional - graceful fallback if not available)
let Interstellar = null;
try {
  const { default: InterstellarSystemModule } = await import('./InterstellarSystem.js');
  Interstellar = InterstellarSystemModule;
} catch (error) {
  console.log('ℹ️ InterstellarSystem not available, using standard mode');
}

// Global data object (populated from API)
let data = {
  artists: {},
  albums: {},
  songs: {}
};

/**
 * Application Initialization - ENHANCED
 */
async function initializeApp() {
  try {
    // Load data from API
    console.log('📡 Loading music collection...');
    data = await apiClient.getOrganizedData();
    
    // Check if we have data
    const albumCount = Object.keys(data.albums).length;
    if (albumCount === 0) {
      throw new Error('No albums found in database');
    }
    
    console.log(`✅ Loaded ${albumCount} albums from API`);
    
    // Initialize UI using the UI Manager
    await uiManager.initialize();
    
    // Hide loading state
    if (Interstellar && Interstellar.preloader) {
      Interstellar.preloader.hide();
    } else {
      hideLoadingState();
    }
    
    console.log('🎉 App ready!');
    
  } catch (error) {
    // Hide loading on error
    if (Interstellar && Interstellar.preloader) {
      Interstellar.preloader.forceHide();
    } else {
      hideLoadingState();
    }
    
    console.error('App initialization failed:', error);
    showError('Failed to load music data. Please refresh the page or check your connection.');
    showRetryButton();
  }
}

/**
 * Loading state management
 */
function showLoadingState(message = 'Loading...') {
  loadingManager.showLoading(message);
}

function hideLoadingState() {
  loadingManager.hideLoading();
}

/**
 * Success message
 */
function showSuccessMessage(message) {
  const successElement = document.createElement('div');
  successElement.className = 'success-notification';
  successElement.innerHTML = `
    <span>✅</span>
    <span>${message}</span>
  `;
  
  document.body.appendChild(successElement);
  
  setTimeout(() => {
    if (successElement.parentNode) {
      successElement.remove();
    }
  }, 3000);
}

/**
 * Retry functionality
 */
function showRetryButton() {
  const albumArtContainer = document.querySelector('.album-art');
  if (albumArtContainer) {
    albumArtContainer.innerHTML = `
      <div class="retry-container">
        <p>Failed to load music collection.</p>
        <button class="retry-button" onclick="window.initializeApp()">Retry</button>
      </div>
    `;
  }
}

/**
 * API status monitoring
 */
function monitorAPIStatus() {
  const statusIndicator = document.createElement('div');
  statusIndicator.className = 'api-status';
  statusIndicator.textContent = 'API Connected';
  document.body.appendChild(statusIndicator);

  setInterval(async () => {
    try {
      await fetch('/api/health');
      statusIndicator.className = 'api-status connected';
      statusIndicator.textContent = 'API Connected';
    } catch (error) {
      statusIndicator.className = 'api-status disconnected show';
      statusIndicator.textContent = 'API Disconnected';
    }
  }, 30000);
}

/**
 * Compatibility layer
 */
function ensureCompatibility() {
  if (!window.loadAlbumArt) {
    window.loadAlbumArt = () => uiManager.loadAlbumArt();
  }
  
  if (!window.displayAlbumDetails) {
    window.displayAlbumDetails = (albumId) => uiManager.displayAlbumDetails(albumId);
  }
  
  if (!window.playSong) {
    window.playSong = (songId, albumId) => {
      if (window.audioPlayer) {
        window.audioPlayer.playSong(songId, albumId);
      }
    };
  }
  
  if (!window.data) {
    window.data = { artists: {}, albums: {}, songs: {} };
  }
  
  if (Interstellar) {
    window.Interstellar = Interstellar;
  }
}

/**
 * System event listeners
 */
function setupSystemListeners() {
  if (!Interstellar) return;
  
  Interstellar.on('system:ready', (e) => {
    console.log('🎵 System ready, version:', e.detail.version);
  });

  Interstellar.on('layout:change', (e) => {
    const { mode, vw, vh } = e.detail.state;
    console.log(`📐 Layout: ${mode} (${vw}x${vh})`);
  });
}

/**
 * App startup - FIXED for module timing
 */
function startApp() {
  console.log('🎵 Interstellar Packages - Starting App...');
  
  setupSystemListeners();
  ensureCompatibility();
  monitorAPIStatus();
  initializeApp();
}

// Check if DOM is already loaded (it usually is for module scripts)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  // DOM already loaded, start immediately
  startApp();
}

/**
 * Global error handlers
 */
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  showError('An unexpected error occurred. Please refresh the page.');
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  showError('A network error occurred. Please check your connection.');
});

/**
 * Export globals for compatibility
 */
window.data = data;
window.loadAlbumArt = () => uiManager.loadAlbumArt();
window.displayAlbumDetails = (albumId) => uiManager.displayAlbumDetails(albumId);
window.initializeApp = initializeApp;

/**
 * Debug helpers
 */
if (Interstellar && Interstellar.get && Interstellar.get('debug.enabled')) {
  window.debugInterstellar = () => {
    console.log('=== INTERSTELLAR DEBUG ===');
    console.log('State:', Interstellar.getState());
    console.log('Config:', Interstellar.config);
    console.log('Layout:', Interstellar.layout?.getState());
    console.log('Metrics:', Interstellar.layout?.getMetrics());
    console.log('Data:', { 
      albums: Object.keys(data.albums).length,
      songs: Object.keys(data.songs).length,
      artists: Object.keys(data.artists).length
    });
    console.log('=========================');
  };
  
  console.log('💡 Debug mode enabled. Run window.debugInterstellar() to inspect.');
}