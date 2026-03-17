// ============================================================================
// public/js/footerQuadTree.js — V6.3 (RODUX Stack)
//
// QuadTree-driven footer layout engine.
// Full RODUX pipeline: StateJS → RatioEngine → cssJSON → QuadTree → CSS vars.
// NO flex. NO media queries. CSS is a dumb renderer.
//
// PIPELINE:
//   1. StateJS provides viewport state (vw, vh, breakpoint, orientation)
//   2. cssJSON config (footer.json) defines zone constraints per profile
//   3. RatioEngine computes proportional zone widths from ratios
//   4. QuadTree allocates zones into the footer strip (collision-free)
//   5. Results written as CSS vars on #artistControls + .footer-bar
//   6. CSS consumes vars. No layout logic in CSS.
//
// PROFILES:
//   State-driven, not media-query-driven. StateJS viewport dimensions
//   select a profile key from config thresholds. Each profile defines
//   its own ratios, constraints, visibility, and ordering.
//   Profiles are mathematical constraint sets, not "mobile/tablet/desktop".
//
// ZONE MODEL:
//   Zones: player, nav, logo
//   Each zone has: ratio (of total width), minPx, maxPx, visible, order
//   Player is greedy (gets remainder after fixed zones).
//   On compact profiles, zones stack (order + full-width).
//
// CSS VAR OUTPUT (set on .footer-bar):
//   --ft-height          computed footer height in px
//   --ft-player-x        player zone left offset
//   --ft-player-w        player zone width
//   --ft-nav-x           nav zone left offset
//   --ft-nav-w           nav zone width
//   --ft-logo-x          logo zone left offset
//   --ft-logo-w          logo zone width
//   --ft-profile         active profile name
//   --ft-vol-visible     1 or 0 (volume bar visibility)
//   --ft-stacked         1 or 0 (stacked vs horizontal)
//
// DIAGNOSTIC:
//   window.footerQT.diagnose() — dumps current state
//
// ============================================================================

export class FooterQuadTree {
  constructor() {
    this.config = null;
    this.footerEl = null;
    this.footerBar = null;
    this._ready = false;
    this._profile = null;
    this._zones = null;
  }

  // ── Init ───────────────────────────────────────────────────────
  async init() {
    try {
      const res = await fetch('/config/data/footer.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`footer.json: ${res.status}`);
      this.config = await res.json();

      this.footerEl  = document.getElementById('artistControls');
      this.footerBar = this.footerEl?.querySelector('.footer-bar');

      if (!this.footerBar) {
        console.warn('⚠️ FooterQuadTree: .footer-bar not found in DOM');
        return;
      }

      this._ready = true;
      console.log('✅ FooterQuadTree initialized (RODUX pipeline)');
    } catch (err) {
      console.error('❌ FooterQuadTree init failed:', err);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 1: STATE — Read viewport from StateJS or measure directly
  // ══════════════════════════════════════════════════════════════

  _readState() {
    const IS = window.Interstellar;
    if (IS?.state?.viewport) {
      const vp = IS.state.viewport;
      return {
        vw: vp.width  || window.innerWidth,
        vh: vp.height || window.innerHeight,
        orientation: vp.orientation || this._detectOrientation(),
        dpr: vp.dpr || window.devicePixelRatio || 1,
      };
    }
    return {
      vw: window.innerWidth,
      vh: window.innerHeight,
      orientation: this._detectOrientation(),
      dpr: window.devicePixelRatio || 1,
    };
  }

  _detectOrientation() {
    return (window.innerWidth >= window.innerHeight) ? 'landscape' : 'portrait';
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 2: PROFILE SELECTION — from cssJSON config thresholds
  //
  // Profiles are ordered by maxWidth ascending in the config.
  // First matching profile wins. No CSS media queries involved.
  // ══════════════════════════════════════════════════════════════

  _selectProfile(state) {
    const profiles = this.config.profiles;
    if (!profiles) return this._legacyProfile(state);

    for (const profile of profiles) {
      const minOk = (profile.minWidth === undefined) || (state.vw >= profile.minWidth);
      const maxOk = (profile.maxWidth === undefined) || (state.vw <= profile.maxWidth);
      const oriOk = (!profile.orientation) || (state.orientation === profile.orientation);

      if (minOk && maxOk && oriOk) {
        return profile;
      }
    }

    return profiles[profiles.length - 1] || this._legacyProfile(state);
  }

  // Backward compat: if config uses old height/mobile keys
  _legacyProfile(state) {
    const cfg = this.config;
    const isStacked = state.vw <= (cfg.mobile?.stackBreakpoint ?? 767);
    const bp = isStacked ? 'mobile' : (state.vw <= 1023 ? 'tablet' : 'desktop');

    return {
      name: bp,
      stacked: isStacked,
      height: cfg.height?.[bp] ?? 75,
      volumeVisible: (bp === 'desktop'),
      zones: cfg.zones || {},
    };
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 3: RATIO ENGINE — compute zone widths mathematically
  //
  // Fixed zones (nav, logo) get measured or config-defined widths.
  // Greedy zone (player) gets the remainder.
  // All values are integers (floor). No subpixel.
  // ══════════════════════════════════════════════════════════════

  _computeZones(profile, state) {
    const zones = profile.zones || this.config.zones || {};
    const vw = state.vw;

    // If stacked, every zone is full width
    if (profile.stacked) {
      return {
        player: { x: 0, w: vw, order: profile.order?.player ?? 1 },
        nav:    { x: 0, w: vw, order: profile.order?.nav    ?? 2 },
        logo:   { x: 0, w: vw, order: profile.order?.logo   ?? 3 },
        stacked: true,
      };
    }

    // ── Fixed zones: measure natural content width ─────────
    const navEl  = this.footerBar.querySelector('.footer-nav-zone');
    const logoEl = this.footerBar.querySelector('.footer-logo');

    // Temporarily clear width constraints to measure natural size
    const navPrev  = navEl?.style.getPropertyValue('width')  || '';
    const logoPrev = logoEl?.style.getPropertyValue('width') || '';
    if (navEl)  navEl.style.width  = 'auto';
    if (logoEl) logoEl.style.width = 'auto';

    // Force reflow to get accurate measurement
    const navW  = navEl  ? navEl.scrollWidth  : 0;
    const logoW = logoEl ? logoEl.scrollWidth : 0;

    // Restore (will be overwritten by final values below)
    if (navEl)  navEl.style.width  = navPrev;
    if (logoEl) logoEl.style.width = logoPrev;

    // Apply constraints from config
    const navCfg  = zones.nav  || {};
    const logoCfg = zones.logo || {};

    const navMin  = navCfg.minPx  ?? 0;
    const navMax  = navCfg.maxPx  ?? Infinity;
    const logoMin = logoCfg.minPx ?? 0;
    const logoMax = logoCfg.maxPx ?? Infinity;

    const finalNavW  = Math.floor(Math.min(navMax,  Math.max(navMin,  navW)));
    const finalLogoW = Math.floor(Math.min(logoMax, Math.max(logoMin, logoW)));

    // ── Greedy zone: player gets remainder ─────────────────
    const playerCfg = zones.player || {};
    const playerMin = playerCfg.minPx ?? 200;
    const available = vw - finalNavW - finalLogoW;
    const finalPlayerW = Math.max(playerMin, Math.floor(available));

    // ── QuadTree allocation: left-to-right strip packing ───
    const playerX = 0;
    const navX    = finalPlayerW;
    const logoX   = finalPlayerW + finalNavW;

    return {
      player: { x: playerX, w: finalPlayerW, order: 1 },
      nav:    { x: navX,    w: finalNavW,    order: 2 },
      logo:   { x: logoX,   w: finalLogoW,  order: 3 },
      stacked: false,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 4: WRITE — set CSS vars on DOM elements
  //
  // All layout is expressed as CSS custom properties.
  // CSS rules are var() consumers only. No flex, no grid from CSS.
  // ══════════════════════════════════════════════════════════════

  _writeVars(zones, profile, state) {
    const bar = this.footerBar;
    const el  = this.footerEl;

    // ── Footer height ─────────────────────────────────────────
    const rawH = profile.height ?? 75;
    const hVal = (rawH === 'auto') ? 'auto' : `${rawH}px`;
    bar.style.setProperty('--ft-height', hVal);
    bar.style.setProperty('--footer-height', hVal);

    // ── Zone dimensions ───────────────────────────────────────
    bar.style.setProperty('--ft-player-x', `${zones.player.x}px`);
    bar.style.setProperty('--ft-player-w', `${zones.player.w}px`);
    bar.style.setProperty('--ft-nav-x',    `${zones.nav.x}px`);
    bar.style.setProperty('--ft-nav-w',    `${zones.nav.w}px`);
    bar.style.setProperty('--ft-logo-x',   `${zones.logo.x}px`);
    bar.style.setProperty('--ft-logo-w',   `${zones.logo.w}px`);

    // ── Profile metadata ──────────────────────────────────────
    const profileName = profile.name || 'default';
    bar.style.setProperty('--ft-profile', profileName);
    bar.style.setProperty('--ft-stacked', zones.stacked ? '1' : '0');
    el.dataset.ftProfile = profileName;

    // ── Volume visibility ─────────────────────────────────────
    const volVisible = profile.volumeVisible ?? true;
    bar.style.setProperty('--ft-vol-visible', volVisible ? '1' : '0');

    // ── Apply zone widths directly to DOM elements ────────────
    // This is the QuadTree output — pixel-precise, no flex.
    const playerZone = bar.querySelector('.footer-player-zone');
    const navZone    = bar.querySelector('.footer-nav-zone');
    const logoZone   = bar.querySelector('.footer-logo');

    if (zones.stacked) {
      if (playerZone) {
        playerZone.style.width = '100%';
        playerZone.style.order = zones.player.order;
      }
      if (navZone) {
        navZone.style.width = '100%';
        navZone.style.order = zones.nav.order;
        navZone.style.borderLeft = 'none';
      }
      if (logoZone) {
        logoZone.style.width = '100%';
        logoZone.style.order = zones.logo.order;
        logoZone.style.borderLeft = 'none';
      }
    } else {
      if (playerZone) {
        playerZone.style.width = `${zones.player.w}px`;
        playerZone.style.order = '';
      }
      if (navZone) {
        navZone.style.width = `${zones.nav.w}px`;
        navZone.style.order = '';
      }
      if (logoZone) {
        logoZone.style.width = `${zones.logo.w}px`;
        logoZone.style.order = '';
      }
    }

    // ── Per-profile CSS var overrides from config ─────────────
    if (profile.vars) {
      for (const [varName, value] of Object.entries(profile.vars)) {
        bar.style.setProperty(varName, value);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // MAIN ENTRY: layout()
  //
  // Called on every render() tick from roderick.js.
  // Runs the full RODUX pipeline: State → Profile → Ratios → Write
  // ══════════════════════════════════════════════════════════════

  layout() {
    if (!this._ready || !this.config) return;

    const state = this._readState();
    const profile = this._selectProfile(state);
    this._profile = profile;

    const zones = this._computeZones(profile, state);
    this._zones = zones;

    this._writeVars(zones, profile, state);
  }

  // ══════════════════════════════════════════════════════════════
  // DIAGNOSTIC
  // ══════════════════════════════════════════════════════════════

  diagnose() {
    if (!this._ready) return { status: 'not ready' };

    const state = this._readState();
    return {
      status: 'ok',
      state,
      profile: this._profile?.name || 'none',
      stacked: this._zones?.stacked ?? null,
      zones: this._zones ? {
        player: `x:${this._zones.player.x} w:${this._zones.player.w}`,
        nav:    `x:${this._zones.nav.x} w:${this._zones.nav.w}`,
        logo:   `x:${this._zones.logo.x} w:${this._zones.logo.w}`,
      } : null,
      volumeVisible: this._profile?.volumeVisible ?? null,
      configVersion: this.config?._version || 'unknown',
    };
  }
}