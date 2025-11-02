// public/js/roderick.js
import { applyPaintForPage } from './paint-applier.js';

function whenInterstellarReady(cb) {
  if (window.Interstellar?.quadTree) return cb(window.Interstellar);
  const t0 = performance.now();
  const timer = setInterval(() => {
    if (window.Interstellar?.quadTree) { 
      clearInterval(timer); 
      console.log('✅ Interstellar + QuadTree ready');
      cb(window.Interstellar); 
    }
    if (performance.now() - t0 > 5000) { 
      clearInterval(timer); 
      console.error('❌ Interstellar/QuadTree timeout'); 
    }
  }, 50);
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

(async function init(){
  const res = await fetch('/config/pages/roderick.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('roderick.json not found');
  const cfg = await res.json();

  whenInterstellarReady(async (IS) => {
    const State = IS.State || IS.ViewportState || IS.state || null;
    const layoutEngine = IS.RatioLayoutEngine || IS.layoutEngine || null;
    const rp = resolvePositioner(IS);
    const quadTree = IS.quadTree;
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

    /**
     * FIXED: Use correct selector '.album-cover' for <img> tags
     */
    function layoutAlbumGridWithQuadTree(c) {
      const qtCfg = c.quadTree?.albumGrid;
      if (!qtCfg?.enabled || !quadTree) {
        console.warn('⚠️ QuadTree not enabled or not available');
        return;
      }

      let retryCount = 0;
      const maxRetries = 50;

      const checkAlbums = () => {
        retryCount++;
        
        if (retryCount > maxRetries) {
          console.error('❌ Gave up waiting for albums after 50 retries');
          return;
        }

        // Get container (albumsRegion)
        const gridEl = Q('albumsRegion');
        if (!gridEl) {
          console.warn('⚠️ albumsRegion not found, retrying...');
          setTimeout(checkAlbums, 100);
          return;
        }

        // Get albums - they're <img class="album-cover">
        const albums = Array.from(gridEl.querySelectorAll('.album-cover'));
        if (albums.length === 0) {
          setTimeout(checkAlbums, 100);
          return;
        }

        console.log(`✅ Found ${albums.length} albums in albumsRegion`);

        // Get region dimensions
        const regionRect = gridEl.getBoundingClientRect();
        const w = regionRect.width;

        // Determine breakpoint
        let bucket = (w < 520) ? 'mobile' : 
                     (w < 880) ? 'tablet' : 
                     (w > 1400) ? 'ultra' : 'desktop';

        // Build options from config
        const maxCols = qtCfg.columns?.[bucket]?.max ?? 4;
        const gap = qtCfg.gap?.px ?? 16;
        const aspect = qtCfg.tile?.aspect ?? 1.0;

        console.log(`🎯 QuadTree layout:`, { bucket, maxCols, gap, aspect, width: w });

        // Use QuadTree system
        const layoutResult = quadTree.calculateLayout(gridEl, albums, {
          maxColumns: maxCols,
          aspectRatio: aspect,
          gap: gap
        });

        if (!layoutResult || !layoutResult.positions) {
          console.warn('⚠️ QuadTree layout calculation returned no positions');
          return;
        }

        console.log('🎯 QuadTree result:', layoutResult);

        // Apply positions
        gridEl.style.position = 'relative';
        gridEl.style.width = '100%';

        layoutResult.positions.forEach((pos, index) => {
          const album = albums[index];
          if (!album) return;

          Object.assign(album.style, {
            position: 'absolute',
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            width: `${pos.width}px`,
            height: `${pos.height}px`,
            objectFit: 'cover'
          });
        });

        // Set grid height
        const maxY = Math.max(...layoutResult.positions.map(p => p.y + p.height));
        gridEl.style.height = `${maxY}px`;

        console.log('✅ Album grid laid out via QuadTree!');
      };

      // Start checking
      checkAlbums();
    }

    function render() {
      State?.measure?.();
      layoutEngine?.update?.(cfg.layout);
      chooseControlsRatio(cfg);
      applyRegions(cfg);
      applyPositions(cfg);
      layoutAlbumGridWithQuadTree(cfg);
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
    }
    
    addEventListener('resize', render);
    await applyPaintForPage(cfg);
    render();
    
    console.log('🎉 Roderick.js initialized');
  });
})();