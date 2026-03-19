// ============================================================================
// public/js/footerQuadTree.js — V7.0.0 (RODUX Stack)
//
// Group-based footer layout engine.
// Full RODUX pipeline: StateJS → RatioEngine → cssJSON → QuadTree → CSS vars.
//
// ARCHITECTURE:
//   Five named groups: Transport, Information, Link, Action, Logo.
//   Fixed order. ONE packing algorithm for ALL viewports.
//
//   Transport: pinned left (always row 1, col 1).
//   Action + Logo: pinned right on desktop (first row, right edge).
//   Information + Link: flow into remaining space, greedy-expand.
//
//   When viewport narrows: groups that don't fit wrap to next row.
//   No "stacked" vs "two-tier" vs "horizontal" modes.
//   The packing output IS the layout.
//
// DEVICE DETECTION:
//   navigator.maxTouchPoints + pointer:coarse.
//   Touch → volume hidden in Information group.
//   Pointer → volume visible.
//
// V7.0.0: Clean rewrite. Group containers. Paragraph-flow packing.
// ============================================================================

export class FooterQuadTree {
  constructor() {
    this.config      = null;
    this.footerEl    = null;
    this.footerBar   = null;
    this._ready      = false;
    this._device     = null;
    this._packResult = null;
  }


  // ══════════════════════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════════════════════

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
      console.log(`✅ FooterQuadTree V7.0.0 initialized (device: ${this._device})`);
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
    return (hasTouch && hasCoarsePointer) ? 'touch' : (hasTouch ? 'touch' : 'pointer');
  }


  // ══════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════

  _readState() {
    const IS = window.Interstellar;
    if (IS?.state?.viewport) {
      const vp = IS.state.viewport;
      return {
        vw:     vp.width  || window.innerWidth,
        vh:     vp.height || window.innerHeight,
        dpr:    vp.dpr    || window.devicePixelRatio || 1,
        device: this._device,
      };
    }
    return {
      vw:     window.innerWidth,
      vh:     window.innerHeight,
      dpr:    window.devicePixelRatio || 1,
      device: this._device,
    };
  }


  // ══════════════════════════════════════════════════════════════
  // PROFILE SELECTION — sizing presets only, not layout presets
  // ══════════════════════════════════════════════════════════════

  _selectProfile(state) {
    const profiles = this.config.profiles;
    if (!profiles) return {};

    for (const name of ['compact', 'standard', 'wide']) {
      const p = profiles[name];
      if (!p) continue;
      const minOk = (p.minWidth === undefined) || (state.vw >= p.minWidth);
      const maxOk = (p.maxWidth === undefined) || (state.vw <= p.maxWidth);
      if (minOk && maxOk) return { name, ...p };
    }

    return { name: 'standard', ...(profiles.standard || {}) };
  }


  // ══════════════════════════════════════════════════════════════
  // MEASURE — natural dimensions of a DOM element
  // ══════════════════════════════════════════════════════════════

  _measure(el) {
    if (!el) return { w: 0, h: 0 };

    const prev = el.style.cssText;
    el.style.width      = 'auto';
    el.style.height     = 'auto';
    el.style.position   = 'static';
    el.style.visibility = 'hidden';

    const w = el.scrollWidth;
    const h = el.scrollHeight;

    el.style.cssText = prev;
    return { w, h };
  }


  // ══════════════════════════════════════════════════════════════
  // GROUP ELEMENT MAP
  // ══════════════════════════════════════════════════════════════

  _getGroupElements() {
    const bar = this.footerBar;
    return {
      transport:   bar.querySelector('.group-transport'),
      information: bar.querySelector('.group-information'),
      link:        bar.querySelector('.group-link'),
      action:      bar.querySelector('.group-action'),
      logo:        bar.querySelector('.group-logo'),
    };
  }


  // ══════════════════════════════════════════════════════════════
  // PACK — the core algorithm
  //
  // 1. Measure all groups at natural size.
  // 2. Separate pinned-left, pinned-right, and flow groups.
  // 3. On row 1: place pinned-left first, then pinned-right at
  //    right edge, then flow groups fill the middle.
  // 4. If flow groups don't fit row 1 middle, they wrap to row 2+.
  // 5. Greedy groups expand to fill remaining row space.
  // ══════════════════════════════════════════════════════════════

  _pack(state) {
    const groupsCfg = this.config.groups;
    const groupEls  = this._getGroupElements();
    const vw        = state.vw;

    const GROUP_ORDER = ['transport', 'information', 'link', 'action', 'logo'];

    // ── Build group data with measurements ──────────────────
    const allGroups = GROUP_ORDER.map(name => {
      const cfg = groupsCfg[name] || {};
      const el  = groupEls[name];
      const m   = this._measure(el);

      return {
        name,
        el,
        pinned:    cfg.pinned  || false,   // "left", "right", or false
        greedy:    cfg.greedy  || false,
        minPx:     cfg.minPx   || 0,
        maxPx:     cfg.maxPx   || 9999,
        idealPx:   Math.max(cfg.minPx || 0, Math.min(cfg.maxPx || 9999, Math.max(cfg.idealPx || 100, m.w))),
        measuredW: m.w,
        measuredH: m.h,
      };
    });

    const pinnedLeft  = allGroups.filter(g => g.pinned === 'left');
    const pinnedRight = allGroups.filter(g => g.pinned === 'right');
    const flowGroups  = allGroups.filter(g => !g.pinned);

    // ── Row 1: pinned left + middle flow + pinned right ─────
    // Calculate pinned widths
    let leftW = 0;
    for (const g of pinnedLeft) {
      g.w = Math.min(g.maxPx, Math.max(g.minPx, g.idealPx));
      g.x = leftW;
      leftW += g.w;
    }

    let rightW = 0;
    const rightWidths = [];
    for (const g of pinnedRight) {
      const w = Math.min(g.maxPx, Math.max(g.minPx, g.idealPx));
      rightWidths.push(w);
      rightW += w;
    }

    // Available middle space on row 1
    const middleAvail = Math.max(0, vw - leftW - rightW);

    // ── Try to fit flow groups into row 1 middle ────────────
    const row1Flow  = [];
    const overflow  = [];
    let middleUsed  = 0;

    for (const g of flowGroups) {
      const wantW   = Math.max(g.minPx, Math.min(g.maxPx, g.idealPx));
      const remaining = middleAvail - middleUsed;

      if (wantW <= remaining) {
        // Fits
        g.w = wantW;
        g.x = leftW + middleUsed;
        row1Flow.push(g);
        middleUsed += wantW;
      } else if (g.minPx <= remaining && remaining >= 60) {
        // Squeeze
        g.w = remaining;
        g.x = leftW + middleUsed;
        row1Flow.push(g);
        middleUsed += remaining;
      } else {
        // Overflow to row 2+
        overflow.push(g);
      }
    }

    // ── Greedy expansion in row 1 middle ────────────────────
    const middleSlack = middleAvail - middleUsed;
    if (middleSlack > 0 && row1Flow.length > 0) {
      const greedy = row1Flow.find(g => g.greedy);
      if (greedy) {
        greedy.w = Math.min(greedy.maxPx, greedy.w + middleSlack);
      } else {
        // Distribute to all flow groups
        const share = Math.floor(middleSlack / row1Flow.length);
        for (const g of row1Flow) {
          g.w = Math.min(g.maxPx, g.w + share);
        }
      }
      // Recalc X for row1 flow
      let x = leftW;
      for (const g of row1Flow) { g.x = x; x += g.w; }
    }

    // ── Position pinned-right groups at right edge of row 1 ─
    let rx = vw;
    for (let i = pinnedRight.length - 1; i >= 0; i--) {
      const g = pinnedRight[i];
      g.w = rightWidths[i];
      rx -= g.w;
      g.x = rx;
    }

    // ── Build row 1 ─────────────────────────────────────────
    const row1Groups = [...pinnedLeft, ...row1Flow, ...pinnedRight];
    let row1H = 44;
    for (const g of row1Groups) {
      row1H = Math.max(row1H, g.measuredH || 44);
    }
    for (const g of row1Groups) {
      g.y = 0;
      g.h = row1H;
      g.rowIdx = 0;
    }

    const rows = [{ y: 0, h: row1H, groups: row1Groups }];

    // ── Pack overflow groups into additional rows ───────────
    if (overflow.length > 0) {
      let currentRow = [];
      let rowX = 0;
      let rowY = row1H;

      for (const g of overflow) {
        const wantW    = Math.max(g.minPx, Math.min(g.maxPx, g.idealPx));
        const remaining = vw - rowX;

        if (currentRow.length === 0) {
          g.w = Math.min(wantW, vw);
          g.x = 0;
          currentRow.push(g);
          rowX += g.w;
        } else if (wantW <= remaining) {
          g.w = wantW;
          g.x = rowX;
          currentRow.push(g);
          rowX += g.w;
        } else if (g.minPx <= remaining && remaining >= 60) {
          g.w = Math.max(g.minPx, remaining);
          g.x = rowX;
          currentRow.push(g);
          rowX += g.w;
        } else {
          // Finish current row, start new
          const rowH = Math.max(44, ...currentRow.map(g => g.measuredH || 44));
          for (const rg of currentRow) { rg.y = rowY; rg.h = rowH; rg.rowIdx = rows.length; }
          rows.push({ y: rowY, h: rowH, groups: currentRow });
          rowY += rowH;

          currentRow = [];
          rowX = 0;
          g.w = Math.min(wantW, vw);
          g.x = 0;
          currentRow.push(g);
          rowX += g.w;
        }
      }

      // Finalize last overflow row
      if (currentRow.length > 0) {
        const rowH = Math.max(44, ...currentRow.map(g => g.measuredH || 44));

        // Greedy expand in overflow row
        const usedW = currentRow.reduce((s, g) => s + g.w, 0);
        const slack = vw - usedW;
        if (slack > 0) {
          const greedy = currentRow.find(g => g.greedy);
          if (greedy) {
            greedy.w = Math.min(greedy.maxPx, greedy.w + slack);
          } else if (currentRow.length > 0) {
            const share = Math.floor(slack / currentRow.length);
            for (const g of currentRow) g.w = Math.min(g.maxPx, g.w + share);
          }
          let x = 0;
          for (const g of currentRow) { g.x = x; x += g.w; }
        }

        for (const rg of currentRow) { rg.y = rowY; rg.h = rowH; rg.rowIdx = rows.length; }
        rows.push({ y: rowY, h: rowH, groups: currentRow });
        rowY += rowH;
      }
    }

    // ── Calculate total height ──────────────────────────────
    const totalH = rows.reduce((sum, r) => sum + r.h, 0);

    // ── Build placement map ─────────────────────────────────
    const placements = {};
    for (const row of rows) {
      for (const g of row.groups) {
        placements[g.name] = { x: g.x, y: g.y, w: g.w, h: g.h, row: g.rowIdx };
      }
    }

    return { placements, rows, totalH, rowCount: rows.length, vw };
  }


  // ══════════════════════════════════════════════════════════════
  // WRITE — apply pack results to DOM
  // ══════════════════════════════════════════════════════════════

  _write(packResult, profile, state) {
    const bar = this.footerBar;
    const el  = this.footerEl;
    const { placements, totalH, rowCount } = packResult;

    // ── Footer bar sizing ─────────────────────────────────
    bar.style.position = 'relative';
    bar.style.height   = `${totalH}px`;
    bar.style.display  = 'block';

    bar.style.setProperty('--ft-height', `${totalH}px`);
    bar.style.setProperty('--footer-height', `${totalH}px`);
    bar.style.setProperty('--ft-row-count', `${rowCount}`);

    // ── Profile metadata on footer container ──────────────
    el.dataset.ftProfile = profile.name || 'standard';
    el.dataset.ftDevice  = state.device;
    el.dataset.ftRows    = `${rowCount}`;

    // ── Volume visibility ─────────────────────────────────
    const showVol = this.config.device?.[state.device]?.volumeVisible ?? (state.device === 'pointer');
    bar.style.setProperty('--ft-vol-visible', showVol ? '1' : '0');

    const volEl = bar.querySelector('.player-volume');
    if (volEl) volEl.style.display = showVol ? '' : 'none';

    // ── Per-profile CSS var overrides ─────────────────────
    if (profile.vars) {
      for (const [varName, value] of Object.entries(profile.vars)) {
        bar.style.setProperty(varName, value);
      }
    }

    // ── Position each group absolutely ────────────────────
    const groupEls = this._getGroupElements();

    for (const [name, groupEl] of Object.entries(groupEls)) {
      if (!groupEl) continue;
      const p = placements[name];
      if (!p) continue;

      groupEl.style.position   = 'absolute';
      groupEl.style.left       = `${p.x}px`;
      groupEl.style.top        = `${p.y}px`;
      groupEl.style.width      = `${p.w}px`;
      groupEl.style.height     = `${p.h}px`;
      groupEl.style.boxSizing  = 'border-box';
      groupEl.style.overflow   = 'hidden';

      groupEl.style.setProperty('--group-w', `${p.w}px`);
      groupEl.style.setProperty('--group-h', `${p.h}px`);

      // ── Separators ──────────────────────────────────────
      // Right border between groups on same row
      const row = packResult.rows[p.row];
      if (row) {
        const isLastInRow = row.groups[row.groups.length - 1].name === name;
        groupEl.style.borderRight = isLastInRow ? 'none' : 'var(--footer-separator)';
      }
      // Top border on non-first rows
      groupEl.style.borderTop = (p.row > 0) ? 'var(--footer-separator)' : 'none';
    }
  }


  // ══════════════════════════════════════════════════════════════
  // MAIN ENTRY
  // ══════════════════════════════════════════════════════════════

  layout() {
    if (!this._ready || !this.config) return;

    const state   = this._readState();
    const profile = this._selectProfile(state);

    // Apply profile vars BEFORE measuring (font sizes affect measurement)
    if (profile.vars) {
      for (const [varName, value] of Object.entries(profile.vars)) {
        this.footerBar.style.setProperty(varName, value);
      }
    }

    const packResult = this._pack(state);
    this._packResult = packResult;

    this._write(packResult, profile, state);
  }


  // ══════════════════════════════════════════════════════════════
  // DIAGNOSTIC
  // ══════════════════════════════════════════════════════════════

  diagnose() {
    if (!this._ready) return { status: 'not ready' };
    const state = this._readState();
    const pr    = this._packResult;
    return {
      status:     'ok',
      version:    'V7.0.0',
      state,
      device:     this._device,
      profile:    this._selectProfile(state)?.name || 'none',
      rowCount:   pr?.rowCount ?? null,
      totalH:     pr?.totalH ?? null,
      placements: pr?.placements ?? null,
      rows: pr?.rows?.map((r, i) => ({
        row: i, y: r.y, h: r.h,
        groups: r.groups.map(g => `${g.name}:${g.w}px`).join(' | '),
      })) ?? null,
    };
  }
}