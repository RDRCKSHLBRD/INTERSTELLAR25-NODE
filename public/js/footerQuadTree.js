// ============================================================================
// public/js/footerQuadTree.js — V6.4.0 (RODUX Stack)
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
// LAYOUT MODES (mathematical, not CSS):
//
//   "stacked"    — portrait phone. All zones full width, vertical stack.
//                  CSS flex-wrap renders the rows (acceptable: stacked is
//                  simple, content-height unknown at measure time).
//
//   "two-tier"   — landscape phone / tablet. QuadTree computes 3 rows,
//                  ALL positions as absolute px:
//
//                  Row 1 (title + seek + time):
//                    timeW    = measure(.player-time).w
//                    seekW    = clamp(seekMin, availW - titleMin - timeW - gaps, seekMax)
//                    titleW   = vw - seekW - timeW - hPad*2 - gaps
//                    row1H    = rowPad*2 + contentH
//
//                  Row 2 (transport left | nav right, gap between):
//                    transportW = measure(.player-transport).w
//                    navW       = measure(.footer-nav-zone).w
//                    (gap fills space between them)
//                    row2H    = rowPad*2 + max(btnSize, navH)
//
//                  Row 3 (logo right-aligned):
//                    logoW    = measure(.footer-logo).w
//                    logoX    = vw - logoW
//                    row3H    = rowPad*2 + logoH
//
//                  .footer-bar: position:relative, height = sum of rows
//                  All row containers: position:absolute, top/left/width/height set by JS
//                  CSS IS A DUMB RENDERER. No flex-wrap, no margin:auto.
//
//   "horizontal" — desktop. Single strip: player | nav | logo.
//                  QuadTree measures nav + logo, assigns remainder to player.
//                  Horizontal layout uses position:absolute zones too.
//
// V6.4.0: two-tier rebuilt as full inner calc engine (absolute positioning).
//         stacked unchanged. horizontal converted to absolute zones.
// ============================================================================

export class FooterQuadTree {
  constructor() {
    this.config     = null;
    this.footerEl   = null;
    this.footerBar  = null;
    this._ready     = false;
    this._profile   = null;
    this._zones     = null;
    this._device    = null;
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

      this._device = this._detectDevice();
      this._ready  = true;
      console.log(`✅ FooterQuadTree V6.4.0 initialized (device: ${this._device})`);
    } catch (err) {
      console.error('❌ FooterQuadTree init failed:', err);
    }
  }


  // ══════════════════════════════════════════════════════════════
  // DEVICE DETECTION
  // ══════════════════════════════════════════════════════════════

  _detectDevice() {
    const hasTouch       = navigator.maxTouchPoints > 0;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (hasTouch && hasCoarsePointer) return 'touch';
    if (hasTouch) return 'touch';
    return 'pointer';
  }


  // ══════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════

  _readState() {
    const IS = window.Interstellar;
    if (IS?.state?.viewport) {
      const vp = IS.state.viewport;
      return {
        vw:          vp.width       || window.innerWidth,
        vh:          vp.height      || window.innerHeight,
        orientation: vp.orientation || this._detectOrientation(),
        dpr:         vp.dpr         || window.devicePixelRatio || 1,
        device:      this._device,
      };
    }
    if (IS?.state?.calculate) {
      const calc = IS.state.calculate({
        width:  window.innerWidth,
        height: window.innerHeight,
        dpr:    window.devicePixelRatio || 1,
      });
      return {
        vw:          calc.width,
        vh:          calc.height,
        orientation: calc.orientation,
        dpr:         calc.pixelRatio || 1,
        device:      this._device,
      };
    }
    return {
      vw:          window.innerWidth,
      vh:          window.innerHeight,
      orientation: this._detectOrientation(),
      dpr:         window.devicePixelRatio || 1,
      device:      this._device,
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
      if (profile.device      && profile.device      !== state.device)      continue;
      if (profile.orientation && profile.orientation !== state.orientation) continue;
      const minOk = (profile.minWidth === undefined) || (state.vw >= profile.minWidth);
      const maxOk = (profile.maxWidth === undefined) || (state.vw <= profile.maxWidth);
      if (minOk && maxOk) return profile;
    }

    return profiles[profiles.length - 1] || this._legacyProfile(state);
  }

  _legacyProfile(state) {
    const cfg      = this.config;
    const isStacked = state.vw <= (cfg.mobile?.stackBreakpoint ?? 767);
    const bp        = isStacked ? 'mobile' : (state.vw <= 1023 ? 'tablet' : 'desktop');
    return {
      name:          bp,
      stacked:       isStacked,
      layout:        isStacked ? 'stacked' : 'horizontal',
      height:        cfg.height?.[bp] ?? 75,
      volumeVisible: (bp === 'desktop'),
      zones:         cfg.zones || {},
    };
  }


  // ══════════════════════════════════════════════════════════════
  // MEASURE — natural dimensions of a DOM element
  //
  // Temporarily removes width/height constraints, reads
  // scrollWidth/scrollHeight, restores original values.
  // Standard QuadTree measurement pass.
  // ══════════════════════════════════════════════════════════════

  _measure(el) {
    if (!el) return { w: 0, h: 0 };

    // Stash current inline constraints
    const prevW    = el.style.width;
    const prevH    = el.style.height;
    const prevPos  = el.style.position;
    const prevVis  = el.style.visibility;
    const prevTop  = el.style.top;
    const prevLeft = el.style.left;

    // Measure freely
    el.style.width      = 'auto';
    el.style.height     = 'auto';
    el.style.position   = 'static';
    el.style.visibility = 'hidden';
    el.style.top        = '';
    el.style.left       = '';

    const w = el.scrollWidth;
    const h = el.scrollHeight;

    // Restore
    el.style.width      = prevW;
    el.style.height     = prevH;
    el.style.position   = prevPos;
    el.style.visibility = prevVis;
    el.style.top        = prevTop;
    el.style.left       = prevLeft;

    return { w, h };
  }


  // ══════════════════════════════════════════════════════════════
  // RATIO ENGINE — compute zone geometry (all mathematical)
  // ══════════════════════════════════════════════════════════════

  _computeZones(profile, state) {
    const zones    = profile.zones || this.config.zones || {};
    const vw       = state.vw;
    const layoutMode = profile.layout || (profile.stacked ? 'stacked' : 'horizontal');


    // ── Stacked (portrait phone) ─────────────────────────────
    if (layoutMode === 'stacked') {
      return {
        player:     { x: 0, w: vw, order: profile.order?.player ?? 1 },
        nav:        { x: 0, w: vw, order: profile.order?.nav    ?? 2 },
        logo:       { x: 0, w: vw, order: profile.order?.logo   ?? 3 },
        stacked:    true,
        twoTier:    false,
        layoutMode: 'stacked',
      };
    }


    // ── Two-tier (landscape phone / tablet) ──────────────────
    //
    // QuadTree measures every element. Computes 3 rows as
    // absolute-positioned blocks. No flex-wrap involved.
    //
    if (layoutMode === 'two-tier') {
      const bar = this.footerBar;

      // ── Elements ────────────────────────────────────────────
      const titleEl     = bar.querySelector('.player-title');
      const seekEl      = bar.querySelector('.player-seek');
      const timeEl      = bar.querySelector('.player-time');
      const transportEl = bar.querySelector('.player-transport');
      const navEl       = bar.querySelector('.footer-nav-zone');
      const logoEl      = bar.querySelector('.footer-logo');

      // ── Measure all natural sizes ────────────────────────────
      const timeSize      = this._measure(timeEl);
      const transportSize = this._measure(transportEl);
      const navSize       = this._measure(navEl);
      const logoSize      = this._measure(logoEl);

      // ── Profile var overrides (applied before clamp reads) ───
      // Read CSS-var-driven button size for row height calc
      const btnSizePx = parseInt(
        getComputedStyle(bar).getPropertyValue('--player-btn-size') || '30'
      ) || 30;

      // ── Row padding (consistent vertical rhythm) ─────────────
      const rowPadV = 5;   // px top + bottom per row
      const hPad    = 14;  // px horizontal padding on player zone

      // ── Zone constraints from config ─────────────────────────
      const navCfg   = zones.nav   || {};
      const logoCfg  = zones.logo  || {};

      // ── ROW 1: title | seek | time (full viewport width) ─────
      //
      // timeW is fixed (monospace, known content)
      // seekW clamps to [seekMin, seekMax] from profile vars
      // titleW gets the remainder
      //
      const seekMinW = parseInt(
        getComputedStyle(bar).getPropertyValue('--seek-min-w') || '100'
      ) || 100;
      const seekMaxW = parseInt(
        getComputedStyle(bar).getPropertyValue('--seek-max-w') || '9999'
      ) || 9999;

      const gapRow1    = 8;   // gap between title, seek, time
      const timeW      = Math.ceil(timeSize.w) || 70;
      const titleMinW  = 60;
      const availRow1  = vw - hPad * 2 - gapRow1 * 2 - timeW;
      const seekW      = Math.floor(Math.min(seekMaxW, Math.max(seekMinW, availRow1 * 0.45)));
      const titleW     = Math.max(titleMinW, availRow1 - seekW);
      const row1H      = rowPadV * 2 + Math.max(timeSize.h || 20, 20);

      // Row 1 inner positions (relative to player-zone left edge after hPad)
      const titleX = hPad;
      const seekX  = titleX + titleW + gapRow1;
      const timeX  = seekX  + seekW  + gapRow1;

      // ── ROW 2: transport (left) | gap | nav (right) ──────────
      //
      // Transport is measured at natural width (left-anchored)
      // Nav is measured at natural width (right-anchored)
      // Gap fills the space between them — QuadTree asserts this,
      // no CSS involvement.
      //
      const navW       = Math.floor(
        Math.min(navCfg.maxPx ?? Infinity, Math.max(navCfg.minPx ?? 0, navSize.w))
      );
      const transportW = Math.ceil(transportSize.w) || btnSizePx * 7;
      const navX       = vw - navW;
      const row2H      = rowPadV * 2 + Math.max(btnSizePx, navSize.h || btnSizePx);

      // ── ROW 3: logo right-aligned ────────────────────────────
      const logoW  = Math.floor(
        Math.min(logoCfg.maxPx ?? Infinity, Math.max(logoCfg.minPx ?? 0, logoSize.w))
      );
      const logoX  = vw - logoW;
      const row3H  = rowPadV * 2 + (logoSize.h || 28);

      // ── Row Y positions ──────────────────────────────────────
      const row1Y = 0;
      const row2Y = row1H;
      const row3Y = row1H + row2H;
      const totalH = row1H + row2H + row3H;

      return {
        // Zone objects (used by _writeVars for data-ft-* attrs)
        player:    { x: 0,    w: vw   },
        nav:       { x: navX, w: navW },
        logo:      { x: logoX, w: logoW },
        transport: { x: hPad,  w: transportW },

        // Full inner calc — all px, all absolute
        rows: {
          row1: { y: row1Y, h: row1H },
          row2: { y: row2Y, h: row2H },
          row3: { y: row3Y, h: row3H },
        },
        inner: {
          // Row 1 elements (absolute within row1 container)
          titleX, titleW,
          seekX,  seekW,
          timeX,  timeW,
          hPad,
          // Row 2 elements
          transportX: hPad,
          transportW,
          navX, navW,
          rowPadV,
          // Row 3 elements
          logoX, logoW,
        },
        totalH,
        stacked:    false,
        twoTier:    true,
        layoutMode: 'two-tier',
      };
    }


    // ── Horizontal (desktop / touch-wide) ────────────────────
    const navEl  = this.footerBar.querySelector('.footer-nav-zone');
    const logoEl = this.footerBar.querySelector('.footer-logo');

    const navSize  = this._measure(navEl);
    const logoSize = this._measure(logoEl);

    const navCfg  = zones.nav  || {};
    const logoCfg = zones.logo || {};

    const finalNavW  = Math.floor(Math.min(navCfg.maxPx  ?? Infinity, Math.max(navCfg.minPx  ?? 0, navSize.w)));
    const finalLogoW = Math.floor(Math.min(logoCfg.maxPx ?? Infinity, Math.max(logoCfg.minPx ?? 0, logoSize.w)));

    const playerCfg   = zones.player || {};
    const available   = vw - finalNavW - finalLogoW;
    const finalPlayerW = Math.max(playerCfg.minPx ?? 200, Math.floor(available));

    const height = (profile.height && profile.height !== 'auto') ? profile.height : 75;

    return {
      player: { x: 0,                         w: finalPlayerW },
      nav:    { x: finalPlayerW,               w: finalNavW    },
      logo:   { x: finalPlayerW + finalNavW,   w: finalLogoW   },
      height,
      stacked:    false,
      twoTier:    false,
      layoutMode: 'horizontal',
    };
  }


  // ══════════════════════════════════════════════════════════════
  // WRITE — CSS vars + inline styles on DOM
  //
  // This is the ONLY place JS touches the DOM for layout.
  // CSS consumes these values. That is the RODUX contract.
  // ══════════════════════════════════════════════════════════════

  _writeVars(zones, profile, state) {
    const bar = this.footerBar;
    const el  = this.footerEl;

    // ── Profile metadata ──────────────────────────────────────
    const profileAttr = zones.twoTier ? 'two-tier' : (profile.name || 'default');
    bar.style.setProperty('--ft-profile', profileAttr);
    bar.style.setProperty('--ft-stacked', zones.stacked ? '1' : '0');
    el.dataset.ftProfile = profileAttr;
    el.dataset.ftDevice  = state.device;

    // ── Volume visibility ─────────────────────────────────────
    bar.style.setProperty('--ft-vol-visible', (profile.volumeVisible ?? true) ? '1' : '0');

    // ── Per-profile CSS var overrides ─────────────────────────
    // Applied early so measurement reads above reflect profile fonts/sizes
    if (profile.vars) {
      for (const [varName, value] of Object.entries(profile.vars)) {
        bar.style.setProperty(varName, value);
      }
    }

    // ── Zone position vars (for diagnostic + legacy compat) ───
    bar.style.setProperty('--ft-player-x', `${zones.player.x}px`);
    bar.style.setProperty('--ft-player-w', `${zones.player.w}px`);
    bar.style.setProperty('--ft-nav-x',    `${zones.nav.x}px`);
    bar.style.setProperty('--ft-nav-w',    `${zones.nav.w}px`);
    bar.style.setProperty('--ft-logo-x',   `${zones.logo.x}px`);
    bar.style.setProperty('--ft-logo-w',   `${zones.logo.w}px`);


    // ══════════════════════════════════════════════════════════
    // STACKED — portrait phone
    // ══════════════════════════════════════════════════════════
    if (zones.stacked) {
      const rawH = profile.height ?? 'auto';
      const hVal = (rawH === 'auto') ? 'auto' : `${rawH}px`;
      bar.style.setProperty('--ft-height', hVal);
      bar.style.setProperty('--footer-height', hVal);

      // Reset any two-tier absolute positioning from a previous render
      this._clearAbsoluteLayout();

      const playerZone = bar.querySelector('.footer-player-zone');
      const navZone    = bar.querySelector('.footer-nav-zone');
      const logoZone   = bar.querySelector('.footer-logo');

      if (playerZone) { playerZone.style.width = '100%'; playerZone.style.order = zones.player.order; }
      if (navZone)    { navZone.style.width = '100%'; navZone.style.order = zones.nav.order; navZone.style.borderLeft = 'none'; }
      if (logoZone)   { logoZone.style.width = '100%'; logoZone.style.order = zones.logo.order; logoZone.style.borderLeft = 'none'; }
      return;
    }


    // ══════════════════════════════════════════════════════════
    // TWO-TIER — landscape phone / tablet
    //
    // Three absolute-positioned row containers inside .footer-bar.
    // All math already done in _computeZones.
    // CSS: position:absolute, top/left/width/height from JS.
    // No flex-wrap. No margin:auto. QuadTree owns everything.
    // ══════════════════════════════════════════════════════════
    if (zones.twoTier) {
      const { rows, inner, totalH } = zones;

      // Set footer-bar to known height, position:relative
      bar.style.height   = `${totalH}px`;
      bar.style.position = 'relative';
      bar.style.setProperty('--ft-height',     `${totalH}px`);
      bar.style.setProperty('--footer-height', `${totalH}px`);

      // Expose row vars for CSS theming (borders, bg etc)
      bar.style.setProperty('--ft-row1-y', `${rows.row1.y}px`);
      bar.style.setProperty('--ft-row1-h', `${rows.row1.h}px`);
      bar.style.setProperty('--ft-row2-y', `${rows.row2.y}px`);
      bar.style.setProperty('--ft-row2-h', `${rows.row2.h}px`);
      bar.style.setProperty('--ft-row3-y', `${rows.row3.y}px`);
      bar.style.setProperty('--ft-row3-h', `${rows.row3.h}px`);
      bar.style.setProperty('--ft-transport-w', `${inner.transportW}px`);

      // ── Player zone (Row 1: title, seek, time) ────────────
      const playerZone = bar.querySelector('.footer-player-zone');
      if (playerZone) {
        playerZone.style.cssText = `
          position: absolute;
          top:    ${rows.row1.y}px;
          left:   0;
          width:  ${zones.player.w}px;
          height: ${rows.row1.h}px;
          padding: ${inner.rowPadV}px 0;
          box-sizing: border-box;
        `;

        // Inner elements: title, seek, time
        const titleEl = playerZone.querySelector('.player-title');
        const seekEl  = playerZone.querySelector('.player-seek');
        const timeEl  = playerZone.querySelector('.player-time');

        const innerTop = 0; // relative to playerZone (padding handles vertical)

        if (titleEl) {
          titleEl.style.cssText = `
            position: absolute;
            left:  ${inner.titleX}px;
            top:   50%;
            transform: translateY(-50%);
            width: ${inner.titleW}px;
            max-width: ${inner.titleW}px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          `;
        }
        if (seekEl) {
          seekEl.style.cssText = `
            position: absolute;
            left:  ${inner.seekX}px;
            top:   50%;
            transform: translateY(-50%);
            width: ${inner.seekW}px;
            flex: none;
          `;
        }
        if (timeEl) {
          timeEl.style.cssText = `
            position: absolute;
            left:  ${inner.timeX}px;
            top:   50%;
            transform: translateY(-50%);
            width: ${inner.timeW}px;
            text-align: right;
          `;
        }

        // Hide .player wrapper's own layout influence
        const playerInner = playerZone.querySelector('.player');
        if (playerInner) {
          playerInner.style.cssText = `
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            overflow: hidden;
          `;
        }

        // Hide player separator
        const sep = playerZone.querySelector('.player-separator');
        if (sep) sep.style.display = 'none';
      }

      // ── Transport (Row 2 left) ────────────────────────────
      const transportEl = bar.querySelector('.player-transport');
      if (transportEl) {
        transportEl.style.cssText = `
          position: absolute;
          top:    ${rows.row2.y + inner.rowPadV}px;
          left:   ${inner.transportX}px;
          width:  ${inner.transportW}px;
          height: ${rows.row2.h - inner.rowPadV * 2}px;
          display: flex;
          align-items: center;
          gap: var(--player-btn-gap, 4px);
          flex-shrink: 0;
        `;
      }

      // ── Nav zone (Row 2 right) ────────────────────────────
      const navZone = bar.querySelector('.footer-nav-zone');
      if (navZone) {
        navZone.style.cssText = `
          position: absolute;
          top:    ${rows.row2.y}px;
          left:   ${inner.navX}px;
          width:  ${inner.navW}px;
          height: ${rows.row2.h}px;
          display: flex;
          align-items: center;
          border-left: var(--footer-separator);
          border-top: var(--footer-separator);
          box-sizing: border-box;
          overflow: visible;
        `;
      }

      // ── Logo zone (Row 3 right) ───────────────────────────
      const logoZone = bar.querySelector('.footer-logo');
      if (logoZone) {
        logoZone.style.cssText = `
          position: absolute;
          top:    ${rows.row3.y}px;
          left:   ${inner.logoX}px;
          width:  ${inner.logoW}px;
          height: ${rows.row3.h}px;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          border-top: 1px solid rgba(43, 127, 140, 0.1);
          padding: var(--logo-padding);
          box-sizing: border-box;
        `;
      }

      // Volume hidden on touch
      const volEl = bar.querySelector('.player-volume');
      if (volEl) volEl.style.display = 'none';

      return;
    }


    // ══════════════════════════════════════════════════════════
    // HORIZONTAL — desktop
    //
    // Single strip. Three absolute-positioned zones.
    // ══════════════════════════════════════════════════════════
    const rawH = profile.height ?? 75;
    const hPx  = (rawH === 'auto') ? 75 : rawH;

    bar.style.height   = `${hPx}px`;
    bar.style.position = 'relative';
    bar.style.setProperty('--ft-height',     `${hPx}px`);
    bar.style.setProperty('--footer-height', `${hPx}px`);

    // Reset any two-tier layout from previous render
    this._clearAbsoluteLayout();

    const playerZone = bar.querySelector('.footer-player-zone');
    const navZone    = bar.querySelector('.footer-nav-zone');
    const logoZone   = bar.querySelector('.footer-logo');

    if (playerZone) {
      playerZone.style.cssText = `
        position: absolute;
        top: 0; left: ${zones.player.x}px;
        width: ${zones.player.w}px;
        height: ${hPx}px;
      `;
    }
    if (navZone) {
      navZone.style.cssText = `
        position: absolute;
        top: 0; left: ${zones.nav.x}px;
        width: ${zones.nav.w}px;
        height: ${hPx}px;
        border-left: var(--footer-separator);
      `;
    }
    if (logoZone) {
      logoZone.style.cssText = `
        position: absolute;
        top: 0; left: ${zones.logo.x}px;
        width: ${zones.logo.w}px;
        height: ${hPx}px;
        border-left: var(--footer-separator);
      `;
    }
  }


  // ══════════════════════════════════════════════════════════════
  // CLEAR — remove absolute two-tier positioning from a previous
  // render when switching to a different layout mode
  // ══════════════════════════════════════════════════════════════

  _clearAbsoluteLayout() {
    const bar = this.footerBar;
    if (!bar) return;

    const playerZone  = bar.querySelector('.footer-player-zone');
    const navZone     = bar.querySelector('.footer-nav-zone');
    const logoZone    = bar.querySelector('.footer-logo');
    const transportEl = bar.querySelector('.player-transport');
    const playerInner = bar.querySelector('.player');
    const titleEl     = bar.querySelector('.player-title');
    const seekEl      = bar.querySelector('.player-seek');
    const timeEl      = bar.querySelector('.player-time');
    const volEl       = bar.querySelector('.player-volume');

    [playerZone, navZone, logoZone, transportEl,
     playerInner, titleEl, seekEl, timeEl].forEach(el => {
      if (el) el.style.cssText = '';
    });

    if (volEl) volEl.style.display = '';

    bar.style.position = '';
    bar.style.height   = '';
  }


  // ══════════════════════════════════════════════════════════════
  // MAIN ENTRY
  // ══════════════════════════════════════════════════════════════

  layout() {
    if (!this._ready || !this.config) return;

    const state   = this._readState();
    const profile = this._selectProfile(state);
    this._profile = profile;

    // Apply profile vars BEFORE measuring so font sizes are correct
    if (profile.vars) {
      for (const [varName, value] of Object.entries(profile.vars)) {
        this.footerBar.style.setProperty(varName, value);
      }
    }

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
    const z     = this._zones;
    return {
      status:      'ok',
      version:     'V6.4.0',
      state,
      device:      this._device,
      profile:     this._profile?.name || 'none',
      layoutMode:  z?.layoutMode || 'unknown',
      stacked:     z?.stacked ?? null,
      twoTier:     z?.twoTier ?? null,
      totalH:      z?.totalH ?? null,
      zones: z ? {
        player:    `x:${z.player.x} w:${z.player.w}`,
        nav:       `x:${z.nav.x} w:${z.nav.w}`,
        logo:      `x:${z.logo.x} w:${z.logo.w}`,
        transport: z.transport ? `x:${z.transport.x} w:${z.transport.w}` : 'n/a',
      } : null,
      rows: z?.rows ? {
        row1: `y:${z.rows.row1.y} h:${z.rows.row1.h}`,
        row2: `y:${z.rows.row2.y} h:${z.rows.row2.h}`,
        row3: `y:${z.rows.row3.y} h:${z.rows.row3.h}`,
      } : null,
      inner:         z?.inner ?? null,
      volumeVisible: this._profile?.volumeVisible ?? null,
    };
  }
}