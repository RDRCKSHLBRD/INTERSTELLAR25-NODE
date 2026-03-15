// ============================================================================
// public/js/landing.js — V6 (Starfield + Artist SVG Nav)
//
// Procedural SVG starfield with three depth layers, drift, twinkle,
// and shooting stars. Loads artist name SVGs from artists.json.
// ============================================================================

// ════════════════════════════════════════════════════
// STARFIELD
// ════════════════════════════════════════════════════

(function () {
    const svg = document.getElementById('starfield');
    if (!svg) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');

    // Deterministic seed
    let seed = 42;
    function rand() {
        seed = (seed * 16807 + 0) % 2147483647;
        return seed / 2147483647;
    }

    const layers = [
        { count: 280, rMin: 0.3, rMax: 0.8, opacity: 0.12, drift: 120, cls: 'far'  },
        { count: 140, rMin: 0.5, rMax: 1.2, opacity: 0.30, drift: 80,  cls: 'mid'  },
        { count: 45,  rMin: 0.8, rMax: 1.8, opacity: 0.65, drift: 45,  cls: 'near' },
    ];

    layers.forEach((layer) => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', layer.cls);

        for (let i = 0; i < layer.count; i++) {
            const cx = rand() * w;
            const cy = rand() * h;
            const r  = layer.rMin + rand() * (layer.rMax - layer.rMin);

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', cx.toFixed(1));
            circle.setAttribute('cy', cy.toFixed(1));
            circle.setAttribute('r',  r.toFixed(2));
            circle.setAttribute('fill', '#cadbda');
            circle.setAttribute('opacity', (layer.opacity * (0.5 + rand() * 0.5)).toFixed(3));

            // Twinkle
            if (rand() > 0.6) {
                const dur = (3 + rand() * 6).toFixed(1);
                const delay = (rand() * 8).toFixed(1);
                const minO = (layer.opacity * 0.2).toFixed(3);
                const maxO = (layer.opacity * (0.7 + rand() * 0.3)).toFixed(3);

                const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                anim.setAttribute('attributeName', 'opacity');
                anim.setAttribute('values', `${maxO};${minO};${maxO}`);
                anim.setAttribute('dur', `${dur}s`);
                anim.setAttribute('begin', `${delay}s`);
                anim.setAttribute('repeatCount', 'indefinite');
                circle.appendChild(anim);
            }

            g.appendChild(circle);
        }

        // Slow drift
        const driftX = (rand() - 0.5) * layer.drift;
        const driftY = (rand() - 0.5) * layer.drift * 0.6;
        const dur = (60 + rand() * 40).toFixed(0);

        const animTransform = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        animTransform.setAttribute('attributeName', 'transform');
        animTransform.setAttribute('type', 'translate');
        animTransform.setAttribute('values', `0,0; ${driftX.toFixed(1)},${driftY.toFixed(1)}; 0,0`);
        animTransform.setAttribute('dur', `${dur}s`);
        animTransform.setAttribute('repeatCount', 'indefinite');
        g.appendChild(animTransform);

        svg.appendChild(g);
    });

    // Shooting stars
    function shootingStar() {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const startX = Math.random() * w * 0.8;
        const startY = Math.random() * h * 0.4;
        const len = 60 + Math.random() * 120;
        const angle = 0.3 + Math.random() * 0.4;

        line.setAttribute('x1', startX);
        line.setAttribute('y1', startY);
        line.setAttribute('x2', startX + len * Math.cos(angle));
        line.setAttribute('y2', startY + len * Math.sin(angle));
        line.setAttribute('stroke', '#cadbda');
        line.setAttribute('stroke-width', '0.8');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('opacity', '0');

        const animOpacity = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animOpacity.setAttribute('attributeName', 'opacity');
        animOpacity.setAttribute('values', '0;0.7;0.7;0');
        animOpacity.setAttribute('dur', '1.2s');
        animOpacity.setAttribute('fill', 'freeze');
        line.appendChild(animOpacity);

        const trail = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        trail.setAttribute('attributeName', 'transform');
        trail.setAttribute('type', 'translate');
        trail.setAttribute('from', '0 0');
        trail.setAttribute('to', `${(len * 0.5).toFixed(0)} ${(len * 0.3).toFixed(0)}`);
        trail.setAttribute('dur', '1.2s');
        trail.setAttribute('fill', 'freeze');
        line.appendChild(trail);

        svg.appendChild(line);
        setTimeout(() => line.remove(), 1400);
    }

    function scheduleShootingStar() {
        const delay = 4000 + Math.random() * 8000;
        setTimeout(() => {
            shootingStar();
            scheduleShootingStar();
        }, delay);
    }
    scheduleShootingStar();

    // Resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
        }, 200);
    });
})();

// ════════════════════════════════════════════════════
// ARTIST NAV — loads SVGs from artists.json
// ════════════════════════════════════════════════════

(async function () {
    const nav = document.getElementById('artistNav');
    const logo = document.getElementById('ipLogo');
    if (!nav) return;

    try {
        const res = await fetch('/config/data/artists.json');
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        const artists = (data.artists || []).sort((a, b) => (a.order || 0) - (b.order || 0));

        artists.forEach((artist) => {
            const a = document.createElement('a');
            a.href = `/${artist.page || artist.id + '.html'}`;
            a.className = 'artist-link';
            a.dataset.artistId = artist.id;

            if (artist.svg) {
                const img = document.createElement('img');
                img.src = artist.svg;
                img.alt = artist.name;
                img.draggable = false;
                a.appendChild(img);
            } else {
                a.textContent = artist.name;
                a.className += ' artist-link--text';
            }

            nav.appendChild(a);
        });

        // Staggered reveal
        const links = nav.querySelectorAll('.artist-link');
        links.forEach((link, i) => {
            setTimeout(() => {
                link.classList.add('visible');
            }, 600 + i * 200);
        });

        // Reveal logo after all artists
        if (logo) {
            setTimeout(() => {
                logo.classList.add('visible');
            }, 600 + links.length * 200 + 400);
        }

    } catch (err) {
        console.error('Failed to load artists:', err);
    }
})();