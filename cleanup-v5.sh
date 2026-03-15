#!/bin/bash
# ============================================================================
# INTERSTELLAR PACKAGES — V5 Session 3 Cleanup
# Removes dead V4 files. Run from project root (INTERSTELLAR25-NODE/).
#
# What gets removed:
#   - V4 JS controllers replaced by roderick.js (main.js, api-client.js, ui-manager.js, artist.js)
#   - V4 CSS files replaced by paint.json + inline RODUX styling
#   - Dead config files superseded by V5 page configs
#
# What stays:
#   - roderick.js, roderick.html, player.js (V5 rewritten)
#   - InterstellarSystem.js, header.js, paint-applier.js (RODUX stack)
#   - auth.js, cart.js (Postgres-dependent, still needed)
#   - QuadIntegration.js (bridge module)
#   - landing.js (landing page controller)
#   - All system/ files (StateJS, RatioEngine, QuadTree, etc.)
#   - All config/ JSON files
#   - All downloads/ pages (album download experiences)
#   - Server-side src/ files
# ============================================================================

set -e
echo "🧹 Interstellar V5 Cleanup — Removing dead V4 files"
echo "=================================================="

# ── Dead V4 JavaScript ──────────────────────────────────────────
echo ""
echo "📜 Removing dead V4 JS files..."

# main.js — replaced by roderick.js
[ -f "public/js/main.js" ] && rm -v "public/js/main.js"

# api-client.js — replaced by fetchJSON() in roderick.js
[ -f "public/js/api-client.js" ] && rm -v "public/js/api-client.js"

# ui-manager.js — replaced by roderick.js DOM creation
[ -f "public/js/ui-manager.js" ] && rm -v "public/js/ui-manager.js"

# artist.js — old artist page controller, roderick.js is the V5 replacement
[ -f "public/js/artist.js" ] && rm -v "public/js/artist.js"

# ── Dead V4 CSS ─────────────────────────────────────────────────
echo ""
echo "🎨 Removing dead V4 CSS files..."

# album-info-styles.css — sidebar styles now inline from roderick.js + sidebar config
[ -f "public/css/album-info-styles.css" ] && rm -v "public/css/album-info-styles.css"

# additional-styles.css — V4 catch-all, styles migrated to paint.json/inline
[ -f "public/css/additional-styles.css" ] && rm -v "public/css/additional-styles.css"

# style.css — V4 main stylesheet, replaced by RODUX paint system
[ -f "public/css/style.css" ] && rm -v "public/css/style.css"

# loading-styles.css — V4 loading overlay, preloader.css handles landing
[ -f "public/css/loading-styles.css" ] && rm -v "public/css/loading-styles.css"

# header-layout.css — V4 header CSS, now driven by RatioPosition + paint
[ -f "public/css/header-layout.css" ] && rm -v "public/css/header-layout.css"

# ── Dead V4 config ──────────────────────────────────────────────
echo ""
echo "⚙️  Removing superseded config files..."

# album-info-typography.json — merged into roderick.json sidebar config
[ -f "config/album-info-typography.json" ] && rm -v "config/album-info-typography.json"

# artist.json — old artist page config, roderick.json is the V5 replacement
[ -f "config/pages/artist.json" ] && rm -v "config/pages/artist.json"

# ── Summary ─────────────────────────────────────────────────────
echo ""
echo "=================================================="
echo "✅ Cleanup complete."
echo ""
echo "V5 Active Files:"
echo "  public/roderick.html         — V5 S3 (bare HTML)"
echo "  public/js/roderick.js        — V5 S3 (page controller)"
echo "  public/js/player.js          — V5 S3 (custom player)"
echo "  public/js/InterstellarSystem.js  — RODUX bootstrap"
echo "  public/js/header.js          — header module"
echo "  public/js/paint-applier.js   — cssJSON paint"
echo "  public/js/QuadIntegration.js — QuadTree bridge"
echo "  public/js/auth.js            — auth (Postgres)"
echo "  public/js/cart.js            — cart (Postgres)"
echo "  public/js/landing.js         — landing page"
echo "  config/pages/roderick.json   — V5 S3 page config"
echo "  config/paint.json            — paint tokens"
echo "  config/header.json           — header config"
echo "  config/quadtree.json         — QuadTree config"
echo ""
echo "Dead CSS remaining (other pages may use):"
echo "  public/css/preloader.css     — landing page preloader"
echo "  public/css/landing.css       — landing page"
echo "  public/css/filmography.css   — filmography page"
echo "  public/css/contact.css       — contact page"
echo "  public/css/success-cancel.css — checkout pages"
echo "  public/css/downloads.css     — download experiences"