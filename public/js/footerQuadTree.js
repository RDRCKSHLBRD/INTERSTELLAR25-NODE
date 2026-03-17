// ============================================================================
// public/js/footerQuadTree.js — V6.3.1 (RODUX Stack)
//
// QuadTree-driven footer layout engine.
// Full RODUX pipeline: StateJS → RatioEngine → cssJSON → QuadTree → CSS vars.
//
// DEVICE DETECTION:
//   Distinguishes touch devices from desktop browsers resized small.
//   Uses navigator.maxTouchPoints + pointer:coarse media query.
//   A desktop at 375px gets 'narrow' profile (horizontal, all controls).
//   An iPhone at 375px gets 'compact-portrait' profile (stacked, wireframe layout).
//   DevTools device emulation triggers touch detection correctly.
//
// PROFILE MATCHING:
//   Profiles can require { device: "touch" } or { device: "pointer" }.
//   Profiles without a device field match any device.
//   First matching profile wins (walk array top to bottom).
//
// LAYOUT MODES:
//   "stacked"    — portrait phone. All zones full width, vertical stack.
//   "two-tier"   — landscape phone / tablet. CSS grid: title row, then
//                   transport+nav side-by-side, logo right-aligned.
//   "horizontal" — desktop. Single strip: player | nav | logo.
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
    this._device = null;
  }

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

      // Detect device class once on init (doesn't change mid-session)
      this._device = this._detectDevice();

      this._ready = true;
      console.log(`✅ FooterQuadTree initialized (device: ${this._device})`);
    } catch (err) {
      console.error('❌ FooterQuadTree init failed:', err);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // DEVICE DETECTION
  // ══════════════════════════════════════════════════════════════

  _detectDevice() {
    const hasTouch = navigator.maxTouchPoints > 0;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

    if (hasTouch && hasCoarsePointer) return 'touch';
    if (hasTouch) return 'touch';
    return 'pointer';
  }

  // ══════════════════════════════════════════════════════════════
  // STATE — Read viewport from StateJS or measure directly
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
        device: this._device,
      };
    }
    if (IS?.state?.calculate) {
      const calc = IS.state.calculate({
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1,
      });
      return {
        vw: calc.width,
        vh: calc.height,
        orientation: calc.orientation,
        dpr: calc.pixelRatio || 1,
        device: this._device,
      };
    }
    return {
      vw: window.innerWidth,
      vh: window.innerHeight,
      orientation: this._detectOrientation(),
      dpr: window.devicePixelRatio || 1,
      device: this._device,
    };
  }

  _detectOrientation() {
    return (window.innerWidth >= window.innerHeight) ? 'landscape' : 'portrait';
  }

  // ══════════════════════════════════════════════════════════════
  // PROFILE SELECTION
  // ══════════════════════════════════════════════════════════════

  _selectProfile(state) {
    const profiles = this.config.profiles;
    if (!profiles) return this._legacyProfile(state);

    for (const profile of profiles) {
      if (profile.device && profile.device !== state.device) continue;
      if (profile.orientation && profile.orientation !== state.orientation) continue;

      const minOk = (profile.minWidth === undefined) || (state.vw >= profile.minWidth);
      const maxOk = (profile.maxWidth === undefined) || (state.vw <= profile.maxWidth);

      if (minOk && maxOk) return profile;
    }

    return profiles[profiles.length - 1] || this._legacyProfile(state);
  }

  _legacyProfile(state) {
    const cfg = this.config;
    const isStacked = state.vw <= (cfg.mobile?.stackBreakpoint ?? 767);
    const bp = isStacked ? 'mobile' : (state.vw <= 1023 ? 'tablet' : 'desktop');
    return {
      name: bp,
      stacked: isStacked,
      layout: isStacked ? 'stacked' : 'horizontal',
      height: cfg.height?.[bp] ?? 75,
      volumeVisible: (bp === 'desktop'),
      zones: cfg.zones || {},
    };
  }

  // ══════════════════════════════════════════════════════════════
  // RATIO ENGINE — compute zone widths
  //
  // Three layout modes:
  //   stacked:    all zones 100% width, ordered vertically
  //   two-tier:   all zones 100% width, CSS grid handles positioning
  //   horizontal: player gets remaining space after nav + logo measured
  // ══════════════════════════════════════════════════════════════

  _computeZones(profile, state) {
    const zones = profile.zones || this.config.zones || {};
    const vw = state.vw;
    const layoutMode = profile.layout || (profile.stacked ? 'stacked' : 'horizontal');

    // ── Stacked (portrait phone) ───────────────────────────────
    if (layoutMode === 'stacked') {
      return {
        player: { x: 0, w: vw, order: profile.order?.player ?? 1 },
        nav:    { x: 0, w: vw, order: profile.order?.nav    ?? 2 },
        logo:   { x: 0, w: vw, order: profile.order?.logo   ?? 3 },
        stacked: true,
        twoTier: false,
        layoutMode: 'stacked',
      };
    }

    // ── Two-tier (landscape phone / tablet) ────────────────────
    // CSS grid handles the actual 2-tier positioning.
    // We set all zones to full width; grid-template-areas in
    // player.css does the row/column assignment.
    if (layoutMode === 'two-tier') {
      return {
        player: { x: 0, w: vw, order: profile.order?.player ?? 1 },
        nav:    { x: 0, w: vw, order: profile.order?.nav    ?? 2 },
        logo:   { x: 0, w: vw, order: profile.order?.logo   ?? 3 },
        stacked: false,
        twoTier: true,
        layoutMode: 'two-tier',
      };
    }

    // ── Horizontal (desktop / touch-wide) ──────────────────────
    const navEl  = this.footerBar.querySelector('.footer-nav-zone');
    const logoEl = this.footerBar.querySelector('.footer-logo');

    const navPrev  = navEl?.style.getPropertyValue('width')  || '';
    const logoPrev = logoEl?.style.getPropertyValue('width') || '';
    if (navEl)  navEl.style.width  = 'auto';
    if (logoEl) logoEl.style.width = 'auto';

    const navW  = navEl  ? navEl.scrollWidth  : 0;
    const logoW = logoEl ? logoEl.scrollWidth : 0;

    if (navEl)  navEl.style.width  = navPrev;
    if (logoEl) logoEl.style.width = logoPrev;

    const navCfg  = zones.nav  || {};
    const logoCfg = zones.logo || {};
    const finalNavW  = Math.floor(Math.min(navCfg.maxPx  ?? Infinity, Math.max(navCfg.minPx  ?? 0, navW)));
    const finalLogoW = Math.floor(Math.min(logoCfg.maxPx ?? Infinity, Math.max(logoCfg.minPx ?? 0, logoW)));

    const playerCfg = zones.player || {};
    const available = vw - finalNavW - finalLogoW;
    const finalPlayerW = Math.max(playerCfg.minPx ?? 200, Math.floor(available));

    const playerX = 0;
    const navX    = finalPlayerW;
    const logoX   = finalPlayerW + finalNavW;

    return {
      player: { x: playerX, w: finalPlayerW, order: 1 },
      nav:    { x: navX,    w: finalNavW,    order: 2 },
      logo:   { x: logoX,   w: finalLogoW,  order: 3 },
      stacked: false,
      twoTier: false,
      layoutMode: 'horizontal',
    };
  }

  // ══════════════════════════════════════════════════════════════
  // WRITE — CSS vars + inline styles on DOM
  // ══════════════════════════════════════════════════════════════

  _writeVars(zones, profile, state) {
    const bar = this.footerBar;
    const el  = this.footerEl;

    // Height
    const rawH = profile.height ?? 75;
    const hVal = (rawH === 'auto') ? 'auto' : `${rawH}px`;
    bar.style.setProperty('--ft-height', hVal);
    bar.style.setProperty('--footer-height', hVal);

    // Zone vars
    bar.style.setProperty('--ft-player-x', `${zones.player.x}px`);
    bar.style.setProperty('--ft-player-w', `${zones.player.w}px`);
    bar.style.setProperty('--ft-nav-x',    `${zones.nav.x}px`);
    bar.style.setProperty('--ft-nav-w',    `${zones.nav.w}px`);
    bar.style.setProperty('--ft-logo-x',   `${zones.logo.x}px`);
    bar.style.setProperty('--ft-logo-w',   `${zones.logo.w}px`);

    // Profile metadata
    // For two-tier, we set data-ft-profile to "two-tier" so CSS
    // grid rules activate, regardless of the profile's name field.
    const profileAttr = zones.twoTier ? 'two-tier' : (profile.name || 'default');
    bar.style.setProperty('--ft-profile', profileAttr);
    bar.style.setProperty('--ft-stacked', zones.stacked ? '1' : '0');
    el.dataset.ftProfile = profileAttr;
    el.dataset.ftDevice  = state.device;

    // Volume
    const volVisible = profile.volumeVisible ?? true;
    bar.style.setProperty('--ft-vol-visible', volVisible ? '1' : '0');

    // Apply zone widths to DOM
    const playerZone = bar.querySelector('.footer-player-zone');
    const navZone    = bar.querySelector('.footer-nav-zone');
    const logoZone   = bar.querySelector('.footer-logo');

    if (zones.stacked) {
      // Stacked: all zones full-width, ordered
      if (playerZone) { playerZone.style.width = '100%'; playerZone.style.order = zones.player.order; }
      if (navZone)    { navZone.style.width = '100%'; navZone.style.order = zones.nav.order; navZone.style.borderLeft = 'none'; }
      if (logoZone)   { logoZone.style.width = '100%'; logoZone.style.order = zones.logo.order; logoZone.style.borderLeft = 'none'; }
    } else if (zones.twoTier) {
      // Two-tier: CSS grid handles layout. Clear any stale inline widths.
      // Zone elements participate in grid areas defined by player.css.
      if (playerZone) { playerZone.style.width = ''; playerZone.style.order = ''; }
      if (navZone)    { navZone.style.width = ''; navZone.style.order = ''; navZone.style.borderLeft = ''; }
      if (logoZone)   { logoZone.style.width = ''; logoZone.style.order = ''; logoZone.style.borderLeft = ''; }
    } else {
      // Horizontal: explicit pixel widths
      if (playerZone) { playerZone.style.width = `${zones.player.w}px`; playerZone.style.order = ''; }
      if (navZone)    { navZone.style.width = `${zones.nav.w}px`; navZone.style.order = ''; }
      if (logoZone)   { logoZone.style.width = `${zones.logo.w}px`; logoZone.style.order = ''; }
    }

    // Per-profile CSS var overrides
    if (profile.vars) {
      for (const [varName, value] of Object.entries(profile.vars)) {
        bar.style.setProperty(varName, value);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // MAIN ENTRY
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
      device: this._device,
      profile: this._profile?.name || 'none',
      layoutMode: this._zones?.layoutMode || 'unknown',
      stacked: this._zones?.stacked ?? null,
      twoTier: this._zones?.twoTier ?? null,
      zones: this._zones ? {
        player: `x:${this._zones.player.x} w:${this._zones.player.w}`,
        nav:    `x:${this._zones.nav.x} w:${this._zones.nav.w}`,
        logo:   `x:${this._zones.logo.x} w:${this._zones.logo.w}`,
      } : null,
      volumeVisible: this._profile?.volumeVisible ?? null,
    };
  }
}