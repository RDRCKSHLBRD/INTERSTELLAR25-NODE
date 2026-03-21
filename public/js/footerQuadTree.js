// ============================================================================
// public/js/footerQuadTree.js — V7.2.0 (RODUX Stack)
//
// Group-based footer layout engine with INNER CALCULATIONS.
// Full RODUX: JS owns every position. CSS is dumb renderer.
//
// OUTER PACK: positions 5 group boxes (L→R, wrap on overflow).
// INNER CALC: positions elements INSIDE each group:
//   Transport:   every button absolute x/y/w/h
//   Information: title, seek, time, volume absolute
//   Link/Action: children measured and positioned inline
//   Logo:        img + tag centered
//
// V7.2.0: Profile-aware transport columns (9-across on wide, 3x3 on compact/standard).
//         Profile flows into _pack() and _calcTransport() for accurate geometry.
// ============================================================================

export class FooterQuadTree {
  constructor() {
    this.config = null;
    this.footerEl = null;
    this.footerBar = null;
    this._ready = false;
    this._device = null;
    this._packResult = null;
  }

  async init() {
    try {
      const res = await fetch('/config/data/footer.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('footer.json: ' + res.status);
      this.config = await res.json();
      this.footerEl = document.getElementById('artistControls');
      this.footerBar = this.footerEl?.querySelector('.footer-bar');
      if (!this.footerBar) { console.warn('⚠️ FooterQuadTree: .footer-bar not found'); return; }
      this._device = this._detectDevice();
      this._ready = true;
      console.log('✅ FooterQuadTree V7.2.0 initialized (device: ' + this._device + ')');
    } catch (err) { console.error('❌ FooterQuadTree init failed:', err); }
  }

  _detectDevice() {
    const hasTouch = navigator.maxTouchPoints > 0;
    const hasCoarse = window.matchMedia('(pointer: coarse)').matches;
    return (hasTouch && hasCoarse) ? 'touch' : (hasTouch ? 'touch' : 'pointer');
  }

  _readState() {
    const IS = window.Interstellar;
    if (IS?.state?.viewport) {
      const vp = IS.state.viewport;
      return { vw: vp.width || innerWidth, vh: vp.height || innerHeight, dpr: vp.dpr || devicePixelRatio || 1, device: this._device };
    }
    return { vw: innerWidth, vh: innerHeight, dpr: devicePixelRatio || 1, device: this._device };
  }

  _selectProfile(state) {
    const profiles = this.config.profiles;
    if (!profiles) return {};

    // 1. Added 'mobile-landscape' to the evaluation order
    const profileNames = ['compact', 'mobile-landscape', 'tablet', 'standard', 'wide'];

    for (const name of profileNames) {
      const p = profiles[name];
      if (!p) continue;

      // 2. Check Width
      const matchW = (p.minWidth === undefined || state.vw >= p.minWidth) &&
        (p.maxWidth === undefined || state.vw <= p.maxWidth);

      // 3. Check Height (NEW - allows targeting sideways phones)
      const matchH = (p.maxHeight === undefined || state.vh <= p.maxHeight) &&
        (p.minHeight === undefined || state.vh >= p.minHeight);

      if (matchW && matchH) return { name, ...p };
    }
    return { name: 'standard', ...(profiles.standard || {}) };
  }

  _measure(el) {
    if (!el) return { w: 0, h: 0 };
    const prev = el.style.cssText;
    el.style.width = 'auto'; el.style.height = 'auto';
    el.style.position = 'static'; el.style.visibility = 'hidden';
    const w = el.scrollWidth, h = el.scrollHeight;
    el.style.cssText = prev;
    return { w, h };
  }

  _cssVar(name, fallback) {
    return parseInt(getComputedStyle(this.footerBar).getPropertyValue(name)) || fallback;
  }

  _getGroupElements() {
    const bar = this.footerBar;
    return {
      transport: bar.querySelector('.group-transport'),
      information: bar.querySelector('.group-information'),
      link: bar.querySelector('.group-link'),
      action: bar.querySelector('.group-action'),
      logo: bar.querySelector('.group-logo'),
    };
  }

  // ══════════════════════════════════════════════════════════════
  // INNER CALC: TRANSPORT — positions every button
  // V7.2: reads profile.transportColumns as column override
  // ══════════════════════════════════════════════════════════════

  _calcTransport(profile) {
    const cfg = this.config.groups.transport?.internal || {};
    // Profile-level override > config-level default > fallback 3
    const cols = profile?.transportColumns || cfg.columns || 3;
    const btnSize = this._cssVar('--player-btn-size', 38);
    const btnGap = this._cssVar('--player-btn-gap', 4);
    const padL = 6;  // left offset
    const padT = 0;  // top offset (buttons flush to top)
    const el = this._getGroupElements().transport;

    const gridWrapper = el?.querySelector('.transport-grid');
    const btns = gridWrapper
      ? Array.from(gridWrapper.querySelectorAll('button'))
      : (el ? Array.from(el.querySelectorAll('button')) : []);

    const count = btns.length;
    const rows = Math.ceil(count / cols);
    const gridW = cols * btnSize + (cols - 1) * btnGap;
    const gridH = rows * btnSize + (rows - 1) * btnGap;

    const buttons = [];
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      buttons.push({
        el: btns[i],
        x: padL + col * (btnSize + btnGap),
        y: padT + row * (btnSize + btnGap),
        w: btnSize,
        h: btnSize,
      });
    }

    return { width: gridW + padL, height: gridH + padT, buttons, btnSize, btnGap, cols, rows };
  }

  // ══════════════════════════════════════════════════════════════
  // INNER CALC: INFORMATION — title, seek+time, volume
  // ══════════════════════════════════════════════════════════════

  _calcInformation(groupW, state) {
    const showVol = this.config.device?.[state.device]?.volumeVisible ?? (state.device === 'pointer');
    const pad = 12, gap = 3;
    const innerW = groupW - pad * 2;
    const titleH = 18;
    const timeW = 78, seekH = this._cssVar('--seek-height', 6);
    const row2H = Math.max(seekH, 18);
    const seekW = Math.max(40, innerW - timeW - 8);
    const volH = showVol ? 20 : 0;
    const totalH = titleH + gap + row2H + (showVol ? gap + volH : 0) + pad * 2;

    let y = pad;
    const elements = {};
    const titleMaxRatio = this.config.groups?.information?.internal?.titleMaxRatio ?? 0.85;
    elements.title = { x: pad, y, w: Math.min(innerW, groupW * titleMaxRatio), h: titleH };

    y += titleH + gap;
    elements.seek = { x: pad, y, w: seekW, h: row2H };
    elements.time = { x: pad + seekW + 8, y, w: timeW, h: row2H };
    y += row2H + gap;
    if (showVol) elements.volume = { x: pad, y, w: innerW, h: volH };

    return { height: totalH, elements, showVol };
  }

  // ══════════════════════════════════════════════════════════════
  // INNER CALC: INLINE (Link, Action) — measure + position children
  // ══════════════════════════════════════════════════════════════

  _calcInline(groupEl, groupH) {
    if (!groupEl) return { width: 0, height: groupH, items: [] };

    const children = Array.from(groupEl.children);
    const items = [];
    let x = 0;

    for (const child of children) {
      // Skip truly hidden elements
      const cs = getComputedStyle(child);
      if (cs.display === 'none') continue;
      if (child.classList.contains('hidden')) continue;

      // For elements that are currently absolutely positioned from a prior pass,
      // we need to measure their natural width. Temporarily free them.
      const prevCss = child.style.cssText;
      child.style.cssText = 'position:static;visibility:hidden;width:auto;height:auto;display:inline-flex;';
      const w = Math.max(child.scrollWidth || child.offsetWidth, 40);
      child.style.cssText = prevCss;

      items.push({ el: child, x, y: 0, w, h: groupH });
      x += w;
    }

    return { width: x, height: groupH, items };
  }

  // ══════════════════════════════════════════════════════════════
  // INNER CALC: LOGO — center img + tag
  // ══════════════════════════════════════════════════════════════

  _calcLogo(groupEl, groupW, groupH) {
    if (!groupEl) return { height: groupH, elements: {} };
    const img = groupEl.querySelector('img');
    const tag = groupEl.querySelector('.footer-tag');
    const imgH = this._cssVar('--logo-img-h', 38);
    const tagH = 14, gap = 2;
    const totalContentH = imgH + gap + tagH;
    const startY = Math.max(0, Math.floor((groupH - totalContentH) / 2));
    const elements = {};
    if (img) {
      const imgW = Math.min(groupW - 16, imgH * 3);
      elements.img = { el: img, x: Math.floor((groupW - imgW) / 2), y: startY, w: imgW, h: imgH };
    }
    if (tag) {
      elements.tag = { el: tag, x: 0, y: startY + imgH + gap, w: groupW, h: tagH };
    }
    return { height: groupH, elements };
  }


  // ══════════════════════════════════════════════════════════════
  // PACK — outer group packing + inner calcs for accurate heights
  // V7.2: accepts profile so transport columns are viewport-aware
  // ══════════════════════════════════════════════════════════════

  _pack(state, profile) {
    const groupsCfg = this.config.groups;
    const groupEls = this._getGroupElements();
    const vw = state.vw;
    const GROUP_ORDER = ['transport', 'information', 'link', 'action', 'logo'];

    // V7.2: pass profile so column count is viewport-aware
    const transportCalc = this._calcTransport(profile);

    const allGroups = GROUP_ORDER.map(name => {
      const cfg = groupsCfg[name] || {};
      const el = groupEls[name];
      const m = this._measure(el);
      let minPx = cfg.minPx || 0;
      let computedH = m.h || 44;

      if (name === 'transport') {
        minPx = Math.max(minPx, transportCalc.width);
        computedH = transportCalc.height;
      }

      return {
        name, el,
        pinned: cfg.pinned || false,
        greedy: cfg.greedy || false,
        minPx,
        maxPx: cfg.maxPx || 9999,
        idealPx: Math.max(minPx, Math.min(cfg.maxPx || 9999, Math.max(cfg.idealPx || 100, m.w))),
        measuredW: m.w,
        measuredH: computedH,
      };
    });

    // ── Separate groups by pin type ─────────────────────────
    const pinnedLeft = allGroups.filter(g => g.pinned === 'left');
    const pinnedRight = allGroups.filter(g => g.pinned === 'right');
    const flowGroups = allGroups.filter(g => !g.pinned);

    // ── Calculate pinned-left width ─────────────────────────
    let leftW = 0;
    for (const g of pinnedLeft) {
      g.w = Math.min(g.maxPx, Math.max(g.minPx, g.idealPx));
      g.x = leftW;
      leftW += g.w;
    }

    // ── Calculate pinned-right width ────────────────────────
    let rightW = 0;
    const rightWidths = [];
    for (const g of pinnedRight) {
      const w = Math.min(g.maxPx, Math.max(g.minPx, g.idealPx));
      rightWidths.push(w);
      rightW += w;
    }

    // ── Check if pinned-right fits on row 1 ─────────────────
    // If viewport is too narrow for left + right, demote right to flow
    const pinnedFits = (leftW + rightW) < vw;
    let actualPinnedRight = [];
    let demotedToFlow = [];

    if (pinnedFits) {
      actualPinnedRight = pinnedRight;
    } else {
      // Demote pinned-right groups to overflow — they'll wrap to row 2
      demotedToFlow = pinnedRight;
      rightW = 0;
    }

    // ── Middle space for flow groups on row 1 ───────────────
    const middleAvail = Math.max(0, vw - leftW - rightW);
    const row1Flow = [];
    const overflow = [];
    let middleUsed = 0;

    for (const g of flowGroups) {
      const wantW = Math.max(g.minPx, Math.min(g.maxPx, g.idealPx));
      const remaining = middleAvail - middleUsed;
      if (wantW <= remaining) {
        g.w = wantW; g.x = leftW + middleUsed;
        row1Flow.push(g); middleUsed += wantW;
      } else if (g.minPx <= remaining && remaining >= 60) {
        g.w = remaining; g.x = leftW + middleUsed;
        row1Flow.push(g); middleUsed += remaining;
      } else {
        overflow.push(g);
      }
    }

    // Add demoted pinned-right groups to overflow (in order)
    overflow.push(...demotedToFlow);

    // ── Greedy expansion in row 1 middle ────────────────────
    const middleSlack = middleAvail - middleUsed;
    if (middleSlack > 0 && row1Flow.length > 0) {
      const greedy = row1Flow.find(g => g.greedy);
      if (greedy) {
        greedy.w = Math.min(greedy.maxPx, greedy.w + middleSlack);
      } else {
        const share = Math.floor(middleSlack / row1Flow.length);
        for (const g of row1Flow) g.w = Math.min(g.maxPx, g.w + share);
      }
      let x = leftW;
      for (const g of row1Flow) { g.x = x; x += g.w; }
    }

    // ── Position pinned-right at right edge of row 1 ────────
    if (actualPinnedRight.length > 0) {
      let rx = vw;
      for (let i = actualPinnedRight.length - 1; i >= 0; i--) {
        const g = actualPinnedRight[i];
        g.w = rightWidths[i];
        rx -= g.w;
        g.x = rx;
      }
    }

    // ── Inner calcs for accurate heights ────────────────────
    const innerCalcs = {};
    for (const g of [...pinnedLeft, ...row1Flow, ...actualPinnedRight, ...overflow]) {
      if (g.name === 'transport') {
        innerCalcs.transport = transportCalc;
        g.measuredH = transportCalc.height;
      } else if (g.name === 'information') {
        innerCalcs.information = this._calcInformation(g.w || 200, state);
        g.measuredH = innerCalcs.information.height;
      }
    }

    // ── Build row 1 ─────────────────────────────────────────
    const row1Groups = [...pinnedLeft, ...row1Flow, ...actualPinnedRight];
    let row1H = 44;
    for (const g of row1Groups) row1H = Math.max(row1H, g.measuredH || 44);
    for (const g of row1Groups) { g.y = 0; g.h = row1H; g.rowIdx = 0; }

    // Inner calcs for row 1 inline groups (using row1's height)
    for (const g of row1Groups) {
      if (g.name === 'link') innerCalcs.link = this._calcInline(g.el, g.h);
      else if (g.name === 'action') innerCalcs.action = this._calcInline(g.el, g.h);
      else if (g.name === 'logo') innerCalcs.logo = this._calcLogo(g.el, g.w, g.h);
    }

    const rows = [{ y: 0, h: row1H, groups: row1Groups }];

    // ── Pack overflow into additional rows ───────────────────
    if (overflow.length > 0) {
      let currentRow = [], rowX = 0, rowY = row1H;

      for (const g of overflow) {
        const wantW = Math.max(g.minPx, Math.min(g.maxPx, g.idealPx));
        const remaining = vw - rowX;

        if (currentRow.length === 0) {
          g.w = Math.min(wantW, vw); g.x = 0;
          currentRow.push(g); rowX += g.w;
        } else if (wantW <= remaining) {
          g.w = wantW; g.x = rowX;
          currentRow.push(g); rowX += g.w;
        } else if (g.minPx <= remaining && remaining >= 60) {
          g.w = Math.max(g.minPx, remaining); g.x = rowX;
          currentRow.push(g); rowX += g.w;
        } else {
          // Finish current overflow row
          this._finalizeOverflowRow(currentRow, rows, rowY, vw, innerCalcs, state);
          rowY += rows[rows.length - 1].h;
          currentRow = []; rowX = 0;
          g.w = Math.min(wantW, vw); g.x = 0;
          currentRow.push(g); rowX += g.w;
        }
      }

      // Finalize last overflow row
      if (currentRow.length > 0) {
        this._finalizeOverflowRow(currentRow, rows, rowY, vw, innerCalcs, state);
      }
    }

    const totalH = rows.reduce((sum, r) => sum + r.h, 0);
    const placements = {};
    for (const row of rows) {
      for (const g of row.groups) {
        placements[g.name] = { x: g.x, y: g.y, w: g.w, h: g.h, row: g.rowIdx };
      }
    }

    return { placements, rows, totalH, rowCount: rows.length, vw, innerCalcs };
  }

  // ── Helper: finalize an overflow row ──────────────────────
  _finalizeOverflowRow(currentRow, rows, rowY, vw, innerCalcs, state) {
    // Greedy expand
    const usedW = currentRow.reduce((s, g) => s + g.w, 0);
    const slack = vw - usedW;
    if (slack > 0) {
      const greedy = currentRow.find(g => g.greedy);
      if (greedy) greedy.w = Math.min(greedy.maxPx, greedy.w + slack);
      else {
        const share = Math.floor(slack / currentRow.length);
        for (const g of currentRow) g.w = Math.min(g.maxPx, g.w + share);
      }
      let x = 0;
      for (const g of currentRow) { g.x = x; x += g.w; }
    }

    // Compute height for this row independently
    // Re-run inner calcs for information if it landed here
    for (const g of currentRow) {
      if (g.name === 'information' && !innerCalcs.information) {
        innerCalcs.information = this._calcInformation(g.w, state);
        g.measuredH = innerCalcs.information.height;
      }
    }

    // Row height = tallest group, but use a shorter default (36) for link/action-only rows
    const hasTransportOrInfo = currentRow.some(g => g.name === 'transport' || g.name === 'information');
    const defaultH = hasTransportOrInfo ? 44 : 36;
    const rowH = Math.max(defaultH, ...currentRow.map(g => g.measuredH || defaultH));

    for (const rg of currentRow) { rg.y = rowY; rg.h = rowH; rg.rowIdx = rows.length; }
    rows.push({ y: rowY, h: rowH, groups: currentRow });

    // Inner calcs for this row's inline groups
    for (const rg of currentRow) {
      if (rg.name === 'link' && !innerCalcs.link) innerCalcs.link = this._calcInline(rg.el, rg.h);
      else if (rg.name === 'action' && !innerCalcs.action) innerCalcs.action = this._calcInline(rg.el, rg.h);
      else if (rg.name === 'logo' && !innerCalcs.logo) innerCalcs.logo = this._calcLogo(rg.el, rg.w, rg.h);
    }
  }


  // ══════════════════════════════════════════════════════════════
  // WRITE — outer groups + inner elements
  // ══════════════════════════════════════════════════════════════

  _write(packResult, profile, state) {
    const bar = this.footerBar;
    const el = this.footerEl;
    const { placements, totalH, rowCount, innerCalcs } = packResult;

    bar.style.position = 'relative';
    bar.style.height = totalH + 'px';
    bar.style.display = 'block';
    bar.style.setProperty('--ft-height', totalH + 'px');
    bar.style.setProperty('--footer-height', totalH + 'px');
    bar.style.setProperty('--ft-row-count', '' + rowCount);

    el.dataset.ftProfile = profile.name || 'standard';
    el.dataset.ftDevice = state.device;
    el.dataset.ftRows = '' + rowCount;

    const showVol = this.config.device?.[state.device]?.volumeVisible ?? (state.device === 'pointer');
    bar.style.setProperty('--ft-vol-visible', showVol ? '1' : '0');

    if (profile.vars) for (const [k, v] of Object.entries(profile.vars)) bar.style.setProperty(k, v);

    // ── Position group boxes ──────────────────────────────
    const groupEls = this._getGroupElements();
    for (const [name, groupEl] of Object.entries(groupEls)) {
      if (!groupEl) continue;
      const p = placements[name];
      if (!p) continue;

      groupEl.style.cssText = '';
      groupEl.style.position = 'absolute';
      groupEl.style.left = p.x + 'px';
      groupEl.style.top = p.y + 'px';
      groupEl.style.width = p.w + 'px';
      groupEl.style.height = p.h + 'px';
      groupEl.style.boxSizing = 'border-box';
      groupEl.style.overflow = 'hidden';
      groupEl.style.setProperty('--group-w', p.w + 'px');
      groupEl.style.setProperty('--group-h', p.h + 'px');

      const row = packResult.rows[p.row];
      if (row) {
        const isLast = row.groups[row.groups.length - 1].name === name;
        if (!isLast) groupEl.style.borderRight = 'var(--footer-separator)';
      }
      if (p.row > 0) groupEl.style.borderTop = 'var(--footer-separator)';
    }

    // ── INNER: Transport buttons ──────────────────────────
    if (innerCalcs.transport) {
      const tc = innerCalcs.transport;
      const gridWrapper = groupEls.transport?.querySelector('.transport-grid');
      if (gridWrapper) gridWrapper.style.display = 'contents';

      for (const btn of tc.buttons) {
        btn.el.style.position = 'absolute';
        btn.el.style.left = btn.x + 'px';
        btn.el.style.top = btn.y + 'px';
        btn.el.style.width = btn.w + 'px';
        btn.el.style.height = btn.h + 'px';
        btn.el.style.margin = '0';
      }
    }

    // ── INNER: Information ────────────────────────────────
    if (innerCalcs.information) {
      const ic = innerCalcs.information;
      const infoEl = groupEls.information;
      if (infoEl) {
        infoEl.querySelectorAll('.info-row').forEach(r => { r.style.display = 'contents'; });

        const titleEl = infoEl.querySelector('.player-title');
        if (titleEl && ic.elements.title) {
          const t = ic.elements.title;
          titleEl.style.cssText = 'position:absolute;left:' + t.x + 'px;top:' + t.y + 'px;width:' + t.w + 'px;height:' + t.h + 'px;line-height:' + t.h + 'px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        }
        const seekEl = infoEl.querySelector('.player-seek');
        if (seekEl && ic.elements.seek) {
          const s = ic.elements.seek;
          seekEl.style.cssText = 'position:absolute;left:' + s.x + 'px;top:' + s.y + 'px;width:' + s.w + 'px;height:' + s.h + 'px;';
        }
        const timeEl = infoEl.querySelector('.player-time');
        if (timeEl && ic.elements.time) {
          const tm = ic.elements.time;
          timeEl.style.cssText = 'position:absolute;left:' + tm.x + 'px;top:' + tm.y + 'px;width:' + tm.w + 'px;height:' + tm.h + 'px;line-height:' + tm.h + 'px;text-align:right;';
        }
        const volEl = infoEl.querySelector('.player-volume');
        const volRow = infoEl.querySelector('.info-volume-row');
        if (ic.showVol && volEl && ic.elements.volume) {
          const v = ic.elements.volume;
          if (volRow) volRow.style.display = 'contents';
          volEl.style.cssText = 'position:absolute;left:' + v.x + 'px;top:' + v.y + 'px;width:' + v.w + 'px;height:' + v.h + 'px;display:flex;align-items:center;gap:4px;';
        } else {
          if (volRow) volRow.style.display = 'none';
          if (volEl) volEl.style.display = 'none';
        }
      }
    }

    // ── INNER: Link ───────────────────────────────────────
    if (innerCalcs.link) {
      for (const item of innerCalcs.link.items) {
        item.el.style.cssText = 'position:absolute;left:' + item.x + 'px;top:0;width:' + item.w + 'px;height:' + item.h + 'px;display:flex;align-items:center;justify-content:center;';
      }
    }

    // ── INNER: Action ─────────────────────────────────────
    if (innerCalcs.action) {
      for (const item of innerCalcs.action.items) {
        item.el.style.cssText = 'position:absolute;left:' + item.x + 'px;top:0;width:' + item.w + 'px;height:' + item.h + 'px;display:flex;align-items:center;justify-content:center;';
      }
    }

    // ── INNER: Logo ───────────────────────────────────────
    if (innerCalcs.logo) {
      for (const [key, item] of Object.entries(innerCalcs.logo.elements)) {
        if (!item.el) continue;
        let extra = '';
        if (key === 'tag') extra = 'text-align:center;line-height:' + item.h + 'px;';
        item.el.style.cssText = 'position:absolute;left:' + item.x + 'px;top:' + item.y + 'px;width:' + item.w + 'px;height:' + item.h + 'px;' + extra;
      }
    }
  }


  layout() {
    if (!this._ready || !this.config) return;
    const state = this._readState();
    const profile = this._selectProfile(state);
    if (profile.vars) for (const [k, v] of Object.entries(profile.vars)) this.footerBar.style.setProperty(k, v);
    // V7.2: pass profile into _pack so transport columns are viewport-aware
    const packResult = this._pack(state, profile);
    this._packResult = packResult;
    this._write(packResult, profile, state);
  }

  diagnose() {
    if (!this._ready) return { status: 'not ready' };
    const state = this._readState();
    const pr = this._packResult;
    const tc = pr?.innerCalcs?.transport;
    return {
      status: 'ok', version: 'V7.2.0', state, device: this._device,
      profile: this._selectProfile(state)?.name || 'none',
      rowCount: pr?.rowCount ?? null, totalH: pr?.totalH ?? null,
      placements: pr?.placements ?? null,
      transport: tc ? { w: tc.width, h: tc.height, btns: tc.buttons.length, cols: tc.cols, rows: tc.rows } : null,
      rows: pr?.rows?.map((r, i) => ({ row: i, y: r.y, h: r.h, groups: r.groups.map(g => g.name + ':' + g.w + 'px').join(' | ') })) ?? null,
    };
  }
}