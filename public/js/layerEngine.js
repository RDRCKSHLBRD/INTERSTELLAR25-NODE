// ============================================================================
// public/js/layerEngine.js — V1.1.0
//
// Timer-driven layer animation engine for album cover parallax.
// Reads config from layers.json (via /config/data/layers.json).
// Each layer gets independent sine-wave drift, scale pulse, and
// opacity breathing. All motion parameters come from JSON — the
// engine is album-agnostic.
//
// Usage:
//   const engine = new LayerEngine(container, layerConfig, catalogue);
//   engine.start();
//   engine.stop();   // on page leave
//   engine.destroy(); // full cleanup
//
// RODUX stack: no frameworks, no build steps, CSS is dumb renderer.
// ============================================================================

class LayerEngine {

  /**
   * @param {HTMLElement} container — the element that will hold the layer stack
   * @param {Object} config — the album entry from layers.json (e.g. config["00040101"])
   * @param {string} catalogue — album catalogue number (for image proxy paths)
   */
  constructor(container, config, catalogue) {
    this.container = container;
    this.config = config;
    this.catalogue = catalogue;
    this.layers = config.layers || [];
    this.basePath = config.basePath || `${catalogue}/LAYERS`;
    this.defaultCycle = config.timing?.cycleSec || 24;
    this.easing = config.timing?.easing || 'sine';
    this.objectFit = config.objectFit || 'contain';

    this._rafId = null;
    this._startTime = 0;
    this._running = false;
    this._elements = [];    // { el, layerConf } pairs
    this._loaded = 0;
    this._total = this.layers.length;

    this._build();
  }


  // ── Build the DOM layer stack ─────────────────────────────

  _build() {
    // Container setup
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
    this.container.style.backgroundColor = 'transparent';

    // Clear existing content (single <img> from before)
    this.container.innerHTML = '';

    this.layers.forEach((layerConf, i) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'layer-wrapper';
      wrapper.dataset.layerId = layerConf.id || `layer-${i}`;
      wrapper.style.cssText = `
        position: absolute;
        inset: 0;
        z-index: ${layerConf.z ?? i};
        will-change: transform, opacity;
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      if (layerConf.blendMode && layerConf.blendMode !== 'normal') {
        wrapper.style.mixBlendMode = layerConf.blendMode;
      }

      // Per-layer objectFit override, or album default
      const fit = layerConf.objectFit || this.objectFit;

      const el = document.createElement('img');
      el.src = `/api/image/${this.basePath}/${layerConf.file}`;
      el.alt = '';
      el.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: ${fit};
        display: block;
      `;
      el.onload = () => this._onLayerLoad();
      el.onerror = () => {
        console.warn(`LayerEngine: failed to load ${layerConf.file}`);
        this._onLayerLoad(); // count it anyway so we don't hang
      };

      wrapper.appendChild(el);
      this.container.appendChild(wrapper);

      this._elements.push({ el: wrapper, layerConf });
    });
  }


  // ── Load tracking ─────────────────────────────────────────

  _onLayerLoad() {
    this._loaded++;
    if (this._loaded >= this._total) {
      // All layers loaded — fire custom event
      this.container.dispatchEvent(new CustomEvent('layers-ready'));
      console.log(`🎨 LayerEngine: ${this._total} layers loaded (${this.config.name})`);
    }
  }


  // ── Animation loop ────────────────────────────────────────

  start() {
    if (this._running) return;
    this._running = true;
    this._startTime = performance.now();
    this._tick();
  }

  stop() {
    this._running = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  _tick() {
    if (!this._running) return;

    const now = performance.now();
    const elapsed = (now - this._startTime) / 1000; // seconds

    this._elements.forEach(({ el, layerConf }) => {
      const cycle = layerConf.cycleSec || this.defaultCycle;
      const phase = layerConf.phase || 0;

      // Normalized position in cycle (0-1), offset by phase
      const t = ((elapsed / cycle) + phase) % 1;

      // Sine easing: smooth oscillation -1 to 1
      const wave = Math.sin(t * Math.PI * 2);
      // Cosine for secondary axis (90° offset = more natural 2D drift)
      const waveB = Math.cos(t * Math.PI * 2);

      // ── Drift ──
      const dx = (layerConf.drift?.x || 0) * wave;
      const dy = (layerConf.drift?.y || 0) * waveB;

      // ── Scale ──
      const scaleMin = layerConf.scale?.min ?? 1;
      const scaleMax = layerConf.scale?.max ?? 1;
      const scaleMid = (scaleMin + scaleMax) / 2;
      const scaleAmp = (scaleMax - scaleMin) / 2;
      const scale = scaleMid + scaleAmp * wave;

      // ── Opacity ──
      const opMin = layerConf.opacity?.min ?? 1;
      const opMax = layerConf.opacity?.max ?? 1;
      const opMid = (opMin + opMax) / 2;
      const opAmp = (opMax - opMin) / 2;
      // Use waveB for opacity so it doesn't sync exactly with drift
      const opacity = opMid + opAmp * waveB;

      // ── Rotation (optional) ──
      const maxRot = layerConf.rotation || 0;
      const rotation = maxRot * wave;

      // ── Apply ──
      el.style.transform = `translate(${dx}px, ${dy}px) scale(${scale}) rotate(${rotation}deg)`;
      el.style.opacity = opacity;
    });

    this._rafId = requestAnimationFrame(() => this._tick());
  }


  // ── Cleanup ───────────────────────────────────────────────

  destroy() {
    this.stop();
    this._elements = [];
    this.container.innerHTML = '';
  }
}


// ── Export for module or global use ─────────────────────────
// (album.js is type="module", so we attach to window for now)
window.LayerEngine = LayerEngine;