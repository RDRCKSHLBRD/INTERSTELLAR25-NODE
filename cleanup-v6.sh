#!/bin/bash
# ============================================================================
# cleanup-v6.sh — Remove V4 scaffolding from Interstellar Packages
#
# Run from project root: bash cleanup-v6.sh
#
# What this removes:
#   - design-bible/        V4 style capture system (served its purpose)
#   - paint-applier.js     Conflicting color applicator (replaced by CSS defaults)
#   - config/paint.json    Consumed only by paint-applier
#   - make-paint-jsons.mjs Generated design-bible paint files
#   - pos-wire.cjs         V4 positioning helper
#   - QuadIntegration.js   V4 bridge (replaced by roderick.js V6 CSS-var pipeline)
#   - header.js            Redundant — header.css + roderick.js handle everything
#   - Deploy/              SQL already in database — archive separately
#   - migrations/          Schema already live — archive separately
#
# What this KEEPS (moved to archive first):
#   - Deploy/ and migrations/ get moved to .archive/ as safety copies
#   - paint.json gets a backup before deletion
# ============================================================================

set -e

echo ""
echo "=== INTERSTELLAR V6 CLEANUP ==="
echo "Removing V4 scaffolding..."
echo ""

# Safety: create archive directory
mkdir -p .archive/v4-backup

# ── Archive before delete (safety copies) ────────────────────────
echo "[1/8] Archiving Deploy/ and migrations/ ..."
if [ -d "Deploy" ]; then
  cp -r Deploy .archive/v4-backup/Deploy
  rm -rf Deploy
  echo "  Deploy/ -> .archive/v4-backup/Deploy (removed from tree)"
fi

if [ -d "migrations" ]; then
  cp -r migrations .archive/v4-backup/migrations
  rm -rf migrations
  echo "  migrations/ -> .archive/v4-backup/migrations (removed from tree)"
fi

# ── Archive paint.json ────────────────────────────────────────────
echo "[2/8] Archiving config/paint.json ..."
if [ -f "config/paint.json" ]; then
  cp config/paint.json .archive/v4-backup/paint.json
  rm config/paint.json
  echo "  config/paint.json -> .archive/ (removed from tree)"
fi

# ── Remove design-bible ──────────────────────────────────────────
echo "[3/8] Removing design-bible/ ..."
if [ -d "design-bible" ]; then
  # Archive it too, just in case
  cp -r design-bible .archive/v4-backup/design-bible
  rm -rf design-bible
  echo "  design-bible/ -> .archive/ (removed from tree)"
fi

# ── Remove paint-applier.js ──────────────────────────────────────
echo "[4/8] Removing public/js/paint-applier.js ..."
if [ -f "public/js/paint-applier.js" ]; then
  cp public/js/paint-applier.js .archive/v4-backup/paint-applier.js
  rm public/js/paint-applier.js
  echo "  paint-applier.js removed"
fi

# ── Remove QuadIntegration.js ────────────────────────────────────
echo "[5/8] Removing public/js/QuadIntegration.js ..."
if [ -f "public/js/QuadIntegration.js" ]; then
  cp public/js/QuadIntegration.js .archive/v4-backup/QuadIntegration.js
  rm public/js/QuadIntegration.js
  echo "  QuadIntegration.js removed"
fi

# ── Remove header.js ─────────────────────────────────────────────
echo "[6/8] Removing public/js/header.js ..."
if [ -f "public/js/header.js" ]; then
  cp public/js/header.js .archive/v4-backup/header.js
  rm public/js/header.js
  echo "  header.js removed"
fi

# ── Remove V4 scripts ────────────────────────────────────────────
echo "[7/8] Removing V4 scripts ..."
if [ -f "scripts/make-paint-jsons.mjs" ]; then
  cp scripts/make-paint-jsons.mjs .archive/v4-backup/
  rm scripts/make-paint-jsons.mjs
  echo "  make-paint-jsons.mjs removed"
fi

if [ -f "scripts/pos-wire.cjs" ]; then
  cp scripts/pos-wire.cjs .archive/v4-backup/
  rm scripts/pos-wire.cjs
  echo "  pos-wire.cjs removed"
fi

# ── Summary ──────────────────────────────────────────────────────
echo ""
echo "[8/8] Cleanup complete."
echo ""
echo "Archive location: .archive/v4-backup/"
echo ""
echo "IMPORTANT: You still need to update roderick.html to remove these script tags:"
echo '  <script type="module" src="/js/paint-applier.js"></script>'
echo '  <script type="module" src="/js/header.js"></script>'
echo ""
echo "The updated roderick.js and roderick.html are in the V6 output files."
echo ""

# Count what's left
echo "=== REMAINING FILES ==="
find . -not -path './node_modules/*' -not -path './.archive/*' -not -path './.git/*' -type f | wc -l | xargs echo "Total files:"
echo ""