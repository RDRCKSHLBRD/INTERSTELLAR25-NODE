/**
 * Main Application Script for Interstellar Packages
 * API-driven version - CLEANED VERSION (no hardcoded Stripe links)
 */

import apiClient, { loadingManager, showError } from './api-client.js';
import uiManager from './ui-manager.js';

// Global data object (populated from API)
let data = {
  artists: {},
  albums: {},
  songs: {}
};

// REMOVED: Global purchase links object - now handled by cart system

/**
 * Application Initialization
 */
async function initializeApp() {
  try {
    showLoadingState('Loading music collection...');
    
    // Load data from API
    data = await apiClient.getOrganizedData();
    
    // Check if we have data
    const albumCount = Object.keys(data.albums).length;
    if (albumCount === 0) {
      throw new Error('No albums found in database');
    }
    
    console.log(`✅ Loaded ${albumCount} albums from API`);
    
    // Initialize UI using the UI Manager
    await uiManager.initialize();
    
    hideLoadingState();
    
    // Albums loaded silently now - better UX
    
  } catch (error) {
    hideLoadingState();
    console.error('App initialization failed:', error);
    
    // Fallback to static data if API fails
    if (typeof initializeWithStaticData === 'function') {
      console.log('🔄 Falling back to static data...');
      showError('API unavailable. Loading from static files...');
      initializeWithStaticData();
    } else {
      showError('Failed to load music data. Please refresh the page or check your connection.');
      showRetryButton();
    }
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
 * Success message (kept for potential future use)
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
  albumArtContainer.innerHTML = `
    <div class="retry-container">
      <p>Failed to load music collection.</p>
      <button class="retry-button" onclick="initializeApp()">Retry</button>
    </div>
  `;
}

/**
 * API status monitoring
 */
function monitorAPIStatus() {
  const statusIndicator = document.createElement('div');
  statusIndicator.className = 'api-status';
  statusIndicator.textContent = 'API Connected';
  document.body.appendChild(statusIndicator);

  // Test API connectivity periodically
  setInterval(async () => {
    try {
      await fetch('/api/health');
      statusIndicator.className = 'api-status connected';
      statusIndicator.textContent = 'API Connected';
    } catch (error) {
      statusIndicator.className = 'api-status disconnected show';
      statusIndicator.textContent = 'API Disconnected';
    }
  }, 30000); // Check every 30 seconds
}

/**
 * Fallback to static data (if available)
 */
function initializeWithStaticData() {
  // This would use the original script.js data as fallback
  // Implementation depends on whether we keep the static data available
  console.log('Static data fallback not implemented yet');
}

/**
 * Compatibility layer for original script.js functions
 */
function ensureCompatibility() {
  // Make sure global functions exist for any remaining references
  if (!window.loadAlbumArt) {
    window.loadAlbumArt = () => uiManager.loadAlbumArt();
  }
  
  if (!window.displayAlbumDetails) {
    window.displayAlbumDetails = (albumId) => uiManager.displayAlbumDetails(albumId);
  }
  
  if (!window.playSong) {
    window.playSong = (songId, albumId) => audioPlayer.playSong(songId, albumId);
  }
  
  // Ensure data object structure matches original
  if (!window.data) {
    window.data = { artists: {}, albums: {}, songs: {} };
  }
}

/**
 * App startup
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎵 Interstellar Packages - Starting App...');
  
  // Ensure compatibility
  ensureCompatibility();
  
  // Initialize API monitoring
  monitorAPIStatus();
  
  // Start the app
  initializeApp();
});

// Global error handler
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  showError('An unexpected error occurred. Please refresh the page.');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  showError('A network error occurred. Please check your connection.');
});

// Export globals for compatibility
window.data = data;
window.loadAlbumArt = () => uiManager.loadAlbumArt();
window.displayAlbumDetails = (albumId) => uiManager.displayAlbumDetails(albumId);
window.initializeApp = initializeApp;