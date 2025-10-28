// artist.js — math-first artist layout controller (binds to window.Interstellar)

// wait for InterstellarSystem.js to publish window.Interstellar
function whenInterstellarReady(cb) {
  if (window.Interstellar) return cb(window.Interstellar);
  const t0 = performance.now();
  const timer = setInterval(() => {
    if (window.Interstellar) { clearInterval(timer); cb(window.Interstellar); }
    if (performance.now() - t0 > 3000) { clearInterval(timer); console.error('Interstellar not found'); }
  }, 30);
}

// try very hard to find the RatioPosition instance or constructor
function resolvePositioner(IS) {
  const directKeys = ["RatioPosition","ratioPosition","positioner","position","pos","positionEngine"].filter(k => k in IS);
  for (const k of directKeys) {
    const v = IS[k];
    if (v && typeof v.apply === "function") return v;        // instance
    if (typeof v === "function") {                           // constructor
      try {
        const inst = new v({ useCSSTransform: false, roundToPixel: true });
        if (inst && typeof inst.apply === "function") return inst;
      } catch { /* not a constructor */ }
    }
  }
  // brute-scan
  for (const [, v] of Object.entries(IS)) {
    if (v && typeof v.apply === "function") return v;
    if (typeof v === "function" && v?.prototype && typeof v.prototype.apply === "function") {
      try {
        const inst = new v({ useCSSTransform: false, roundToPixel: true });
        if (inst && typeof inst.apply === "function") return inst;
      } catch {}
    }
  }
  console.error("[artist] RatioPosition-like object not found on Interstellar");
  return null;
}

function resolveQuadTree(IS) {
  return IS.QuadTreeSystem || IS.quadTree || IS.quadtree || null;
}

whenInterstellarReady((IS) => {
  const State = IS.State || IS.ViewportState || IS.state || null;
  const layoutEngine = IS.RatioLayoutEngine || IS.layoutEngine || null;
  const rp = resolvePositioner(IS);
  const Quad = resolveQuadTree(IS);

  let cfg;

  const Q  = (id) => document.getElementById(id);
  const px = (n) => `${Math.round(n)}px`;
  const applyStyle = (el, styles) => (el && styles) ? Object.assign(el.style, styles) : null;

  async function loadConfig() {
    const r = await fetch("/config/pages/artist.json", { cache: "no-store" });
    if (!r.ok) throw new Error("artist.json not found");
    return r.json();
  }

  function chooseControlsRatio(c) {
    const range = c.layout?.regions?.controls?.ratioRange;
    if (!range) return (c.layout.regions.controls.ratio ??= 0.24);
    const [lo, hi] = range;
    c.layout.regions.controls.ratio = (lo + hi) / 2;
  }

  function applyRegions(c) {
    const vw = innerWidth, vh = innerHeight;
    const headerR = c.layout?.regions?.header?.ratio ?? 0.08;
    const mainR   = c.layout?.regions?.main?.ratio   ?? 0.60;
    const ctrlR   = c.layout?.regions?.controls?.ratio ?? 0.24;

    const headerH = vh * headerR;
    const mainH   = vh * mainR;
    const ctrlH   = vh * ctrlR;

    const header = Q("artistHeader");
    const main   = Q("artistMain");
    const ctrls  = Q("artistControls");

    if (header) Object.assign(header.style, { position:"absolute", left:"0", top:"0", width:px(vw), height:px(headerH) });
    if (main)   Object.assign(main.style,   { position:"absolute", left:"0", top:px(headerH), width:px(vw), height:px(mainH) });
    if (ctrls)  Object.assign(ctrls.style,  { position:"absolute", left:"0", top:px(headerH+mainH), width:px(vw), height:px(ctrlH) });

    // main split (robust if config missing pieces)
    const ms = c.layout?.mainSplit;
    const leftR      = ms?.left?.ratio  ?? 0.72;
    const rightR     = ms?.right?.ratio ?? 0.28;
    const minRightPx = ms?.right?.minPx ?? 320;

    const mainW  = vw;
    const leftW  = Math.max(0, Math.round(mainW * leftR));
    const rightW = Math.max(minRightPx, Math.round(mainW * rightR));

    const albums = Q("albumsRegion");
    const info   = Q("infoRegion");

    if (albums) Object.assign(albums.style, { position:"absolute", left:"0",        top:"0", width:px(leftW),  height:px(mainH) });
    if (info)   Object.assign(info.style,   { position:"absolute", left:px(leftW), top:"0", width:px(rightW), height:px(mainH) });
  }

  function applyPositions(c) {
    if (!rp || typeof rp.apply !== "function") {
      console.warn("[artist] rp.apply not available — skipping positions this frame.");
      return;
    }

    const header = Q("artistHeader");
    const albums = Q("albumsRegion");
    const info   = Q("infoRegion");
    const ctrls  = Q("artistControls");

    const P = c.positions || {};

    if (P.brandLogo) { rp.apply(Q("brandLogo"), header, P.brandLogo, State); applyStyle(Q("brandLogo"), P.brandLogo.styles); }
    if (P.topNav)    { rp.apply(Q("topNav"),    header, P.topNav,    State); applyStyle(Q("topNav"),    P.topNav.styles); }

    if (P.albumGrid) { rp.apply(Q("albumGrid"), albums, P.albumGrid, State); applyStyle(Q("albumGrid"), P.albumGrid.styles); }

    const albumInfoCfg = P.albumInfo || P.bioSection;
    if (albumInfoCfg)  { rp.apply(Q("albumInfo"), info, albumInfoCfg, State); applyStyle(Q("albumInfo"), albumInfoCfg.styles); }

    if (P.songList)       rp.apply(Q("songList"),       info,   P.songList,       State);
    if (P.playerControls) { rp.apply(Q("playerControls"), ctrls,  P.playerControls, State);
                             applyStyle(Q("playerControls"), P.playerControls.styles); }
  }

  function layoutAlbumGridWithQuadTree(cfg) {
    const qtCfg = cfg.quadTree?.albumGrid;
    if (!qtCfg || !qtCfg.enabled) return;

    const gridEl  = document.getElementById('albumGrid');
    const region  = document.getElementById('albumsRegion');
    if (!gridEl || !region) return;

    // measure after RatioPosition has set width on #albumGrid
    const w = gridEl.getBoundingClientRect().width || region.getBoundingClientRect().width;
    let bucket = "desktop";
    if (w < 520) bucket = "mobile";
    else if (w < 880) bucket = "tablet";
    else if (w > 1400) bucket = "ultra";

    const maxCols = qtCfg.columns?.[bucket]?.max ?? 4;
    const gap     = qtCfg.gap?.px ?? 16;
    const aspect  = qtCfg.tile?.aspect ?? 1.0;
    const minTile = qtCfg.minTilePx ?? 140;
    const maxTile = qtCfg.maxTilePx ?? 280;

    const innerW = Math.max(0, w); // already positioned width
    const tileW  = Math.min(maxTile, Math.max(minTile, Math.floor((innerW - (maxCols - 1) * gap) / maxCols)));
    const cols   = Math.max(1, Math.floor((innerW + gap) / (tileW + gap)));
    const rows   = Math.ceil(gridEl.children.length / cols);
    const tileH  = Math.round(tileW / aspect);

    Object.assign(gridEl.style, { position: "absolute" });

    const kids = Array.from(gridEl.children);
    kids.forEach((child, i) => {
      const c = i % cols;
      const rIx = (i / cols) | 0;
      const x = c * (tileW + gap);
      const y = rIx * (tileH + gap);
      Object.assign(child.style, {
        position: "absolute",
        left: `${x}px`,
        top:  `${y}px`,
        width:  `${tileW}px`,
        height: `${tileH}px`
      });
    });

    const totalH = rows * tileH + Math.max(0, rows - 1) * gap;
    gridEl.style.height = `${totalH}px`;

    // If your internal QuadTree exposes an API, call it here (safe no-op otherwise)
    if (Quad && typeof Quad.layout === "function") {
      Quad.layout({ container: gridEl, config: qtCfg, measured: { width: innerW, cols, rows, tileW, tileH, gap } });
    }
  }

  function render() {
    if (State && typeof State.measure === "function") State.measure();
    if (layoutEngine && typeof layoutEngine.update === "function") layoutEngine.update(cfg.layout);

    chooseControlsRatio(cfg);
    applyRegions(cfg);
    applyPositions(cfg);
    layoutAlbumGridWithQuadTree(cfg);

    // keep footer compact by default
    const det = document.querySelector('#artistControls details.footer-details');
    if (det && det.open) det.open = false;
  }

  addEventListener("resize", render);
  addEventListener("DOMContentLoaded", async () => { cfg = await loadConfig(); render(); });
});
