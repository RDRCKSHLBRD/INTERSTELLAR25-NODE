import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM FIX: Reconstruct __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIGURATION
const ROOT_DIR = path.resolve(__dirname, '..'); 
const LAB_DIR = path.join(ROOT_DIR, 'public/uploads');

// IGNORE LIST: Added 'public' to stop recursion
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'coverage', '.DS_Store', 'images', 'mp4', 'public'];
const ALLOWED_EXTS = ['.js', '.mjs', '.cjs', '.json', '.html', '.css', '.sql', '.md', '.txt', '.sh', '.ejs'];

console.log(`\n🌊 GALAXY HYDRATION INITIATED (V3)`);
console.log(`   SOURCE: ${ROOT_DIR}`);
console.log(`   TARGET: ${LAB_DIR}\n`);

// 1. Ensure Lab Exists (Clean Slate)
if (fs.existsSync(LAB_DIR)) {
    fs.rmSync(LAB_DIR, { recursive: true, force: true });
}
fs.mkdirSync(LAB_DIR, { recursive: true });

const codex = [];
let fileCount = 0;

function scanAndCopy(currentPath) {
    // SAFETY LOCK: Double check we aren't scanning the lab
    if (path.resolve(currentPath).startsWith(path.resolve(LAB_DIR))) {
        return;
    }

    const items = fs.readdirSync(currentPath);

    items.forEach(item => {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);
        
        // RELATIVE PATH FIX: No leading dot! (e.g. "src/server.js")
        const relativePath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');

        if (stat.isDirectory()) {
            if (IGNORE_DIRS.includes(item)) return;
            scanAndCopy(fullPath);
        } else {
            const ext = path.extname(item);
            if (ALLOWED_EXTS.includes(ext)) {
                
                // A. Add to Map
                codex.push({
                    path: relativePath,
                    size_bytes: stat.size,
                    modified_ts: Math.floor(stat.mtimeMs / 1000)
                });

                // B. Copy to Lab
                const destPath = path.join(LAB_DIR, relativePath);
                const destDir = path.dirname(destPath);
                
                if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
                fs.copyFileSync(fullPath, destPath);
                fileCount++;
            }
        }
    });
}

// 2. Execute
try {
    scanAndCopy(ROOT_DIR);
    
    // 3. Save Map
    const mapPath = path.join(LAB_DIR, 'INTERSTELLAR_CODEX_META.json');
    fs.writeFileSync(mapPath, JSON.stringify(codex, null, 2));

    console.log(`✅ HYDRATION COMPLETE.`);
    console.log(`   - Map Size:     ${codex.length} nodes`);
    console.log(`   - Files Copied: ${fileCount}`);
    console.log(`   - Location:     public/uploads/\n`);

} catch (err) {
    console.error("❌ HYDRATION FAILED:", err);
}