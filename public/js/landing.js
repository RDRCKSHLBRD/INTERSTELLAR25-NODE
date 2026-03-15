// ============================================================================
// public/js/landing.js — V6.2
//
// One continuous scene:
//   - Starfield: canvas, stars moving outward from center (forward travel)
//   - Comms: thin vertical bars spawning from depth, growing, sweeping past
//   - Artist nav: SVG links floating on top
//
// All animation on requestAnimationFrame. No CSS animation phases.
// ============================================================================

const BAR_COLORS = [
    '#231f20', '#adaaa1', '#3d3c38',
    '#d9e0cd', '#8c9a9b', '#9da2a5',
    '#2b7f8c', '#1D4450', '#cadbda'
];

// ════════════════════════════════════════════════════
// STARFIELD — canvas, forward travel
// Stars originate at center, drift outward, accelerate,
// fade in as they approach, fade out at edges.
// ════════════════════════════════════════════════════

function initStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w, h, cx, cy;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        cx = w / 2;
        cy = h / 2;
    }
    resize();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });

    // Star pool
    const STAR_COUNT = 400;
    const stars = [];

    function makeStar(fromCenter) {
        // Angle from center
        const angle = Math.random() * Math.PI * 2;
        // Start distance: if fromCenter, start near center; otherwise random
        const startDist = fromCenter ? Math.random() * 30 : Math.random() * Math.max(w, h) * 0.7;

        return {
            angle: angle,
            dist: startDist,
            speed: 0.15 + Math.random() * 0.4,   // base outward speed
            size: 0.3 + Math.random() * 1.5,
            maxSize: 0.5 + Math.random() * 2.0,
            brightness: 0.3 + Math.random() * 0.7,
            twinkleSpeed: 1 + Math.random() * 3,
            twinklePhase: Math.random() * Math.PI * 2,
        };
    }

    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push(makeStar(false));
    }

    const maxDist = Math.sqrt(cx * cx + cy * cy) * 1.2;

    function drawStars(time) {
        ctx.clearRect(0, 0, w, h);

        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];

            // Move outward — accelerate with distance (parallax)
            s.dist += s.speed * (1 + s.dist * 0.003);

            // Reset when off screen
            if (s.dist > maxDist) {
                stars[i] = makeStar(true);
                continue;
            }

            // Position
            const x = cx + Math.cos(s.angle) * s.dist;
            const y = cy + Math.sin(s.angle) * s.dist;

            // Skip if off canvas
            if (x < -10 || x > w + 10 || y < -10 || y > h + 10) continue;

            // Size grows with distance (closer = bigger)
            const distRatio = s.dist / maxDist;
            const size = s.size + distRatio * s.maxSize;

            // Opacity: fade in from center, full in middle, slight fade at edge
            let alpha = s.brightness;
            if (distRatio < 0.05) {
                alpha *= distRatio / 0.05; // fade in from center
            } else if (distRatio > 0.85) {
                alpha *= (1 - distRatio) / 0.15; // fade at edges
            }

            // Twinkle
            const twinkle = 0.7 + 0.3 * Math.sin(time * 0.001 * s.twinkleSpeed + s.twinklePhase);
            alpha *= twinkle;

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(202, 219, 218, ${alpha.toFixed(3)})`;
            ctx.fill();

            // Near stars get a subtle streak (motion blur effect)
            if (distRatio > 0.6 && size > 1.2) {
                const streakLen = distRatio * 3;
                const sx = x - Math.cos(s.angle) * streakLen;
                const sy = y - Math.sin(s.angle) * streakLen;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(x, y);
                ctx.strokeStyle = `rgba(202, 219, 218, ${(alpha * 0.3).toFixed(3)})`;
                ctx.lineWidth = size * 0.5;
                ctx.stroke();
            }
        }
    }

    return drawStars;
}


// ════════════════════════════════════════════════════
// COMMS — thin bars from deep space
// Continuous spawning. Each bar starts as a tiny sliver
// at a random position near center, grows, drifts toward
// viewer, sweeps past and fades.
// ════════════════════════════════════════════════════

function initComms() {
    const canvas = document.getElementById('commsCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w, h, cx, cy;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        cx = w / 2;
        cy = h / 2;
    }
    resize();

    window.addEventListener('resize', () => {
        clearTimeout(resize._t);
        resize._t = setTimeout(resize, 150);
    });

    const bars = [];
    const MAX_BARS = 8;

    function spawnBar() {
        // Spawn near center with slight offset
        const xOff = (Math.random() - 0.5) * w * 0.3;
        const yOff = (Math.random() - 0.5) * h * 0.15;

        bars.push({
            x: cx + xOff,
            y: cy + yOff,
            width: 0.5 + Math.random() * 1.5,    // starts very thin
            height: 8 + Math.random() * 20,        // starts short
            maxWidth: 2 + Math.random() * 4,
            maxHeight: 80 + Math.random() * 200,
            color: BAR_COLORS[Math.floor(Math.random() * BAR_COLORS.length)],
            age: 0,
            lifespan: 4000 + Math.random() * 3000, // 4–7 seconds to cross
            speed: 0.3 + Math.random() * 0.5,
            drift: (Math.random() - 0.5) * 0.2,    // slight horizontal drift
            opacity: 0,
        });
    }

    // Spawn interval
    let lastSpawn = 0;
    const SPAWN_INTERVAL = 800 + Math.random() * 1200;

    function drawBars(time, dt) {
        ctx.clearRect(0, 0, w, h);

        // Spawn new bars
        lastSpawn += dt;
        if (lastSpawn > SPAWN_INTERVAL && bars.length < MAX_BARS) {
            spawnBar();
            lastSpawn = 0;
        }

        for (let i = bars.length - 1; i >= 0; i--) {
            const b = bars[i];
            b.age += dt;

            const life = b.age / b.lifespan; // 0 → 1

            if (life > 1) {
                bars.splice(i, 1);
                continue;
            }

            // Growth curve: starts tiny, grows, then expands rapidly as it passes
            const growCurve = life < 0.6
                ? life / 0.6                          // 0→1 over first 60%
                : 1 + (life - 0.6) / 0.4 * 3;        // 1→4 over last 40% (sweep past)

            const bw = b.width + growCurve * b.maxWidth;
            const bh = b.height + growCurve * b.maxHeight;

            // Position: drift slightly outward from center
            const drift = life * b.speed * 200;
            const dirX = (b.x - cx) / (Math.abs(b.x - cx) + 1);
            const dirY = (b.y - cy) / (Math.abs(b.y - cy) + 1);
            const drawX = b.x + dirX * drift + b.drift * drift;
            const drawY = b.y + dirY * drift * 0.3 - life * 40; // slight upward drift

            // Opacity: fade in, hold, fade out rapidly at end
            let alpha;
            if (life < 0.1) {
                alpha = life / 0.1;             // fade in
            } else if (life < 0.65) {
                alpha = 1;                       // hold
            } else {
                alpha = (1 - life) / 0.35;      // fade out as it sweeps past
            }
            alpha *= 0.6; // keep them somewhat translucent

            // Blur effect via multiple draws at slight offsets (fake glow)
            ctx.save();
            ctx.globalAlpha = alpha * 0.15;
            ctx.fillStyle = b.color;
            ctx.fillRect(drawX - bw * 1.5, drawY - bh / 2, bw * 3, bh);

            ctx.globalAlpha = alpha * 0.4;
            ctx.fillRect(drawX - bw * 0.8, drawY - bh / 2, bw * 1.6, bh);

            ctx.globalAlpha = alpha;
            ctx.fillRect(drawX - bw / 2, drawY - bh / 2, bw, bh);
            ctx.restore();
        }
    }

    // Seed a couple bars immediately so it's not empty
    spawnBar();
    setTimeout(spawnBar, 400);
    setTimeout(spawnBar, 900);

    return drawBars;
}


// ════════════════════════════════════════════════════
// ARTIST NAV
// ════════════════════════════════════════════════════

async function initArtistNav() {
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
            setTimeout(() => link.classList.add('visible'), 800 + i * 200);
        });

        if (logo) {
            setTimeout(() => logo.classList.add('visible'), 800 + links.length * 200 + 400);
        }

    } catch (err) {
        console.error('Failed to load artists:', err);
    }
}


// ════════════════════════════════════════════════════
// MAIN LOOP
// ════════════════════════════════════════════════════

(function () {
    const drawStars = initStarfield();
    const drawBars = initComms();

    let lastTime = performance.now();
    let frameId;

    function frame(time) {
        const dt = time - lastTime;
        lastTime = time;

        if (drawStars) drawStars(time);
        if (drawBars) drawBars(time, dt);

        frameId = requestAnimationFrame(frame);
    }

    frameId = requestAnimationFrame(frame);

    // Pause when tab not visible — save battery/CPU
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(frameId);
        } else {
            lastTime = performance.now();
            frameId = requestAnimationFrame(frame);
        }
    });

    // Artist nav — appears on top
    initArtistNav();
})();