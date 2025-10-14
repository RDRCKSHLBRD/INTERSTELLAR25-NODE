/**
 * Landing Page - JSON-driven content
 */

async function initLanding() {
    try {
        // Load config for layout ratios
        const configResponse = await fetch('/config.json');
        const config = await configResponse.json();
        
        // Apply landing layout ratios from config
        const landingConfig = config.layout?.pages?.landing;
        if (landingConfig) {
            const root = document.documentElement;
            root.style.setProperty('--landing-split', landingConfig.splitRatio);
            root.style.setProperty('--sidebar-content-ratio', landingConfig.sidebar.contentRatio);
        }
        
        // Load artists from JSON
        const artistsResponse = await fetch('/artists.json');
        const artistsData = await artistsResponse.json();
        
        // Render artist links
        const artistNav = document.getElementById('artistNav');
        artistsData.artists
            .sort((a, b) => a.order - b.order)
            .forEach(artist => {
                const link = document.createElement('a');
                link.href = `/${artist.page}`;
                link.className = 'artist-link';
                link.textContent = artist.name;
                artistNav.appendChild(link);
            });
        
        console.log('✅ Landing page initialized');
        console.log(`📋 Loaded ${artistsData.artists.length} artists`);
        
    } catch (error) {
        console.error('❌ Landing page initialization failed:', error);
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanding);
} else {
    initLanding();
}