import { useEffect, useRef } from 'react';
import { useRoverPosition } from '../hooks/useRoverPosition';

/*
 * Futuristic GPS globe — a canvas replacement for the old street mini-map in
 * the Overview "Sector A · Live Map" card. Purely a visualisation layer: it
 * reads the rover's live coordinates from useRoverPosition() (same source the
 * Field Ops maps use) and plots a glowing node for it on a slowly rotating
 * dotted sphere. No map library, no tiles, no controls.
 *
 * Performance: one throttled requestAnimationFrame loop (~30fps), ~900 points,
 * pauses when the tab is hidden, and renders a single static frame when the
 * user prefers reduced motion.
 */

// Rough continent boxes [latMin, latMax, lngMin, lngMax] — enough to read as a
// stylised world map without shipping a bitmap.
const LAND = [
    [-35, 37, -18, 52], // Africa
    [34, 71, -11, 40], // Europe
    [3, 78, 40, 150], // Asia
    [8, 72, -168, -52], // North America
    [-56, 13, -82, -34], // South America
    [-45, -10, 112, 154], // Australia
    [59, 84, -73, -11], // Greenland
    [-90, -63, -180, 180], // Antarctica rim
];

function isLand(lat, lng) {
    for (const [a, b, c, d] of LAND) if (lat >= a && lat <= b && lng >= c && lng <= d) return true;
    return false;
}

// Even-area lat/lng point grid, tagged land/ocean.
function buildPoints() {
    const pts = [];
    for (let lat = -84; lat <= 84; lat += 4) {
        const circumference = Math.cos((lat * Math.PI) / 180);
        const count = Math.max(6, Math.round(58 * circumference));
        for (let i = 0; i < count; i++) {
            const lng = -180 + (360 * i) / count;
            pts.push({ lat, lng, land: isLand(lat, lng) });
        }
    }
    return pts;
}

const COL = {
    ocean: [95, 165, 235],
    land: [150, 225, 255],
    limb: '#4fb8ff',
    rover: '#9ef25a',
    nodeA: '#ff5db1',
    nodeB: '#ff9d4d',
    nodeC: '#3fe0d0',
};

// Decorative orbital arcs (unit-circle space): start / control / end, colour.
const ORBITS = [
    { p0: [0.62, -0.78], c: [1.35, -0.15], p1: [0.86, 0.62], col: COL.nodeC },
    { p0: [0.74, -0.66], c: [1.5, 0.35], p1: [0.5, 0.95], col: COL.nodeB },
];

export default function GpsGlobe({ height = 260 }) {
    const wrapRef = useRef(null);
    const canvasRef = useRef(null);
    const rover = useRoverPosition();
    const roverRef = useRef(rover.position);
    roverRef.current = rover.position;

    useEffect(() => {
        const wrap = wrapRef.current;
        const canvas = canvasRef.current;
        if (!wrap || !canvas) return;
        const ctx = canvas.getContext('2d');
        const points = buildPoints();
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        let W = 0, H = 0, dpr = 1;
        const resize = () => {
            const r = wrap.getBoundingClientRect();
            W = Math.max(1, r.width);
            H = Math.max(1, r.height);
            dpr = Math.min(2, window.devicePixelRatio || 1);
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(wrap);

        // Start with the rover's meridian facing the viewer so its marker is
        // visible immediately; the globe then rotates slowly past it.
        let lon0 = (roverRef.current?.lng ?? -30) + 16;
        let raf = 0;
        let last = 0;
        let hidden = document.hidden;
        const onVis = () => {
            hidden = document.hidden;
            if (!hidden && !reduce) {
                last = 0;
                raf = requestAnimationFrame(loop);
            }
        };
        document.addEventListener('visibilitychange', onVis);

        function draw() {
            const cx = W / 2;
            const cy = H / 2;
            const R = Math.min(W, H) / 2 - 10;

            ctx.clearRect(0, 0, W, H);

            // atmospheric outer glow
            const glow = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.5);
            glow.addColorStop(0, 'rgba(60,150,255,0.16)');
            glow.addColorStop(0.6, 'rgba(40,110,220,0.06)');
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, W, H);

            // globe body
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.clip();
            const body = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
            body.addColorStop(0, '#103055');
            body.addColorStop(0.55, '#0a2038');
            body.addColorStop(1, '#051324');
            ctx.fillStyle = body;
            ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

            // dotted sphere (front hemisphere)
            const cosL = Math.cos((lon0 * Math.PI) / 180);
            const sinL = Math.sin((lon0 * Math.PI) / 180);
            for (let k = 0; k < points.length; k++) {
                const p = points[k];
                const phi = (p.lat * Math.PI) / 180;
                const lam = (p.lng * Math.PI) / 180;
                const cp = Math.cos(phi);
                // rotate around Y axis by lon0
                const x = cp * (Math.sin(lam) * cosL - Math.cos(lam) * sinL);
                const z = cp * (Math.sin(lam) * sinL + Math.cos(lam) * cosL);
                if (z <= 0.02) continue; // back hemisphere
                const y = Math.sin(phi);
                const sx = cx + x * R;
                const sy = cy - y * R;
                const limb = Math.min(1, z * 1.7); // fade toward the edge
                const base = p.land ? 1 : 0.3;
                const a = base * (0.35 + 0.65 * limb);
                const c = p.land ? COL.land : COL.ocean;
                ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;
                const s = (p.land ? 1.5 : 0.95) * (0.75 + 0.45 * z);
                ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
            }
            ctx.restore();

            // neon limb
            ctx.save();
            ctx.shadowColor = COL.limb;
            ctx.shadowBlur = 18;
            ctx.strokeStyle = 'rgba(120,205,255,0.9)';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(90,170,255,0.25)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, R + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // decorative orbital signal arcs
            const t = performance.now() / 1000;
            ORBITS.forEach((o, i) => {
                const toS = ([ux, uy]) => [cx + ux * R, cy + uy * R];
                const [x0, y0] = toS(o.p0);
                const [xc, yc] = toS(o.c);
                const [x1, y1] = toS(o.p1);
                ctx.save();
                ctx.strokeStyle = o.col;
                ctx.globalAlpha = 0.5;
                ctx.lineWidth = 1.4;
                ctx.shadowColor = o.col;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.moveTo(x0, y0);
                ctx.quadraticCurveTo(xc, yc, x1, y1);
                ctx.stroke();
                // travelling pulse
                const tt = ((t * 0.35 + i * 0.5) % 1);
                const mx = (1 - tt) * (1 - tt) * x0 + 2 * (1 - tt) * tt * xc + tt * tt * x1;
                const my = (1 - tt) * (1 - tt) * y0 + 2 * (1 - tt) * tt * yc + tt * tt * y1;
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 12;
                ctx.fillStyle = o.col;
                ctx.beginPath();
                ctx.arc(mx, my, 2.6, 0, Math.PI * 2);
                ctx.fill();
                // endpoint nodes
                [[x0, y0], [x1, y1]].forEach(([ex, ey]) => {
                    ctx.beginPath();
                    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            });

            // rover node — projected from live coordinates
            const rp = roverRef.current;
            if (rp && typeof rp.lat === 'number') {
                const phi = (rp.lat * Math.PI) / 180;
                const lam = (rp.lng * Math.PI) / 180;
                const cp = Math.cos(phi);
                const x = cp * (Math.sin(lam) * cosL - Math.cos(lam) * sinL);
                const z = cp * (Math.sin(lam) * sinL + Math.cos(lam) * cosL);
                const y = Math.sin(phi);
                const sx = cx + x * R;
                const sy = cy - y * R;
                const front = z > -0.35;
                if (front) {
                    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
                    ctx.save();
                    ctx.globalAlpha = z > 0 ? 1 : 0.35;
                    // connector to the nearest orbit endpoint, echoing the reference
                    const [ax, ay] = [cx + ORBITS[0].p0[0] * R, cy + ORBITS[0].p0[1] * R];
                    ctx.strokeStyle = COL.rover;
                    ctx.globalAlpha *= 0.5;
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(ax, ay);
                    ctx.stroke();
                    ctx.globalAlpha = z > 0 ? 1 : 0.35;
                    ctx.shadowColor = COL.rover;
                    ctx.shadowBlur = 16;
                    ctx.fillStyle = COL.rover;
                    ctx.beginPath();
                    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.globalAlpha *= 0.5 * pulse;
                    ctx.strokeStyle = COL.rover;
                    ctx.lineWidth = 1.4;
                    ctx.beginPath();
                    ctx.arc(sx, sy, 8 + 5 * pulse, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }

        function loop(ts) {
            if (hidden || reduce) return;
            if (ts - last >= 33) {
                last = ts;
                lon0 = (lon0 + 0.12) % 360; // ~3.6°/s — slow, keeps the rover node in view
                draw();
            }
            raf = requestAnimationFrame(loop);
        }

        draw();
        if (!reduce) raf = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            document.removeEventListener('visibilitychange', onVis);
        };
    }, []);

    return (
        <div
            ref={wrapRef}
            className="relative w-full overflow-hidden rounded-2xl border border-line"
            style={{ height, background: 'radial-gradient(120% 120% at 50% 40%, #071626 0%, #030a14 70%, #02060d 100%)' }}
        >
            <canvas ref={canvasRef} className="absolute inset-0" />
        </div>
    );
}
