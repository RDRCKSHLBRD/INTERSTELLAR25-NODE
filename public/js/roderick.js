// public/js/roderick.js
import { applyPaintForPage } from './paint-applier.js';

function whenInterstellarReady(cb) {
  if (window.Interstellar) return cb(window.Interstellar);
  const t0 = performance.now();
  const timer = setInterval(() => {
    if (window.Interstellar) { clearInterval(timer); cb(window.Interstellar); }
    if (performance.now() - t0 > 3000) { clearInterval(timer); console.error('Interstellar not found'); }
  }, 30);
}

function resolvePositioner(IS) {
  const keys = ["RatioPosition","ratioPosition","positioner","position","pos","positionEngine"].filter(k => k in IS);
  for (const k of keys) {
    const v = IS[k];
    if (v && typeof v.apply === "function") return v;
    if (typeof v === "function" && v?.prototype?.apply) {
      try { const inst = new v({ useCSSTransform:false, roundToPixel:true }); if (inst.apply) return inst; } catch {}
    }
  }
  for (const [k,v] of Object.entries(IS)) {
    if (v && typeof v.apply === "function") return v;
    if (typeof v === "function" && v?.prototype?.apply) {
      try { const inst = new v({ useCSSTransform:false, roundToPixel:true }); if (inst.apply) return inst; } catch {}
    }
  }
  console.error('[roderick] RatioPosition not found'); return null;
}

function resolveQuadTree(IS){ return IS.QuadTreeSystem || IS.quadTree || IS.quadtree || null; }

(async function init(){
  const res = await fetch('/config/pages/roderick.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('roderick.json not found');
  const cfg = await res.json();

  whenInterstellarReady(async (IS) => {
    const State = IS.State || IS.ViewportState || IS.state || null;
    const layoutEngine = IS.RatioLayoutEngine || IS.layoutEngine || null;
    const rp = resolvePositioner(IS);
    const Q  = (id) => document.getElementById(id);
    const px = (n) => `${Math.round(n)}px`;

    function chooseControlsRatio(c) {
      const range = c.layout?.regions?.controls?.ratioRange;
      c.layout.regions.controls.ratio = range ? (range[0] + range[1]) / 2 : (c.layout.regions.controls.ratio ?? 0.24);
    }

    function applyRegions(c) {
      const vw = innerWidth, vh = innerHeight;
      const headerR = c.layout?.regions?.header?.ratio ?? 0.08;
      const mainR   = c.layout?.regions?.main?.ratio   ?? 0.60;
      const ctrlR   = c.layout?.regions?.controls?.ratio ?? 0.24;

      const headerH = vh * headerR, mainH = vh * mainR, ctrlH = vh * ctrlR;

      const header = Q("artistHeader");
      const main   = Q("artistMain");
      const ctrls  = Q("artistControls");

      if (header) Object.assign(header.style,{position:"absolute",left:"0",top:"0",width:px(vw),height:px(headerH)});
      if (main)   Object.assign(main.style,  {position:"absolute",left:"0",top:px(headerH),width:px(vw),height:px(mainH)});
      if (ctrls)  Object.assign(ctrls.style, {position:"absolute",left:"0",top:px(headerH+mainH),width:px(vw),height:px(ctrlH)});

      const ms = c.layout?.mainSplit;
      const leftR  = ms?.left?.ratio  ?? 0.66;
      const rightR = ms?.right?.ratio ?? 0.34;
      const minR   = ms?.right?.minPx ?? 360;

      const mainW  = vw;
      const leftW  = Math.max(0, Math.round(mainW * leftR));
      const rightW = Math.max(minR, Math.round(mainW * rightR));

      const albums = Q("albumsRegion");
      const info   = Q("infoRegion");
      if (albums) Object.assign(albums.style,{position:"absolute",left:"0",top:"0",width:px(leftW),height:px(mainH)});
      if (info)   Object.assign(info.style,  {position:"absolute",left:px(leftW),top:"0",width:px(rightW),height:px(mainH)});
    }

    function applyPositions(c) {
      if (!rp?.apply) return;
      const P = c.positions || {};
      if (P.brandLogo)  rp.apply(Q("brandLogo"),  Q("artistHeader"), P.brandLogo,  State);
      if (P.pageCrumbs) rp.apply(Q("pageCrumbs"), Q("artistHeader"), P.pageCrumbs, State);
      if (P.topNav)     rp.apply(Q("topNav"),     Q("artistHeader"), P.topNav,     State);
      if (P.albumGrid)  rp.apply(Q("albumGrid"),  Q("albumsRegion"), P.albumGrid,  State);
      const albumInfoCfg = P.albumInfo || P.bioSection;
      if (albumInfoCfg) rp.apply(Q("albumInfo"),  Q("infoRegion"),   albumInfoCfg, State);
      if (P.songList)   rp.apply(Q("songList"),   Q("infoRegion"),   P.songList,   State);
      if (P.playerControls) rp.apply(Q("playerControls"), Q("artistControls"), P.playerControls, State);
    }

    function layoutAlbumGridWithQuadTree(c) {
      const qtCfg = c.quadTree?.albumGrid;
      if (!qtCfg?.enabled) return;
      const gridEl = Q('albumGrid'), region = Q('albumsRegion');
      if (!gridEl || !region) return;
      const r = region.getBoundingClientRect();
      const w = r.width;
      let bucket = (w < 520) ? 'mobile' : (w < 880) ? 'tablet' : (w > 1400) ? 'ultra' : 'desktop';
      const maxCols = qtCfg.columns?.[bucket]?.max ?? 4;
      const gap     = qtCfg.gap?.px ?? 16;
      const aspect  = qtCfg.tile?.aspect ?? 1.0;
      const minTile = qtCfg.minTilePx ?? 140;
      const maxTile = qtCfg.maxTilePx ?? 280;

      const innerW = Math.max(0, w * 0.92);
      const tileW  = Math.min(maxTile, Math.max(minTile, Math.floor((innerW - (maxCols - 1)*gap) / maxCols)));
      const cols   = Math.max(1, Math.floor((innerW + gap) / (tileW + gap)));
      const rows   = Math.ceil(gridEl.children.length / cols);
      const tileH  = Math.round(tileW / aspect);

      Object.assign(gridEl.style, { position:"absolute", width:"100%" });

      Array.from(gridEl.children).forEach((child, i) => {
        const cIx = i % cols, rIx = (i / cols) | 0;
        Object.assign(child.style, {
          position:"absolute",
          left: `${cIx * (tileW + gap)}px`,
          top:  `${rIx * (tileH + gap)}px`,
          width: `${tileW}px`,
          height:`${tileH}px`
        });
      });

      gridEl.style.height = `${rows * tileH + Math.max(0, rows - 1) * gap}px`;
    }

    function render() {
      State?.measure?.();
      layoutEngine?.update?.(cfg.layout);
      chooseControlsRatio(cfg);
      applyRegions(cfg);
      applyPositions(cfg);
      layoutAlbumGridWithQuadTree(cfg);
    }

    addEventListener('resize', render);
    await applyPaintForPage(cfg);
    render();
  });
})();
