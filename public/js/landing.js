/**
 * Landing Page - Data-Driven with Config Integration
 * Uses root config.json + module configs
 */

class LandingPage {
    constructor() {
        this.config = null;
        this.layoutConfig = null;
        this.qtConfig = null;
        this.currentBreakpoint = null;
        this.root = document.documentElement;
    }

    async init() {
        try {
            console.log('🚀 Initializing Landing Page...');

            // Load all configs
            await this.loadConfigs();

            // Detect initial breakpoint
            this.detectBreakpoint();

            // Apply layout ratios
            this.applyLayoutRatios();

            // Apply QuadTree sizing
            this.applyQuadTreeSizing();

            // Load and render artists
            await this.loadArtists();

            // Set up responsive listeners
            this.setupResponsive();

            console.log('✅ Landing Page initialized');
            console.log(`📱 Breakpoint: ${this.currentBreakpoint}`);

        } catch (error) {
            console.error('❌ Landing page initialization failed:', error);
        }
    }

    async loadConfigs() {
        try {
            // Load root config
            const rootResponse = await fetch('/config.json');
            this.config = await rootResponse.json();

            // Try to load module configs (optional)
            try {
                const layoutResponse = await fetch('/config/layout.json');
                if (layoutResponse.ok) {
                    this.layoutConfig = await layoutResponse.json();
                }
            } catch (e) {
                console.log('📋 Using layout config from root');
                this.layoutConfig = this.config.layout.pages;
            }

            try {
                const qtResponse = await fetch('/config/quadtree.json');
                if (qtResponse.ok) {
                    this.qtConfig = await qtResponse.json();
                }
            } catch (e) {
                console.log('📋 Using quadtree config from root');
                this.qtConfig = this.config.quadtree;
            }

            console.log('⚙️ Configs loaded:', {
                root: !!this.config,
                layout: !!this.layoutConfig,
                quadtree: !!this.qtConfig
            });

        } catch (error) {
            throw new Error(`Config loading failed: ${error.message}`);
        }
    }

    detectBreakpoint() {
        const vw = window.innerWidth;
        const breakpoints = this.config.layout.breakpoints;

        // Find active breakpoint from config
        let active = 'mobile';
        const bpKeys = Object.keys(breakpoints)
            .map(k => parseInt(k))
            .sort((a, b) => a - b);

        for (const bp of bpKeys) {
            if (vw >= bp) {
                active = breakpoints[bp].name;
            }
        }

        this.currentBreakpoint = active;

        // Set data attribute for CSS
        this.root.dataset.breakpoint = active;

        // Determine mode (stack vs split)
        const mode = this.determineMode(vw);
        this.root.dataset.mode = mode;

        // Set orientation
        const orientation = vw > window.innerHeight ? 'landscape' : 'portrait';
        this.root.dataset.orientation = orientation;

        return active;
    }

    determineMode(vw) {
        const modes = this.config.state.modes;

        if (vw < modes.stack.maxWidth) {
            return 'stack';
        } else if (vw >= modes.split.minWidth) {
            return 'split';
        }

        return 'auto';
    }

    applyLayoutRatios() {
        // Get landing config from root or module
        const landingCfg = this.layoutConfig?.landing || this.config.layout.pages.landing;

        if (!landingCfg) {
            console.warn('⚠️ No landing config found');
            return;
        }

        // Get breakpoint-specific ratios if available
        const bpConfig = landingCfg.breakpoints?.[this.currentBreakpoint];

        // Video section
        const videoRatio = bpConfig?.video?.flexRatio || landingCfg.video?.flexRatio || landingCfg.splitRatio || 0.8;
        const sidebarRatio = bpConfig?.sidebar?.flexRatio || landingCfg.sidebar?.flexRatio || (1 - videoRatio);

        // Apply flex ratios
        this.root.style.setProperty('--video-flex', videoRatio);
        this.root.style.setProperty('--sidebar-flex', sidebarRatio);

        // Apply sidebar regions
        const regions = landingCfg.sidebar?.regions || {};
        this.root.style.setProperty('--sidebar-spacer-flex', regions.spacerTop || 0.05);
        this.root.style.setProperty('--sidebar-nav-flex', regions.navigation || 0.9);

        // Apply min/max widths
        this.root.style.setProperty('--video-min-width', landingCfg.video?.minWidth || '60vw');
        this.root.style.setProperty('--sidebar-min-width', landingCfg.sidebar?.minWidth || '20vw');
        this.root.style.setProperty('--sidebar-max-width', landingCfg.sidebar?.maxWidth || '400px');

        // Mobile-specific heights
        if (this.currentBreakpoint === 'mobile-sm' || this.currentBreakpoint === 'mobile') {
            this.root.style.setProperty('--video-height-mobile', bpConfig?.video?.height || '40vh');
            this.root.style.setProperty('--sidebar-height-mobile', bpConfig?.sidebar?.height || '60vh');
        }

        console.log('📐 Layout ratios applied:', {
            video: videoRatio,
            sidebar: sidebarRatio,
            mode: this.root.dataset.mode
        });
    }

    applyQuadTreeSizing() {
        // Get QuadTree element configs
        const elements = this.qtConfig?.elements || {};
        const artistLinkCfg = elements.artistLink?.[this.currentBreakpoint];

        if (!artistLinkCfg) {
            console.warn('⚠️ No QuadTree config for', this.currentBreakpoint);
            return;
        }

        // Apply artist link sizing
        this.root.style.setProperty('--qt-height', `${artistLinkCfg.baseHeight}px`);
        this.root.style.setProperty('--qt-min-height', `${artistLinkCfg.minHeight}px`);
        this.root.style.setProperty('--qt-max-height', `${artistLinkCfg.maxHeight}px`);
        this.root.style.setProperty('--qt-font-size', `${artistLinkCfg.fontSize}px`);
        this.root.style.setProperty('--qt-padding', `${artistLinkCfg.padding}px`);
        this.root.style.setProperty('--qt-gap', `${artistLinkCfg.gap}px`);

        // Typography details (letter-spacing scales with font size)
        const letterSpacing = artistLinkCfg.letterSpacing || (artistLinkCfg.fontSize * 0.05);
        this.root.style.setProperty('--qt-letter-spacing', `${letterSpacing}px`);
        this.root.style.setProperty('--qt-letter-spacing-hover', `${letterSpacing * 3}px`);

        // Animation distances (can scale with viewport or stay fixed)
        this.root.style.setProperty('--qt-slide-distance', '10px');
        this.root.style.setProperty('--qt-hover-distance', '5px');

        // Mobile font size override (slightly larger for touch targets)
        if (this.currentBreakpoint === 'mobile-sm' || this.currentBreakpoint === 'mobile') {
            this.root.style.setProperty('--qt-font-size-mobile', `${artistLinkCfg.fontSize * 1.2}px`);
        }

        console.log('🎯 QuadTree sizing applied:', artistLinkCfg);
    }

    async loadArtists() {
        try {
            const response = await fetch('/config/artists.json');
            const data = await response.json();

            const artistNav = document.getElementById('artistNav');

            if (!artistNav) {
                console.warn('⚠️ Artist nav element not found');
                return;
            }

            // Clear existing content
            artistNav.innerHTML = '';

            // Render artists sorted by order
            data.artists
                .sort((a, b) => a.order - b.order)
                .forEach(artist => {
                    const link = this.createArtistLink(artist);
                    artistNav.appendChild(link);
                });

            console.log(`✅ Loaded ${data.artists.length} artists`);

        } catch (error) {
            console.error('❌ Failed to load artists:', error);
        }
    }

    createArtistLink(artist) {
        const link = document.createElement('a');
        link.href = `/${artist.page}`;
        link.className = 'artist-link';
        link.textContent = artist.name;

        // Optional: Add data attributes for additional styling
        link.dataset.artistId = artist.id;
        if (artist.genre) {
            link.dataset.genre = artist.genre;
        }

        return link;
    }

    setupResponsive() {
        let resizeTimer;
        const throttleDelay = this.config.performance?.throttleResize || 100;

        const handleResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const oldBreakpoint = this.currentBreakpoint;
                this.detectBreakpoint();

                // Only re-apply if breakpoint changed
                if (oldBreakpoint !== this.currentBreakpoint) {
                    console.log(`📱 Breakpoint changed: ${oldBreakpoint} → ${this.currentBreakpoint}`);
                    this.applyLayoutRatios();
                    this.applyQuadTreeSizing();
                }
            }, throttleDelay);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            setTimeout(handleResize, 100);
        });

        console.log('👂 Responsive listeners active');
    }

    // Public API for debugging
    getState() {
        return {
            breakpoint: this.currentBreakpoint,
            mode: this.root.dataset.mode,
            orientation: this.root.dataset.orientation,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            cssVariables: {
                videoFlex: getComputedStyle(this.root).getPropertyValue('--video-flex'),
                sidebarFlex: getComputedStyle(this.root).getPropertyValue('--sidebar-flex'),
                qtFontSize: getComputedStyle(this.root).getPropertyValue('--qt-font-size'),
                qtGap: getComputedStyle(this.root).getPropertyValue('--qt-gap')
            },
            config: {
                root: !!this.config,
                layout: !!this.layoutConfig,
                quadtree: !!this.qtConfig
            }
        };
    }
}

// Initialize landing page
const landingPage = new LandingPage();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => landingPage.init());
} else {
    landingPage.init();
}

// Expose for debugging
window.landingPage = landingPage;