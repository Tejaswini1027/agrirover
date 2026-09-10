import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { useRoverPosition } from '../hooks/useRoverPosition';
import { gps, farm } from '../data/simulation';

/*
 * Realistic 3D satellite Earth for the Overview "Sector A · Live Map" card.
 * Replaces the old flat mini-map / dotted globe with a textured Three.js
 * sphere: NASA "Blue Marble" day imagery, a drifting cloud layer, a blue
 * fresnel atmosphere, a starfield, and sun lighting.
 *
 * GPS: the field/farm origin comes from the app's existing coordinates
 * (`gps` / `farm.home` in src/data/simulation.js) and the Agri Rover marker
 * tracks the live position from useRoverPosition() — the same feed the Field
 * Ops maps use. Nothing here is hardcoded to an unrelated place; swap those
 * sources for real telemetry and the globe follows.
 *
 * Interaction (via OrbitControls): drag / touch-drag to rotate, scroll /
 * pinch to zoom. On open the camera eases in toward the farm location.
 *
 * Performance: DPR capped at 2, render loop pauses when the tab is hidden or
 * the card scrolls out of view, and everything is disposed on unmount. The
 * component itself is lazy-loaded from Overview so three.js stays out of the
 * initial bundle.
 */

const TEX = {
    day: '/textures/earth/earth-daymap.jpg',
    clouds: '/textures/earth/earth-clouds.png',
    normal: '/textures/earth/earth-normal.jpg',
    specular: '/textures/earth/earth-specular.jpg',
};

// lat/lng (degrees) -> point on a sphere of the given radius, matching the
// orientation of an equirectangular Earth texture on THREE.SphereGeometry.
function latLngToVector3(lat, lng, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

// Soft radial dot used for the glowing map pins (as a camera-facing sprite).
function makeGlowTexture(rgb) {
    const s = 64;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, `rgba(${rgb},1)`);
    g.addColorStop(0.25, `rgba(${rgb},0.85)`);
    g.addColorStop(0.6, `rgba(${rgb},0.25)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

function buildMarker(rgb, coreColor) {
    const group = new THREE.Group();
    const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: makeGlowTexture(rgb),
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        })
    );
    glow.scale.setScalar(0.28);
    const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 16, 16),
        new THREE.MeshBasicMaterial({ color: coreColor })
    );
    group.add(glow, core);
    group.userData.glow = glow;
    return group;
}

export default function EarthGlobe({ height = 260 }) {
    const wrapRef = useRef(null);
    const rover = useRoverPosition();
    const roverPosRef = useRef(rover.position);
    roverPosRef.current = rover.position;

    // Imperative handles the rover-tracking effect reaches into.
    const apiRef = useRef(null);

    useEffect(() => {
        const wrap = wrapRef.current;
        if (!wrap) return;
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        renderer.setClearColor(0x05070d, 1);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        wrap.appendChild(renderer.domElement);
        renderer.domElement.style.display = 'block';
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';

        // ---- Earth --------------------------------------------------------
        const EARTH_R = 1;
        const loader = new THREE.TextureLoader();
        const dayMap = loader.load(TEX.day);
        dayMap.colorSpace = THREE.SRGBColorSpace;
        dayMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const normalMap = loader.load(TEX.normal);
        const specularMap = loader.load(TEX.specular);

        const earth = new THREE.Mesh(
            new THREE.SphereGeometry(EARTH_R, 96, 96),
            new THREE.MeshPhongMaterial({
                map: dayMap,
                normalMap,
                normalScale: new THREE.Vector2(0.8, 0.8),
                specularMap,
                specular: new THREE.Color(0x2b3d55),
                shininess: 12,
            })
        );
        scene.add(earth);

        // ---- Clouds -----------------------------------------------------
        const cloudsTex = loader.load(TEX.clouds);
        cloudsTex.colorSpace = THREE.SRGBColorSpace;
        const clouds = new THREE.Mesh(
            new THREE.SphereGeometry(EARTH_R * 1.012, 96, 96),
            new THREE.MeshLambertMaterial({
                map: cloudsTex,
                transparent: true,
                opacity: 0.42,
                depthWrite: false,
            })
        );
        scene.add(clouds);

        // ---- Atmosphere (blue fresnel rim) ----------------------------
        const atmosphere = new THREE.Mesh(
            new THREE.SphereGeometry(EARTH_R * 1.19, 64, 64),
            new THREE.ShaderMaterial({
                transparent: true,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                uniforms: { uColor: { value: new THREE.Color(0x3d8bff) } },
                vertexShader: `
                    varying vec3 vNormal;
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    varying vec3 vNormal;
                    uniform vec3 uColor;
                    void main() {
                        float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.6);
                        gl_FragColor = vec4(uColor, 1.0) * clamp(intensity, 0.0, 1.0);
                    }
                `,
            })
        );
        scene.add(atmosphere);

        // ---- Starfield --------------------------------------------------
        const starGeo = new THREE.BufferGeometry();
        const starCount = 1400;
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            const r = 40 + Math.random() * 30;
            const t = Math.acos(2 * Math.random() - 1);
            const p = 2 * Math.PI * Math.random();
            starPos[i * 3] = r * Math.sin(t) * Math.cos(p);
            starPos[i * 3 + 1] = r * Math.sin(t) * Math.sin(p);
            starPos[i * 3 + 2] = r * Math.cos(t);
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const stars = new THREE.Points(
            starGeo,
            new THREE.PointsMaterial({ color: 0xbcd4ff, size: 0.13, sizeAttenuation: true, transparent: true, opacity: 0.9 })
        );
        scene.add(stars);

        // ---- Lighting -------------------------------------------------
        scene.add(new THREE.AmbientLight(0xffffff, 0.18));
        const sun = new THREE.DirectionalLight(0xfff4e6, 2.4);
        const rim = new THREE.DirectionalLight(0x5b8bff, 0.35);
        rim.position.set(-1, -0.3, -1);
        scene.add(sun, rim);

        // ---- Markers: farm origin + live Agri Rover ------------------
        const markerHeight = 1.015;
        const farmLL = { lat: gps.lat ?? farm.home[0], lng: gps.lng ?? farm.home[1] };
        const farmMarker = buildMarker('255,193,92', 0xffd27a); // amber = fixed field origin
        farmMarker.position.copy(latLngToVector3(farmLL.lat, farmLL.lng, EARTH_R * markerHeight));
        earth.add(farmMarker);

        const roverMarker = buildMarker('158,242,90', 0xdcff9e); // accent green = rover
        const roverRing = new THREE.Mesh(
            new THREE.RingGeometry(0.03, 0.045, 32),
            new THREE.MeshBasicMaterial({ color: 0x9ef25a, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })
        );
        roverMarker.add(roverRing);
        const setRoverLL = (lat, lng) => {
            const p = latLngToVector3(lat, lng, EARTH_R * markerHeight);
            roverMarker.position.copy(p);
            roverRing.lookAt(0, 0, 0); // lie flat against the surface
        };
        setRoverLL(roverPosRef.current.lat, roverPosRef.current.lng);
        earth.add(roverMarker);

        // Subtle surface link farm -> rover.
        const linkMat = new THREE.LineBasicMaterial({ color: 0x9ef25a, transparent: true, opacity: 0.4 });
        let linkLine = new THREE.Line(new THREE.BufferGeometry(), linkMat);
        earth.add(linkLine);
        const rebuildLink = () => {
            const a = latLngToVector3(farmLL.lat, farmLL.lng, 1).normalize();
            const b = roverMarker.position.clone().normalize();
            const pts = [];
            for (let i = 0; i <= 24; i++) {
                const v = a.clone().lerp(b, i / 24).normalize().multiplyScalar(EARTH_R * 1.012);
                pts.push(v);
            }
            linkLine.geometry.dispose();
            linkLine.geometry = new THREE.BufferGeometry().setFromPoints(pts);
        };
        rebuildLink();

        // ---- Camera + controls -------------------------------------
        const focusDir = latLngToVector3(
            (farmLL.lat + roverPosRef.current.lat) / 2,
            (farmLL.lng + roverPosRef.current.lng) / 2,
            1
        ).normalize();
        const NEAR_DIST = 1.9;
        const FAR_DIST = 4.2;
        camera.position.copy(focusDir.clone().multiplyScalar(reduce ? NEAR_DIST : FAR_DIST));

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0, 0);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enablePan = false;
        controls.rotateSpeed = 0.55;
        controls.zoomSpeed = 0.8;
        controls.minDistance = 1.28;
        controls.maxDistance = 6;
        controls.autoRotate = !reduce;
        controls.autoRotateSpeed = 0.28;

        let userInteracted = false;
        const stopAuto = () => {
            userInteracted = true;
            controls.autoRotate = false;
        };
        controls.addEventListener('start', stopAuto);

        // Ease the camera in toward the farm on open.
        let intro = reduce ? 1 : 0;
        const introFrom = FAR_DIST;
        const introTo = NEAR_DIST;

        // ---- Resize ------------------------------------------------
        const resize = () => {
            const r = wrap.getBoundingClientRect();
            const w = Math.max(1, r.width);
            const h = Math.max(1, r.height);
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(wrap);

        // ---- Visibility / offscreen gating ------------------------
        let hidden = document.hidden;
        let onscreen = true;
        const io = new IntersectionObserver(
            ([e]) => { onscreen = e.isIntersecting; kick(); },
            { threshold: 0.01 }
        );
        io.observe(wrap);
        const onVis = () => { hidden = document.hidden; kick(); };
        document.addEventListener('visibilitychange', onVis);

        // ---- Render loop -----------------------------------------
        const clock = new THREE.Clock();
        let raf = 0;
        let running = false;
        const frame = () => {
            if (hidden || !onscreen) { running = false; return; }
            const dt = Math.min(0.05, clock.getDelta());
            const t = clock.elapsedTime;

            if (intro < 1) {
                intro = Math.min(1, intro + dt / 2.2);
                const e = 1 - Math.pow(1 - intro, 3); // ease-out cubic
                const d = introFrom + (introTo - introFrom) * e;
                camera.position.setLength(d);
            }

            clouds.rotation.y += dt * 0.012;
            if (!userInteracted && !reduce) earth.rotation.y += dt * 0.03;
            stars.rotation.y += dt * 0.002;

            // keep the sun roughly camera-side so the focused field stays lit
            sun.position.copy(camera.position).normalize().multiplyScalar(5);
            sun.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.5);

            const pulse = 0.9 + 0.35 * Math.sin(t * 3);
            roverRing.scale.setScalar(pulse);
            roverMarker.userData.glow.material.rotation = 0;
            roverMarker.userData.glow.scale.setScalar(0.26 + 0.05 * Math.sin(t * 3));

            controls.update();
            renderer.render(scene, camera);
            raf = requestAnimationFrame(frame);
        };
        const kick = () => {
            if (!running && !hidden && onscreen) {
                running = true;
                clock.getDelta();
                raf = requestAnimationFrame(frame);
            }
        };
        kick();

        apiRef.current = {
            updateRover(lat, lng) {
                setRoverLL(lat, lng);
                rebuildLink();
                if (!userInteracted && !reduce) {
                    // gently keep the field in view as the rover moves
                    const dir = latLngToVector3((farmLL.lat + lat) / 2, (farmLL.lng + lng) / 2, 1).normalize();
                    focusDir.copy(dir);
                }
                kick();
            },
        };

        return () => {
            apiRef.current = null;
            cancelAnimationFrame(raf);
            ro.disconnect();
            io.disconnect();
            document.removeEventListener('visibilitychange', onVis);
            controls.removeEventListener('start', stopAuto);
            controls.dispose();
            scene.traverse((o) => {
                if (o.geometry) o.geometry.dispose();
                if (o.material) {
                    const m = o.material;
                    (Array.isArray(m) ? m : [m]).forEach((mm) => {
                        Object.values(mm).forEach((v) => v && v.isTexture && v.dispose());
                        mm.dispose();
                    });
                }
            });
            [dayMap, normalMap, specularMap, cloudsTex].forEach((tx) => tx.dispose());
            renderer.dispose();
            if (renderer.domElement.parentNode === wrap) wrap.removeChild(renderer.domElement);
        };
    }, []);

    // Push live rover GPS into the scene without rebuilding it.
    useEffect(() => {
        apiRef.current?.updateRover(rover.position.lat, rover.position.lng);
    }, [rover.position.lat, rover.position.lng]);

    return (
        <div
            className="relative w-full overflow-hidden rounded-2xl border border-line"
            style={{ height, background: 'radial-gradient(120% 120% at 50% 30%, #0b1830 0%, #05080f 60%, #02040a 100%)' }}
        >
            <div ref={wrapRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

            <div className="pointer-events-none absolute left-3 bottom-3 flex flex-col gap-1 text-[10px] font-semibold">
                <span className="flex items-center gap-1.5 text-white/85">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#9ef25a', boxShadow: '0 0 8px #9ef25a' }} />
                    Agri Rover · {rover.position.lat.toFixed(4)}, {rover.position.lng.toFixed(4)}
                </span>
                <span className="flex items-center gap-1.5 text-white/60">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#ffd27a' }} />
                    {farm.name} · {farm.sector}
                </span>
            </div>

            <span className="pointer-events-none absolute right-3 top-3 text-[9px] font-bold uppercase tracking-wider text-white/40">
                Satellite · NASA Blue Marble
            </span>
        </div>
    );
}
