import fs from 'fs';
import path from 'path';

// --- CONFIGURATION ---
const INPUT_FILE = '../INTERSTELLAR_CODEX_META.json';
const OUTPUT_FILE = '../INTERSTELLAR_GALAXY.svg';

const WIDTH = 1200;
const HEIGHT = 600;
const PADDING = 50;

// Color Palette (Neon/Cyberpunk)
const COLORS = {
  js: '#00f3ff',   // Cyan
  mjs: '#00f3ff',
  css: '#ff00ff',  // Magenta
  html: '#ff7700', // Orange
  json: '#00ff00', // Matrix Green
  sql: '#ffff00',  // Gold
  md: '#aaaaaa',   // Grey
  default: '#ffffff'
};

// --- HELPER FUNCTIONS ---
const getExt = (p) => path.extname(p).substring(1);
const mapRange = (val, inMin, inMax, outMin, outMax) => 
  ((val - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

// Simple string hash to group folders on Y-axis
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
};

// --- MAIN GENERATOR ---
function generateGalaxy() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`[ERROR] Codex not found at ${INPUT_FILE}. Run codex.sh first.`);
    return;
  }

  const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
  let stars = JSON.parse(rawData);

  // 1. Analyze Data Ranges
  const timeMin = Math.min(...stars.map(s => s.modified_ts));
  const timeMax = Math.max(...stars.map(s => s.modified_ts));
  const sizeMax = Math.max(...stars.map(s => s.size_bytes));
  
  // Cap the visual size so huge files don't blot out the sun
  const maxRenderSize = 15; 

  console.log(`Mapping ${stars.length} stars across time...`);

  // 2. Build SVG Content
  let svgBody = '';

  // Draw Grid Lines (Time Markers)
  svgBody += `<line x1="${PADDING}" y1="${HEIGHT/2}" x2="${WIDTH-PADDING}" y2="${HEIGHT/2}" stroke="#1a1a2e" stroke-width="2" />`;

  stars.forEach(star => {
    // CALC X: Time (Linear)
    const x = mapRange(star.modified_ts, timeMin, timeMax, PADDING, WIDTH - PADDING);

    // CALC Y: Folder "Lane" + Random Scatter
    // We isolate the folder path to group related files
    const folder = path.dirname(star.path);
    const seed = hashString(folder);
    // Deterministic random position based on folder hash
    const normalizedHash = (Math.abs(seed) % 1000) / 1000; 
    const yBase = mapRange(normalizedHash, 0, 1, PADDING, HEIGHT - PADDING);
    // Add slight jitter so files in same folder don't perfectly overlap
    const jitter = (hashString(star.path) % 40) - 20; 
    const y = yBase + jitter;

    // CALC RADIUS: Logarithmic scale for better visual balance
    // Math.log(size) prevents 100kb files from being massive blobs
    let r = Math.max(2, Math.log(star.size_bytes || 1) * 0.8);
    r = Math.min(r, maxRenderSize);

    // CALC COLOR
    const ext = getExt(star.path);
    const color = COLORS[ext] || COLORS.default;

    // ADD STAR ELEMENT
    // Opacity varies by size (smaller = dimmer)
    const opacity = mapRange(r, 2, maxRenderSize, 0.4, 0.9);
    
    svgBody += `
      <g>
        <title>${star.path} &#10;Size: ${star.size_bytes}b &#10;Modified: ${new Date(star.modified_ts * 1000).toISOString()}</title>
        <circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${opacity}" />
      </g>
    `;
  });

  // 3. Assemble Final SVG
  const svgContent = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg" style="background-color: #0b0d17; font-family: monospace;">
  <rect width="100%" height="100%" fill="#0b0d17" />
  
  <text x="${PADDING}" y="${HEIGHT - 10}" fill="#444" font-size="12">PAST (Big Bang)</text>
  <text x="${WIDTH - 150}" y="${HEIGHT - 10}" fill="#00f3ff" font-size="12">PRESENT (Event Horizon)</text>
  <text x="${WIDTH/2}" y="30" fill="#fff" text-anchor="middle" font-size="20" letter-spacing="4">INTERSTELLAR GALAXY MAP</text>

  ${svgBody}
</svg>
`;

  fs.writeFileSync(OUTPUT_FILE, svgContent);
  console.log(`[✔] Galaxy generated: ${OUTPUT_FILE}`);
}

// Execute
generateGalaxy();