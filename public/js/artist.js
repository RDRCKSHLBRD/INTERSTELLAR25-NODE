// artist.js — math-first artist layout controller (robust)
import { RatioPosition } from "/system/RatioPosition.js";
import { State } from "/system/State.js";
import { RatioLayoutEngine } from "/system/RatioLayoutEngine.js";

const rp = new RatioPosition({ useCSSTransform: false, roundToPixel: true });
let cfg;

const Q  = (id) => document.getElementById(id);
const px = (n) => `${Math.round(n)}px`;

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

  // main split (robust)
  const ms = c.layout?.mainSplit;
  const leftR  = ms?.left?.ratio  ?? 0.72;
  const rightR = ms?.right?.ratio ?? 0.28;
  const minRightPx = ms?.right?.minPx ?? 320;

  const mainW = vw;
  const leftW  = Math.max(0, Math.round(mainW * leftR));
  const rightW = Math.max(minRightPx, Math.round(mainW * rightR));

  const albums = Q("albumsRegion");
  const info   = Q("infoRegion");

  if (albums) Object.assign(albums.style, { position:"absolute", left:"0",        top:"0", width:px(leftW),  height:px(mainH) });
  if (info)   Object.assign(info.style,   { position:"absolute", left:px(leftW), top:"0", width:px(rightW), height:px(mainH) });
}

function applyPositions(c) {
  const header = Q("artistHeader");
  const albums = Q("albumsRegion");
  const info   = Q("infoRegion");
  const ctrls  = Q("artistControls");

  const P = c.positions || {};

  // Optional header elements
  if (P.brandLogo) rp.apply(Q("brandLogo"), header, P.brandLogo, State);
  if (P.topNav)    rp.apply(Q("topNav"),    header, P.topNav,    State);

  // Album grid (left)
  if (P.albumGrid) rp.apply(Q("albumGrid"), albums, P.albumGrid, State);

  // Right panel: accept either albumInfo (DOM) from config OR map bioSection -> albumInfo
  const albumInfoCfg = P.albumInfo || P.bioSection;
  if (albumInfoCfg)  rp.apply(Q("albumInfo"), info, albumInfoCfg, State);

  // Song list optional
  if (P.songList) rp.apply(Q("songList"), info, P.songList, State);

  // Player controls in controls region
  if (P.playerControls) rp.apply(Q("playerControls"), ctrls, P.playerControls, State);
}

function render() {
  State.measure();
  new RatioLayoutEngine(cfg.layout); // init path
  chooseControlsRatio(cfg);
  applyRegions(cfg);
  applyPositions(cfg);
}

addEventListener("resize", render);
addEventListener("DOMContentLoaded", async () => { cfg = await loadConfig(); render(); });
