#!/bin/bash
# ============================================================================
# INTERSTELLAR PACKAGES — V4 CLEANUP
# Removes duplicate public/uploads mirror and root-level dev artifacts
# Run from project root: bash cleanup.sh
# ============================================================================

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  INTERSTELLAR V4 — DIRECTORY CLEANUP                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── 1. NUKE: ./public/uploads/ ──────────────────────────────────
# Full mirror of config/, design-bible/, system/, src/, scripts/,
# tests/, plus root files. Serving internal code publicly.
# Every file here has its canonical copy elsewhere in the project.

if [ -d "./public/uploads" ]; then
  echo "🗑️  Removing ./public/uploads/ (full project mirror — $(du -sh ./public/uploads | cut -f1))"
  echo "   Contains duplicates of:"
  echo "     config/          → canonical at ./config/"
  echo "     design-bible/    → canonical at ./design-bible/"
  echo "     system/          → canonical at ./system/"
  echo "     src/             → canonical at ./src/"
  echo "     scripts/         → canonical at ./scripts/"
  echo "     tests/           → canonical at ./tests/"
  echo "     package.json     → canonical at ./package.json"
  echo "     config.json      → canonical at ./config.json"
  echo "     cors-config.json → canonical at ./cors-config.json"
  echo "     testEmail.js     → canonical at ./testEmail.js"
  echo "     draw_galaxy.js   → canonical at ./draw_galaxy.js"
  echo "     test-state.html  → canonical at ./test-state.html"
  echo "     INTERSTELLAR_CODEX_META.json (build artifact)"
  rm -rf ./public/uploads
  echo "   ✅ Done"
else
  echo "ℹ️  ./public/uploads/ already removed"
fi

echo ""

# ── 2. REMOVE: Root-level dev artifacts ─────────────────────────
# These don't belong in the deploy image.

ROOT_ARTIFACTS=(
  "./test-state.html"
  "./testEmail.js"
  "./draw_galaxy.js"
)

for f in "${ROOT_ARTIFACTS[@]}"; do
  if [ -f "$f" ]; then
    echo "🗑️  Removing $f (dev artifact, not needed in deploy)"
    rm "$f"
    echo "   ✅ Done"
  else
    echo "ℹ️  $f already removed"
  fi
done

echo ""

# ── 3. SUMMARY ──────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════"
echo "CLEANUP COMPLETE"
echo ""
echo "REMOVED:"
echo "  ./public/uploads/         — full project mirror (security + bloat)"
echo "  ./test-state.html         — dev testing page"
echo "  ./testEmail.js            — email test script"  
echo "  ./draw_galaxy.js          — dev experiment"
echo ""
echo "KEPT (canonical locations):"
echo "  ./config/                 — JSON configs (paint, quadtree, header, pages)"
echo "  ./design-bible/           — CSS extraction JSONs + paint variants"
echo "  ./system/                 — RODUX stack (QuadTree, RatioEngine, State, etc.)"
echo "  ./src/                    — Express server, routes, models, views, utils"
echo "  ./scripts/                — hydrate, pos-wire, make-paint-jsons"
echo "  ./public/                 — static HTML, CSS, JS, downloads"
echo "  ./public/downloads/       — per-album liner note pages (4 albums)"
echo ""
echo "NEXT: Run 'node scripts/flash-sync.js' to build SQLite cache"
echo "═══════════════════════════════════════════════════════════"