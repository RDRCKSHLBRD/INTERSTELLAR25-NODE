// public/js/paint-applier.js
async function loadPaint() {
  const res = await fetch('/config/paint.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('paint.json missing');
  return res.json();
}

// simple token resolver {default.bg} → palettes.default.bg
function resolveToken(val, paint) {
  if (typeof val !== 'string') return val;
  const m = val.match(/^\{([^}]+)\}$/);
  if (!m) return val;
  const path = m[1].split('.');
  return path.reduce((o,k)=>o && o[k], paint.palettes) || val;
}

// apply to DOM: only safe “visual” props (no layout)
const VISUAL_WHITELIST = new Set([
  // color / background / borders / text
  'color','background','backgroundColor','border','borderColor','borderTop','borderRight','borderBottom','borderLeft',
  'boxShadow','opacity','filter',
  // type
  'fontFamily','fontWeight','fontStyle','textTransform','letterSpacing',
]);

function styleEl(el, styleObj, paint) {
  if (!el || !styleObj) return;
  for (const [k, vRaw] of Object.entries(styleObj)) {
    if (!VISUAL_WHITELIST.has(k)) continue;
    const v = resolveToken(vRaw, paint);
    el.style[k] = v;
  }
}

function setCSSVars(root, paint) {
  root.style.setProperty('--ip-bg',  paint.palettes.default.bg);
  root.style.setProperty('--ip-fg',  paint.palettes.default.fg);
  root.style.setProperty('--ip-ink', paint.palettes.default.ink);
}

export async function applyPaintForPage(cfg) {
  const paint = await loadPaint();
  const paletteKey = cfg?.themeRefs?.paintKey || 'default';
  if (!paint.palettes[paletteKey]) console.warn('[paint] palette missing:', paletteKey);

  // global
  document.body.style.background = paint.palettes[paletteKey].bg;
  document.body.style.color = paint.palettes[paletteKey].fg;
  document.body.style.fontFamily = paint.typography.fontFamily;
  document.documentElement.style.fontSize = (paint.typography.baseSizePx || 16) + 'px';
  setCSSVars(document.documentElement, paint);

  // components by id/class hook
  const comp = paint.components;
  styleEl(document.getElementById('artistHeader'), { backgroundColor: comp.header.bg, color: comp.header.fg }, paint);
  styleEl(document.querySelector('#topNav'), { color: comp.nav.fg }, paint);
  styleEl(document.getElementById('artistMain'), { backgroundColor: comp.main.bg, color: comp.main.fg }, paint);
  styleEl(document.getElementById('infoRegion'), { backgroundColor: comp.sidebar.bg, color: comp.sidebar.fg, borderColor: comp.sidebar.rule }, paint);
  styleEl(document.getElementById('artistControls'), { backgroundColor: comp.footer.bg, color: comp.footer.fg }, paint);

  // small targeted bits
  const cartCount = document.getElementById('cartCount');
  if (cartCount) styleEl(cartCount, { backgroundColor: comp.badges.cart, color: comp.badges.cartFg }, paint);
}

export default { applyPaintForPage };
