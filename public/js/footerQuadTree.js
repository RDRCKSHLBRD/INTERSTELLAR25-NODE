// ============================================================================
// public/js/footerQuadTree.js — V6.3 (RODUX Stack)
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
  //
  // Separates "this is a phone/tablet" from "this is a desktop
  // browser dragged small". Runs once on init.
  //
  // touch:   real phones/tablets (maxTouchPoints > 0 AND coarse pointer)
  // pointer: desktop/laptop (mouse, trackpad)
  //
  // DevTools device toolbar sets maxTouchPoints correctly when
  // you pick a device preset, so emulation works.
  // ══════════════════════════════════════════════════════════════

  _detectDevice() {
    const hasTouch = navigator.maxTouchPoints > 0;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

    // Both conditions: real touch device
    // Touch but fine pointer: stylus/convertible — treat as touch
    // No touch: desktop
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
    // If StateJS has a calculate() method but no cached viewport, call it
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
  //
  // Walks profiles array. Each profile can optionally require:
  //   device: "touch" | "pointer"    (skip if mismatch)
  //   orientation: "portrait" | "landscape"
  //   minWidth / maxWidth
  //
  // Desktop at 400px: device=pointer → skips touch-only profiles,
  //   matches a pointer-compatible narrow profile instead.
  // iPhone at 400px: device=touch → matches compact-portrait.
  // ══════════════════════════════════════════════════════════════

  _selectProfile(state) {
    const profiles = this.config.profiles;
    if (!profiles) return this._legacyProfile(state);

    for (const profile of profiles) {
      // Device filter
      if (profile.device && profile.device !== state.device) continue;

      // Orientation filter
      if (profile.orientation && profile.orientation !== state.orientation) continue;

      // Width filters
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
      height: cfg.height?.[bp] ?? 75,
      volumeVisible: (bp === 'desktop'),
      zones: cfg.zones || {},
    };
  }

  // ══════════════════════════════════════════════════════════════
  // RATIO ENGINE — compute zone widths
  // ══════════════════════════════════════════════════════════════

  _computeZones(profile, state) {
    const zones = profile.zones || this.config.zones || {};
    const vw = state.vw;

    if (profile.stacked) {
      return {
        player: { x: 0, w: vw, order: profile.order?.player ?? 1 },
        nav:    { x: 0, w: vw, order: profile.order?.nav    ?? 2 },
        logo:   { x: 0, w: vw, order: profile.order?.logo   ?? 3 },
        stacked: true,
      };
    }

    // Measure fixed zones at natural width
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
    const profileName = profile.name || 'default';
    bar.style.setProperty('--ft-profile', profileName);
    bar.style.setProperty('--ft-stacked', zones.stacked ? '1' : '0');
    el.dataset.ftProfile = profileName;
    el.dataset.ftDevice  = state.device;

    // Volume
    const volVisible = profile.volumeVisible ?? true;
    bar.style.setProperty('--ft-vol-visible', volVisible ? '1' : '0');

    // Apply zone widths to DOM
    const playerZone = bar.querySelector('.footer-player-zone');
    const navZone    = bar.querySelector('.footer-nav-zone');
    const logoZone   = bar.querySelector('.footer-logo');

    if (zones.stacked) {
      if (playerZone) { playerZone.style.width = '100%'; playerZone.style.order = zones.player.order; }
      if (navZone)    { navZone.style.width = '100%'; navZone.style.order = zones.nav.order; navZone.style.borderLeft = 'none'; }
      if (logoZone)   { logoZone.style.width = '100%'; logoZone.style.order = zones.logo.order; logoZone.style.borderLeft = 'none'; }
    } else {
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
      stacked: this._zones?.stacked ?? null,
      zones: this._zones ? {
        player: `x:${this._zones.player.x} w:${this._zones.player.w}`,
        nav:    `x:${this._zones.nav.x} w:${this._zones.nav.w}`,
        logo:   `x:${this._zones.logo.x} w:${this._zones.logo.w}`,
      } : null,
      volumeVisible: this._profile?.volumeVisible ?? null,
    };
  }
}