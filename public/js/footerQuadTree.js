// ============================================================================
// public/js/footerQuadTree.js — V6.5.0 (RODUX Stack)
//
// QuadTree-driven footer layout engine.
// Full RODUX pipeline: StateJS → RatioEngine → cssJSON → QuadTree → CSS vars.
//
// DEVICE DETECTION:
//   Distinguishes touch devices from desktop browsers resized small.
//   Uses navigator.maxTouchPoints + pointer:coarse media query.
//   A desktop at 375px gets 'desktop-narrow' profile (horizontal, all controls).
//   An iPhone at 375px gets 'compact-portrait' profile (stacked, wireframe layout).
//
// LAYOUT MODES:
//
//   "stacked"    — portrait phone. Flex-wrap, full-width zones.
//                  CSS handles order. No absolute calc needed.
//
//   "two-tier"   — landscape phone / tablet.
//                  .footer-bar is position:relative, all elements positioned
//                  absolutely AGAINST THE BAR (not against zone wrappers).
//                  Zone wrappers use display:contents to become invisible.
//
//                  Row 1: title | seek | time
//                  Row 2: transport (left) | nav (right)
//                  Row 3: logo (right-aligned)
//
//   "horizontal" — desktop. Single strip, three zones side by side.
//                  Zones positioned absolutely. Player zone uses flex internally
//                  with computed max-widths for title/seek that adapt on narrow
//                  viewports (measure → compute → apply).
//
// V6.5.0 FIXES:
//   - Two-tier: zone wrappers use display:contents. All inner elements
//     positioned against .footer-bar. Transport no longer clipped.
//   - Horizontal: inner player gets explicit width calc so title/seek
//     squeeze proportionally on narrow desktop (like album grid does).
//   - Clean mode transitions: _clearAbsoluteLayout resets ALL elements.
//   - Title-first distribution: title measured at natural width, gets
//     priority up to 60% of available space. Seek gets remainder.
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
    this._lastLayout = null;
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
      console.log(`✅ FooterQuadTree V6.5.0 initialized (device: ${this._device})`);
    } catch (err) {
      console.error('❌ FooterQuadTree init failed:', err);
    }
  }


  // ══════════════════════════════════════════════════════════════
  // DEVICE DETECTION
  // ══════════════════════════════════════════════════════════════

  _detectDevice() {
    const hasTouch         = navigator.maxTouchPoints > 0;
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
    const cfg       = this.config;
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
  // ══════════════════════════════════════════════════════════════

  _measure(el) {
    if (!el) return { w: 0, h: 0 };

    const prevW    = el.style.width;
    const prevH    = el.style.height;
    const prevPos  = el.style.position;
    const prevVis  = el.style.visibility;
    const prevTop  = el.style.top;
    const prevLeft = el.style.left;
    const prevCss  = el.style.cssText;

    // Temporarily free from constraints
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
  // COMPUTE ZONES — all mathematical, returns geometry objects
  // ══════════════════════════════════════════════════════════════

  _computeZones(profile, state) {
    const zones      = profile.zones || this.config.zones || {};
    const vw         = state.vw;
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
    if (layoutMode === 'two-tier') {
      const bar = this.footerBar;

      const titleEl     = bar.querySelector('.player-title');
      const seekEl      = bar.querySelector('.player-seek');
      const timeEl      = bar.querySelector('.player-time');
      const transportEl = bar.querySelector('.player-transport');
      const navEl       = bar.querySelector('.footer-nav-zone');
      const logoEl      = bar.querySelector('.footer-logo');

      const titleSize     = this._measure(titleEl);
      const timeSize      = this._measure(timeEl);
      const transportSize = this._measure(transportEl);
      const navSize       = this._measure(navEl);
      const logoSize      = this._measure(logoEl);

      const btnSizePx = parseInt(
        getComputedStyle(bar).getPropertyValue('--player-btn-size') || '30'
      ) || 30;

      const rowPadV = 5;
      const hPad    = 14;

      const navCfg  = zones.nav  || {};
      const logoCfg = zones.logo || {};

      // ── ROW 1: title | seek | time ───────────────────────
      const seekMinW = parseInt(
        getComputedStyle(bar).getPropertyValue('--seek-min-w') || '100'
      ) || 100;
      const seekMaxW = parseInt(
        getComputedStyle(bar).getPropertyValue('--seek-max-w') || '9999'
      ) || 9999;

      const gapRow1    = 8;
      const timeW      = Math.ceil(timeSize.w) || 70;
      const availRow1  = vw - hPad * 2 - gapRow1 * 2 - timeW;

      // Title-first: priority up to 60%, seek gets remainder
      const titleMaxW  = Math.floor(availRow1 * 0.6);
      const titleNatW  = Math.ceil(titleSize.w) || 100;
      const titleW     = Math.max(60, Math.min(titleMaxW, titleNatW));

      const seekAvail  = availRow1 - titleW;
      const seekW      = Math.floor(Math.min(seekMaxW, Math.max(seekMinW, seekAvail)));

      const row1ContentH = Math.max(timeSize.h || 20, 20);
      const row1H        = rowPadV * 2 + row1ContentH;

      const titleX = hPad;
      const seekX  = titleX + titleW + gapRow1;
      const timeX  = seekX  + seekW  + gapRow1;

      // ── ROW 2: transport (left) | nav (right) ────────────
      const navW       = Math.floor(
        Math.min(navCfg.maxPx ?? Infinity, Math.max(navCfg.minPx ?? 0, navSize.w))
      );
      const transportW = Math.ceil(transportSize.w) || btnSizePx * 7;
      const navX       = vw - navW;
      const row2H      = rowPadV * 2 + Math.max(btnSizePx, navSize.h || btnSizePx);

      // ── ROW 3: logo right-aligned ────────────────────────
      const logoW = Math.floor(
        Math.min(logoCfg.maxPx ?? Infinity, Math.max(logoCfg.minPx ?? 0, logoSize.w))
      );
      const logoX = vw - logoW;
      const row3H = rowPadV * 2 + (logoSize.h || 28);

      // ── Row Y positions ──────────────────────────────────
      const row1Y  = 0;
      const row2Y  = row1H;
      const row3Y  = row1H + row2H;
      const totalH = row1H + row2H + row3H;

      return {
        player:    { x: 0,    w: vw   },
        nav:       { x: navX, w: navW },
        logo:      { x: logoX, w: logoW },
        transport: { x: hPad,  w: transportW },

        rows: {
          row1: { y: row1Y, h: row1H },
          row2: { y: row2Y, h: row2H },
          row3: { y: row3Y, h: row3H },
        },
        inner: {
          titleX, titleW,
          seekX,  seekW,
          timeX,  timeW,
          hPad,
          transportX: hPad,
          transportW,
          navX, navW,
          rowPadV,
          logoX, logoW,
          row1ContentH,
        },
        totalH,
        stacked:    false,
        twoTier:    true,
        layoutMode: 'two-tier',
      };
    }


    // ── Horizontal (desktop / touch-wide) ────────────────────
    const bar    = this.footerBar;
    const navEl  = bar.querySelector('.footer-nav-zone');
    const logoEl = bar.querySelector('.footer-logo');

    const navSize  = this._measure(navEl);
    const logoSize = this._measure(logoEl);

    const navCfg  = zones.nav  || {};
    const logoCfg = zones.logo || {};

    const finalNavW  = Math.floor(Math.min(navCfg.maxPx  ?? Infinity, Math.max(navCfg.minPx  ?? 0, navSize.w)));
    const finalLogoW = Math.floor(Math.min(logoCfg.maxPx ?? Infinity, Math.max(logoCfg.minPx ?? 0, logoSize.w)));

    const playerCfg    = zones.player || {};
    const available    = vw - finalNavW - finalLogoW;
    const finalPlayerW = Math.max(playerCfg.minPx ?? 200, Math.floor(available));

    const height = (profile.height && profile.height !== 'auto') ? profile.height : 75;

    // ── Inner player calc for horizontal ─────────────────────
    const titleEl     = bar.querySelector('.player-title');
    const transportEl = bar.querySelector('.player-transport');
    const timeEl      = bar.querySelector('.player-time');
    const volEl       = bar.querySelector('.player-volume');

    const transportSize = this._measure(transportEl);
    const timeSize      = this._measure(timeEl);
    const volSize       = profile.volumeVisible ? this._measure(volEl) : { w: 0, h: 0 };

    const hPad   = 14;
    const gap    = 8;
    const sepW   = 12;   // separator + its margins
    const fixedW = (transportSize.w || 200) + sepW + (timeSize.w || 70) + volSize.w;
    const gapCount = profile.volumeVisible ? 5 : 4;
    const gaps   = gap * gapCount;
    const titleSeekAvail = finalPlayerW - hPad * 2 - fixedW - gaps;

    const titleNatW = this._measure(titleEl)?.w || 100;
    const titleMaxW = Math.floor(titleSeekAvail * 0.4);
    const hzTitleW  = Math.max(60, Math.min(titleMaxW, titleNatW));
    const hzSeekW   = Math.max(40, titleSeekAvail - hzTitleW);

    return {
      player: { x: 0,                       w: finalPlayerW },
      nav:    { x: finalPlayerW,             w: finalNavW    },
      logo:   { x: finalPlayerW + finalNavW, w: finalLogoW   },
      height,
      stacked:    false,
      twoTier:    false,
      layoutMode: 'horizontal',
      playerInner: {
        hPad,
        titleMaxW: hzTitleW,
        seekMaxW:  hzSeekW,
        volW:      volSize.w || 0,
      },
    };
  }


  // ══════════════════════════════════════════════════════════════
  // WRITE — CSS vars + inline styles on DOM
  // ══════════════════════════════════════════════════════════════

  _writeVars(zones, profile, state) {
    const bar = this.footerBar;
    const el  = this.footerEl;

    // ── Clean mode transitions ────────────────────────────────
    const newLayout = zones.layoutMode;
    if (this._lastLayout && this._lastLayout !== newLayout) {
      this._clearAbsoluteLayout();
    }
    this._lastLayout = newLayout;

    // ── Profile metadata ──────────────────────────────────────
    const profileAttr = zones.twoTier ? 'two-tier' : (profile.name || 'default');
    bar.style.setProperty('--ft-profile', profileAttr);
    bar.style.setProperty('--ft-stacked', zones.stacked ? '1' : '0');
    el.dataset.ftProfile = profileAttr;
    el.dataset.ftDevice  = state.device;

    // ── Volume visibility ─────────────────────────────────────
    const showVol = profile.volumeVisible ?? true;
    bar.style.setProperty('--ft-vol-visible', showVol ? '1' : '0');

    // ── Per-profile CSS var overrides ─────────────────────────
    if (profile.vars) {
      for (const [varName, value] of Object.entries(profile.vars)) {
        bar.style.setProperty(varName, value);
      }
    }

    // ── Zone position vars ────────────────────────────────────
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
      bar.style.position = '';
      bar.style.height   = '';
      bar.style.display  = '';

      const playerZone = bar.querySelector('.footer-player-zone');
      const navZone    = bar.querySelector('.footer-nav-zone');
      const logoZone   = bar.querySelector('.footer-logo');

      if (playerZone) playerZone.style.cssText = `width: 100%; order: ${zones.player.order};`;
      if (navZone)    navZone.style.cssText    = `width: 100%; order: ${zones.nav.order}; border-left: none;`;
      if (logoZone)   logoZone.style.cssText   = `width: 100%; order: ${zones.logo.order}; border-left: none;`;

      // Restore inner player to default flex
      const playerInner = bar.querySelector('.player');
      if (playerInner) playerInner.style.cssText = '';

      // Restore all inner elements to CSS defaults
      ['.player-title', '.player-separator', '.player-transport',
       '.player-seek', '.player-time'].forEach(sel => {
        const child = bar.querySelector(sel);
        if (child) child.style.cssText = '';
      });

      const volEl = bar.querySelector('.player-volume');
      if (volEl) volEl.style.display = showVol ? '' : 'none';

      return;
    }


    // ══════════════════════════════════════════════════════════
    // TWO-TIER — landscape phone / tablet
    //
    // V6.5.0 FIX: Zone wrappers use display:contents.
    // All inner elements positioned against .footer-bar.
    // Transport is no longer clipped by player zone height.
    // ══════════════════════════════════════════════════════════
    if (zones.twoTier) {
      const { rows, inner, totalH } = zones;

      // Footer bar: positioning context
      bar.style.height   = `${totalH}px`;
      bar.style.position = 'relative';
      bar.style.display  = 'block';
      bar.style.setProperty('--ft-height',     `${totalH}px`);
      bar.style.setProperty('--footer-height', `${totalH}px`);

      // Row vars for CSS theming
      bar.style.setProperty('--ft-row1-y', `${rows.row1.y}px`);
      bar.style.setProperty('--ft-row1-h', `${rows.row1.h}px`);
      bar.style.setProperty('--ft-row2-y', `${rows.row2.y}px`);
      bar.style.setProperty('--ft-row2-h', `${rows.row2.h}px`);
      bar.style.setProperty('--ft-row3-y', `${rows.row3.y}px`);
      bar.style.setProperty('--ft-row3-h', `${rows.row3.h}px`);
      bar.style.setProperty('--ft-transport-w', `${inner.transportW}px`);

      // ── Zone wrappers → display:contents ────────────────────
      // Children position directly against .footer-bar
      const playerZone  = bar.querySelector('.footer-player-zone');
      const playerInner = playerZone?.querySelector('.player');
      if (playerZone)  playerZone.style.cssText  = 'display: contents;';
      if (playerInner) playerInner.style.cssText = 'display: contents;';

      // ── Row 1: title, seek, time ────────────────────────────
      const titleEl = bar.querySelector('.player-title');
      const seekEl  = bar.querySelector('.player-seek');
      const timeEl  = bar.querySelector('.player-time');

      if (titleEl) {
        titleEl.style.cssText = `
          position: absolute;
          left: ${inner.titleX}px;
          top: ${rows.row1.y + inner.rowPadV}px;
          width: ${inner.titleW}px;
          height: ${inner.row1ContentH}px;
          max-width: ${inner.titleW}px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: ${inner.row1ContentH}px;
        `;
      }
      if (seekEl) {
        seekEl.style.cssText = `
          position: absolute;
          left: ${inner.seekX}px;
          top: ${rows.row1.y + inner.rowPadV}px;
          width: ${inner.seekW}px;
          height: ${inner.row1ContentH}px;
          display: flex;
          align-items: center;
        `;
      }
      if (timeEl) {
        timeEl.style.cssText = `
          position: absolute;
          left: ${inner.timeX}px;
          top: ${rows.row1.y + inner.rowPadV}px;
          width: ${inner.timeW}px;
          height: ${inner.row1ContentH}px;
          line-height: ${inner.row1ContentH}px;
          text-align: right;
        `;
      }

      // ── Row 2: transport + nav ──────────────────────────────
      const transportEl = bar.querySelector('.player-transport');
      if (transportEl) {
        transportEl.style.cssText = `
          position: absolute;
          top: ${rows.row2.y + inner.rowPadV}px;
          left: ${inner.transportX}px;
          width: ${inner.transportW}px;
          height: ${rows.row2.h - inner.rowPadV * 2}px;
          display: flex;
          align-items: center;
          gap: var(--player-btn-gap, 4px);
        `;
      }

      const navZone = bar.querySelector('.footer-nav-zone');
      if (navZone) {
        navZone.style.cssText = `
          position: absolute;
          top: ${rows.row2.y}px;
          left: ${inner.navX}px;
          width: ${inner.navW}px;
          height: ${rows.row2.h}px;
          display: flex;
          align-items: center;
          border-left: var(--footer-separator);
          border-top: var(--footer-separator);
          box-sizing: border-box;
          overflow: visible;
        `;
      }

      // ── Row 3: logo ─────────────────────────────────────────
      const logoZone = bar.querySelector('.footer-logo');
      if (logoZone) {
        logoZone.style.cssText = `
          position: absolute;
          top: ${rows.row3.y}px;
          left: ${inner.logoX}px;
          width: ${inner.logoW}px;
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

      // ── Hide separator, volume, audio ───────────────────────
      const sep = bar.querySelector('.player-separator');
      if (sep) sep.style.display = 'none';

      const volEl = bar.querySelector('.player-volume');
      if (volEl) volEl.style.display = 'none';

      const audioEl = bar.querySelector('audio');
      if (audioEl) audioEl.style.display = 'none';

      return;
    }


    // ══════════════════════════════════════════════════════════
    // HORIZONTAL — desktop
    //
    // Three zones side by side. Player uses flex internally
    // with computed max-widths so elements adapt on narrow
    // viewports.
    // ══════════════════════════════════════════════════════════
    const rawH = zones.height ?? 75;
    const hPx  = (rawH === 'auto') ? 75 : rawH;

    bar.style.height   = `${hPx}px`;
    bar.style.position = 'relative';
    bar.style.display  = 'block';
    bar.style.setProperty('--ft-height',     `${hPx}px`);
    bar.style.setProperty('--footer-height', `${hPx}px`);

    const playerZone = bar.querySelector('.footer-player-zone');
    const navZone    = bar.querySelector('.footer-nav-zone');
    const logoZone   = bar.querySelector('.footer-logo');

    // ── Player zone: absolute, inner flex ─────────────────────
    if (playerZone) {
      playerZone.style.cssText = `
        position: absolute;
        top: 0; left: ${zones.player.x}px;
        width: ${zones.player.w}px;
        height: ${hPx}px;
        display: flex;
        align-items: center;
        padding: 0 ${zones.playerInner?.hPad || 14}px;
        gap: 8px;
        box-sizing: border-box;
      `;
    }

    const playerInner = playerZone?.querySelector('.player');
    if (playerInner) {
      playerInner.style.cssText = `
        display: flex;
        align-items: center;
        min-width: 0;
        gap: 8px;
        height: 100%;
        width: 100%;
      `;
    }

    // ── Inner player constraints ──────────────────────────────
    const pi = zones.playerInner;
    if (pi) {
      const titleEl = bar.querySelector('.player-title');
      const seekEl  = bar.querySelector('.player-seek');

      if (titleEl) {
        titleEl.style.cssText = `
          max-width: ${pi.titleMaxW}px;
          min-width: 60px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex-shrink: 1;
        `;
      }
      if (seekEl) {
        seekEl.style.cssText = `
          max-width: ${pi.seekMaxW}px;
          min-width: 40px;
          flex: 1 1 auto;
        `;
      }
    }

    // ── Restore separator, transport, time to CSS defaults ────
    const sep = bar.querySelector('.player-separator');
    if (sep) sep.style.cssText = '';

    const transportEl = bar.querySelector('.player-transport');
    if (transportEl) transportEl.style.cssText = '';

    const timeEl = bar.querySelector('.player-time');
    if (timeEl) timeEl.style.cssText = '';

    // ── Volume ────────────────────────────────────────────────
    const volEl = bar.querySelector('.player-volume');
    if (volEl) volEl.style.display = showVol ? '' : 'none';

    // ── Nav & Logo ────────────────────────────────────────────
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
  // CLEAR — reset all inline styles for clean mode transitions
  // ══════════════════════════════════════════════════════════════

  _clearAbsoluteLayout() {
    const bar = this.footerBar;
    if (!bar) return;

    const selectors = [
      '.footer-player-zone',
      '.footer-nav-zone',
      '.footer-logo',
      '.player',
      '.player-title',
      '.player-separator',
      '.player-transport',
      '.player-seek',
      '.player-time',
      '.player-volume',
    ];

    selectors.forEach(sel => {
      const el = bar.querySelector(sel);
      if (el) el.style.cssText = '';
    });

    bar.style.position = '';
    bar.style.height   = '';
    bar.style.display  = '';
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
      version:     'V6.5.0',
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
      playerInner:   z?.playerInner ?? null,
      volumeVisible: this._profile?.volumeVisible ?? null,
    };
  }
}