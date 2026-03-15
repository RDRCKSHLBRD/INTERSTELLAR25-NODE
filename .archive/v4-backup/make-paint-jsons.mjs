import fs from 'fs';
import path from 'path';

const SRC_DIR  = path.resolve('design-bible');
const OUT_DIR  = path.resolve('design-bible/_paint');

const FORBIDDEN_RE = new RegExp([
  // positioning / layout
  '^(display|position|top|right|bottom|left|inset|z-index|float|clear)$',
  // sizing
  '^(width|height|max-width|max-height|min-width|min-height|aspect-ratio)$',
  // transforms / overflow / contain
  '^(transform|translate|scale|rotate|overflow|contain|object-fit|object-position)$',
  // spacing that implies layout flow (we’ll let margins/padding through if you want—toggle here)
  // '^(margin|padding)$',
  // flex / grid / columns
  '^(flex|flex-|grid|grid-|place-|gap|row-gap|column-gap|columns?|column-)',
  // text flow layout (optional to keep)
  // '^(white-space)$'
].join('|'), 'i');

// walk a plain object & remove forbidden CSS properties
function stripLayout(obj) {
  if (Array.isArray(obj)) return obj.map(stripLayout);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (FORBIDDEN_RE.test(k)) continue;
      out[k] = stripLayout(v);
    }
    return out;
  }
  return obj;
}

function processFile(file) {
  const src = path.join(SRC_DIR, file);
  const raw = fs.readFileSync(src, 'utf8');
  let json;
  try { json = JSON.parse(raw); }
  catch {
    console.error('✖ JSON parse error:', file);
    return;
  }

  // These files are CSS-extracts; styles live under "selectors[].decls" and "media.*.selectors[].decls".
  // We traverse and strip layout props from each decls object.
  const j2 = JSON.parse(raw);

  function scrubSelectors(container) {
    if (!Array.isArray(container)) return;
    for (const sel of container) {
      if (sel && sel.decls) sel.decls = stripLayout(sel.decls);
    }
  }

  scrubSelectors(j2.selectors);
  if (j2.media && typeof j2.media === 'object') {
    for (const [mq, block] of Object.entries(j2.media)) {
      scrubSelectors(block.selectors);
    }
  }

  // Also scrub any token maps that might carry layout
  if (j2.tokens) j2.tokens = stripLayout(j2.tokens);

  // Make out dir
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outFile = path.join(OUT_DIR, file.replace(/\.json$/, '_paint.json'));
  fs.writeFileSync(outFile, JSON.stringify(j2, null, 2));
  console.log('✓ wrote', path.relative(process.cwd(), outFile));
}

const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.json') && !f.startsWith('_'));
files.forEach(processFile);

// Build a small index so runtime can look up by key
const index = {};
for (const f of files) {
  const key = f.replace(/\.json$/, '');
  index[key] = `_paint/${key}_paint.json`;
}
fs.writeFileSync(path.join(SRC_DIR, 'INDEX.json'), JSON.stringify(index, null, 2));
console.log('✓ updated design-bible/INDEX.json');
