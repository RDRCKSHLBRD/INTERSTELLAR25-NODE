// public/js/ui-manager.js
// ESM UI Manager - CLEANED VERSION (no hardcoded purchase links)

import apiClient, { showError } from './api-client.js';

/**
 * Complete UI Manager for Interstellar Packages
 * Ports all original DOM manipulation and event handling from script.js
 * CLEANED: Removed hardcoded Stripe purchase links
 */
class UIManager {
  constructor() {
    this.currentAlbumId = null;
    this.enlargedImage = null;
    this.sidebarVisible = false;
  }

  /**
   * Load and display album art (ported from original loadAlbumArt)
   */
  async loadAlbumArt() {
    const albumArtContainer = document.querySelector('.album-art');
    if (!albumArtContainer) {
      console.error('Album art container not found');
      return;
    }

    // Clear existing content
    albumArtContainer.innerHTML = '';

    try {
      // Get albums from API
      const albums = await apiClient.getAlbums();

      if (albums.length === 0) {
        albumArtContainer.innerHTML = '<p class="no-albums">No albums found.</p>';
        return;
      }

      // Sort albums by ID for consistent order
      albums.sort((a, b) => a.id - b.id);

      // Create album art elements
      albums.forEach(album => {
        const img = document.createElement('img');
        img.src = album.cover_url;
        img.alt = `${album.name} Cover Art`;
        img.dataset.albumId = album.id;
        img.className = 'album-cover';

        // Loading state
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        });

        // Error handling
        img.addEventListener('error', () => {
          if (!img.dataset.errorFallback) {
            img.dataset.errorFallback = 'true';
            img.src = '/images/default-album-cover.png';
            img.alt = 'Album cover not available';
            img.classList.add('error');
          } else {
            console.warn('Skipping repeated error for album cover:', img.src);
          }
        });

        albumArtContainer.appendChild(img);

        // Click handler - EXACT port from original
        img.addEventListener('click', (event) => {
          this.handleAlbumClick(event, album);
        });
      });

      console.log(`✅ Loaded ${albums.length} album covers`);

    } catch (error) {
      console.error('Failed to load album art:', error);
      albumArtContainer.innerHTML = '<p class="error">Failed to load albums. Please try again.</p>';
    }
  }

  /**
   * Handle album click (ported from original click handler)
   */
  handleAlbumClick(event, album) {
    const clickedImg = event.currentTarget;

    if (clickedImg.classList.contains('enlarged')) {
      // Remove enlarged state
      clickedImg.classList.remove('enlarged');

    } else {
      // Remove 'enlarged' from all other images
      document.querySelectorAll('.album-art img').forEach(image => {
        image.classList.remove('enlarged');
      });

      // Add to the clicked one
      clickedImg.classList.add('enlarged');
      this.enlargedImage = clickedImg;

      // Display album details
      this.displayAlbumDetails(album.id);
    }
  }

  /**
   * Display album details in sidebar (ported from original)
   * CLEANED: Removed hardcoded purchase links
   */
  async displayAlbumDetails(albumId) {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    try {
      // Show sidebar
      this.showSidebar();
      this.currentAlbumId = albumId;

      const sidebarContent = document.querySelector('.sidebar .sidebar-content');
      if (!sidebarContent) return;

      // Show loading state
      sidebarContent.innerHTML = '<div class="loading-content"><div class="spinner"></div><p>Loading album details...</p></div>';

      // Get album data
      const album = await apiClient.getAlbum(albumId);

      if (!album) {
        sidebarContent.innerHTML = '<p class="error">Album not found.</p>';
        return;
      }

      // Clear and rebuild content
      sidebarContent.innerHTML = '';

      // Create album details container
      const albumDetails = document.createElement('div');
      albumDetails.classList.add('albumDetails');

      // Album title
      const title = document.createElement('h2');
      title.classList.add('albumName');
      title.textContent = album.name;
      albumDetails.appendChild(title);

      // Album description
      const description = document.createElement('p');
      description.classList.add('albumDescription');
      description.innerHTML = album.description;
      albumDetails.appendChild(description);

      // Album credit
      const credit = document.createElement('p');
      credit.classList.add('albumCredit');
      credit.innerHTML = album.credit;
      albumDetails.appendChild(credit);

      sidebarContent.appendChild(albumDetails);

      // Album info section
      const albumInfo = document.createElement('div');
      albumInfo.classList.add('album-info');

      const catalogueNumber = document.createElement('div');
      catalogueNumber.classList.add('catalogue-number');
      catalogueNumber.textContent = album.catalogue;
      albumInfo.appendChild(catalogueNumber);

      const productionDate = document.createElement('div');
      productionDate.classList.add('production-date');
      productionDate.textContent = album.production_date;
      albumInfo.appendChild(productionDate);

      const releaseDate = document.createElement('div');
      releaseDate.classList.add('release-date');
      releaseDate.textContent = album.release_date;
      albumInfo.appendChild(releaseDate);

      sidebarContent.appendChild(albumInfo);

      // SONG LIST (ported from original)
      const songListContainer = document.createElement('div');
      songListContainer.classList.add('songListContainer');

      const songList = document.createElement('ul');
      songList.classList.add('songList');

      // REPLACE the song list section in ui-manager.js displayAlbumDetails method
// Find this section and replace it:

if (album.songs && album.songs.length > 0) {
  album.songs.forEach(song => {
    const songItem = document.createElement('li');
    
    // Create song info container (clickable to play)
    const songInfo = document.createElement('div');
    songInfo.classList.add('song-info');
    songInfo.innerHTML = `
      <span class="song-text">${song.track_id}. ${song.name}</span>
      <span class="song-duration">${song.duration}</span>
    `;
    
    // Create action buttons container
    const songActions = document.createElement('div');
    songActions.classList.add('song-actions');
    
    // Add to Cart button
    const addCartBtn = document.createElement('button');
    addCartBtn.classList.add('song-action-btn', 'add-cart-btn');
    addCartBtn.title = 'Add to Cart';
    addCartBtn.setAttribute('aria-label', 'Add song to cart');
    addCartBtn.innerHTML = '<img src="/images/IP-CART-add-v1.svg" alt="Cart">';
    
    // Add to Playlist button  
    const addPlaylistBtn = document.createElement('button');
    addPlaylistBtn.classList.add('song-action-btn', 'add-playlist-btn');
    addPlaylistBtn.title = 'Add to Playlist';
    addPlaylistBtn.setAttribute('aria-label', 'Add song to playlist');
    addPlaylistBtn.innerHTML = '<img src="/images/IP-MUSIC-1.svg" alt="Playlist">';
    
    // Add to Favorites button
    const addFavoriteBtn = document.createElement('button');
    addFavoriteBtn.classList.add('song-action-btn', 'add-favorite-btn');
    addFavoriteBtn.title = 'Add to Favorites';
    addFavoriteBtn.setAttribute('aria-label', 'Add song to favorites');
    addFavoriteBtn.innerHTML = '<img src="/images/STAR-yellow.svg" alt="Favorite">';


    
    // Append action buttons
    songActions.appendChild(addCartBtn);
    songActions.appendChild(addPlaylistBtn);
    songActions.appendChild(addFavoriteBtn);
    
    // Append everything to song item
    songItem.appendChild(songInfo);
    songItem.appendChild(songActions);
    songList.appendChild(songItem);

    // EVENT LISTENERS
    
    // Click song info to play (existing behavior)
    songInfo.addEventListener('click', () => {
      if (window.audioPlayer) {
        window.audioPlayer.playSong(song.id, albumId);
      } else {
        window.playSong(song.id, albumId);
      }
      
      // Update visual state
      document.querySelectorAll('.sidebar .songList li.playing').forEach(item => {
        item.classList.remove('playing');
      });
      songItem.classList.add('playing');
    });
    
    // Add to Cart action
    addCartBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent song from playing
      if (window.cartManager) {
        window.cartManager.addSongToCart(song.id, song);
      } else {
        console.warn('Cart manager not available');
        showError('Cart functionality not available. Please refresh the page.');
      }
    });
    
    // Add to Playlist action (placeholder for now)
    addPlaylistBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Add to playlist:', song.name);
      // TODO: Implement playlist functionality
      alert(`Adding "${song.name}" to playlist (feature coming soon!)`);
    });
    
    // Add to Favorites action (placeholder for now)
    addFavoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Add to favorites:', song.name);
      // TODO: Implement favorites functionality  
      alert(`Adding "${song.name}" to favorites (feature coming soon!)`);
    });
  });
}

      songListContainer.appendChild(songList);
      sidebarContent.appendChild(songListContainer);

      // REMOVED: Hardcoded purchase links section
      // The old code that checked window.purchaseLinks[album.id] is now gone

      // ADD TO CART BUTTON (Modern cart system)
      const addToCartDiv = document.createElement('div');
      addToCartDiv.classList.add('addToCartLink');
      addToCartDiv.style.textAlign = 'center';
      addToCartDiv.style.marginTop = '10px';

      const addToCartBtn = document.createElement('button');
      addToCartBtn.textContent = 'Add to Cart';
      addToCartBtn.classList.add('add-to-cart-btn');
      addToCartBtn.style.cssText = `
        background-color: #2b7f8c;
        color: #fff;
        padding: 8px 16px;
        border: none;
        border-radius: 2px;
        cursor: pointer;
        font-size: 0.9em;
        transition: background-color 0.2s;
      `;
      
      // Hover effect
      addToCartBtn.addEventListener('mouseenter', () => {
        addToCartBtn.style.backgroundColor = '#19606b';
      });
      addToCartBtn.addEventListener('mouseleave', () => {
        addToCartBtn.style.backgroundColor = '#2b7f8c';
      });

      addToCartBtn.addEventListener('click', () => {
        // Use global cartManager
        if (window.cartManager) {
          window.cartManager.addAlbumToCart(album.id);
        } else {
          console.warn('Cart manager not available');
          showError('Cart functionality not available. Please refresh the page.');
        }
      });

      addToCartDiv.appendChild(addToCartBtn);
      sidebarContent.appendChild(addToCartDiv);

    } catch (error) {
      console.error('Failed to display album details:', error);
      const sidebarContent = document.querySelector('.sidebar .sidebar-content');
      sidebarContent.innerHTML = `
        <div class="error-content">
          <p>Failed to load album details.</p>
          <button class="retry-button" onclick="uiManager.displayAlbumDetails(${albumId})">Retry</button>
        </div>
      `;
    }
  }

  /**
   * Show sidebar (ported from original)
   */
  showSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.style.display = 'block';
    sidebar.style.flexBasis = '25%';
    this.sidebarVisible = true;
  }

  /**
   * Hide sidebar (ported from original)
   */
  hideSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.style.flexBasis = '0%';
    setTimeout(() => {
      sidebar.style.display = 'none';
    }, 500);
    this.sidebarVisible = false;
    this.currentAlbumId = null;
  }

  /**
   * Enhanced sidebar management (matches original exactly)
   */
  handleSidebarToggle() {
    const sidebar = document.querySelector('.sidebar');
    const enlargedImages = document.querySelectorAll('.album-art img.enlarged');

    if (this.sidebarVisible && enlargedImages.length > 0) {
      // If sidebar is visible and image is enlarged, hide both
      this.hideSidebar();
      enlargedImages.forEach(img => img.classList.remove('enlarged'));
      this.enlargedImage = null;
    }
  }

  /**
   * Setup keyboard shortcuts (enhanced from original)
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when not typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case ' ': // Spacebar - play/pause
          e.preventDefault();
          if (window.audioPlayer && window.audioPlayer.currentAudio) {
            if (window.audioPlayer.currentAudio.paused) {
              window.audioPlayer.play();
            } else {
              window.audioPlayer.pause();
            }
          }
          break;

        case 'ArrowRight': // Next track
          e.preventDefault();
          if (window.audioPlayer) {
            window.audioPlayer.nextTrack();
          }
          break;

        case 'ArrowLeft': // Previous track
          e.preventDefault();
          if (window.audioPlayer) {
            window.audioPlayer.previousTrack();
          }
          break;

        case 'Escape': // Close sidebar
          e.preventDefault();
          if (this.sidebarVisible) {
            this.hideSidebar();
            if (this.enlargedImage) {
              this.enlargedImage.classList.remove('enlarged');
              this.enlargedImage = null;
            }
          }
          break;

        case 'Enter': // Open/close album details
          e.preventDefault();
          if (this.enlargedImage && !this.sidebarVisible) {
            const albumId = parseInt(this.enlargedImage.dataset.albumId);
            this.displayAlbumDetails(albumId);
          }
          break;
      }
    });
  }

  /**
   * Setup search functionality
   */
  setupSearchFunctionality() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.performSearch(e.target.value);
      }, 300);
    });
  }

  /**
   * Perform search
   */
  async performSearch(query) {
    if (!query.trim()) {
      await this.loadAlbumArt(); // Reset to show all albums
      return;
    }

    try {
      const albums = await apiClient.searchAlbums(query);
      this.displaySearchResults(albums);
    } catch (error) {
      console.error('Search failed:', error);
      showError('Search failed. Please try again.');
    }
  }

  /**
   * Display search results
   */
  displaySearchResults(albums) {
    const albumArtContainer = document.querySelector('.album-art');
    albumArtContainer.innerHTML = '';

    if (albums.length === 0) {
      albumArtContainer.innerHTML = '<p class="no-results">No albums found matching your search.</p>';
      return;
    }

    albums.forEach(album => {
      const img = document.createElement('img');
      img.src = album.cover_url;
      img.alt = `${album.name} Cover Art`;
      img.dataset.albumId = album.id;
      img.className = 'album-cover';

      albumArtContainer.appendChild(img);

      // Add click handler
      img.addEventListener('click', (event) => {
        this.handleAlbumClick(event, album);
      });
    });
  }

  /**
   * Initialize all UI functionality
   */
  async initialize() {
    try {
      console.log('🎨 Initializing UI Manager...');

      // Load album art
      await this.loadAlbumArt();

      // Setup interactions
      this.setupKeyboardShortcuts();
      this.setupSearchFunctionality();

      console.log('✅ UI Manager initialized successfully');

    } catch (error) {
      console.error('❌ UI Manager initialization failed:', error);
      throw error;
    }
  }
}

// Global UI Manager instance
const uiManager = new UIManager();

// Make functions globally available for compatibility
window.loadAlbumArt = () => uiManager.loadAlbumArt();
window.displayAlbumDetails = (albumId) => uiManager.displayAlbumDetails(albumId);

// Make available globally
window.uiManager = uiManager;

// ESM exports
export default uiManager;
export { UIManager };