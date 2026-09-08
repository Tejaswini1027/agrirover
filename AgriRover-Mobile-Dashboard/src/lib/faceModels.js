import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';
const ACCEPT_THRESHOLD = 0.4; // minimum detector confidence to accept a candidate
// A face has to fill at least this fraction of the frame's area to count as
// "close enough" — small boxes usually mean the person is too far from the
// camera for a reliable embedding.
const MIN_FACE_AREA_RATIO = 0.04;
// Fraction of the detected face box that must fall inside the visible crop.
// Below this the person is genuinely half out of shot.
const MIN_IN_FRAME_RATIO = 0.75;

let loadPromise = null;

const NETS = [
    ['tiny face detector', () => faceapi.nets.tinyFaceDetector, 'tiny_face_detector_model-weights_manifest.json'],
    ['face landmarks', () => faceapi.nets.faceLandmark68Net, 'face_landmark_68_model-weights_manifest.json'],
    ['face recognition', () => faceapi.nets.faceRecognitionNet, 'face_recognition_model-weights_manifest.json'],
];

// Models load once and are cached by the browser; every subsequent probe or
// capture reuses the already-loaded nets.
//
// Loaded sequentially rather than in parallel: the three model files total
// ~6.8MB, and fetching plus decoding them concurrently is a common source of
// failures on mid-range phones. Sequential loading also lets us report which
// model actually failed instead of a single opaque rejection.
// face-api's loadFromUri swallows the underlying cause and throws a generic
// message, which makes a failure on a phone impossible to diagnose. Probing
// the manifest with a plain fetch first turns "it didn't work" into a precise
// reason: wrong status, HTML returned instead of JSON (dev-server SPA
// fallback — i.e. the file isn't actually there), or an outright network/TLS
// failure.
async function diagnoseModelUrl(label, manifestFile) {
    const url = `${MODEL_URL}/${manifestFile}`;
    let res;
    try {
        res = await fetch(url, { cache: 'no-store' });
    } catch (err) {
        throw Object.assign(
            new Error(`Cannot reach ${url} (${err?.message || err}). If you opened this page over https with a self-signed certificate, open ${url} directly once and accept the warning.`),
            { modelLabel: label, kind: 'network' }
        );
    }

    if (!res.ok) {
        throw Object.assign(
            new Error(`${url} returned HTTP ${res.status}. The model files may be missing from /public/models.`),
            { modelLabel: label, kind: 'http' }
        );
    }

    const text = await res.text();
    if (/^\s*</.test(text)) {
        throw Object.assign(
            new Error(`${url} returned HTML instead of JSON — the file is missing and the dev server fell back to index.html.`),
            { modelLabel: label, kind: 'not-found' }
        );
    }
    try {
        JSON.parse(text);
    } catch {
        throw Object.assign(
            new Error(`${url} did not return valid JSON.`),
            { modelLabel: label, kind: 'parse' }
        );
    }
}

async function loadAll() {
    for (const [label, getNet, manifest] of NETS) {
        const net = getNet();
        if (net.isLoaded) continue;

        // Surfaces the real reason before face-api hides it.
        await diagnoseModelUrl(label, manifest);

        try {
            await net.loadFromUri(MODEL_URL);
        } catch (err) {
            const detail = `Failed to load the ${label} model from ${MODEL_URL}: ${err?.message || err}`;
            console.error('[face-auth]', detail, err);
            throw Object.assign(new Error(detail), { modelLabel: label, kind: 'decode' });
        }
        console.info(`[face-auth] loaded ${label} model`);
    }
}

export function loadFaceModels() {
    if (!loadPromise) {
        loadPromise = loadAll().catch((err) => {
            // Reset so a retry can attempt the load again rather than being
            // stuck on a permanently rejected promise.
            loadPromise = null;
            throw err;
        });
    }
    return loadPromise;
}

// True once every net needed for a descriptor is in memory.
export function areModelsLoaded() {
    return NETS.every(([, getNet]) => getNet().isLoaded);
}

export function isVideoReady(videoEl) {
    return !!videoEl && videoEl.readyState >= 2 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0;
}

// Judges a detected face box against the region of the video the user can
// actually SEE.
//
// The scanner renders the stream with object-cover inside a square/circular
// frame, so only a centred square crop of the sensor image is visible.
// Measuring against the full (usually 16:9) frame would tell someone who is
// perfectly centred on screen to "move closer", because the off-screen side
// bands inflate the denominator. Exported so the rules can be unit-tested
// without a camera.
export function judgeFraming(box, vw, vh) {
    const crop = Math.min(vw, vh);
    const cropX = (vw - crop) / 2;
    const cropY = (vh - crop) / 2;

    if ((box.width * box.height) / (crop * crop) < MIN_FACE_AREA_RATIO) {
        return { ok: false, reason: 'too_far' };
    }

    // Demanding the whole box sit inside the crop with a margin is far too
    // strict in practice: at normal webcam distance the detector's box
    // routinely touches the top edge (foreheads get clipped), which rejected
    // every frame of a perfectly usable face. Instead require the face's
    // centre to be inside the visible area and most of its area to be
    // visible — that still rejects a face genuinely half out of shot, while
    // tolerating a clipped forehead or chin, which the descriptor handles fine.
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    if (cx < cropX || cx > cropX + crop || cy < cropY || cy > cropY + crop) {
        return { ok: false, reason: 'partial_frame' };
    }

    const overlapW = Math.max(0, Math.min(box.x + box.width, cropX + crop) - Math.max(box.x, cropX));
    const overlapH = Math.max(0, Math.min(box.y + box.height, cropY + crop) - Math.max(box.y, cropY));
    const visibleRatio = (overlapW * overlapH) / (box.width * box.height);
    if (visibleRatio < MIN_IN_FRAME_RATIO) {
        return { ok: false, reason: 'partial_frame' };
    }

    return { ok: true };
}

// Shared framing rules. Detection alone is never enough to accept a face:
// exactly one face, confidently detected, close enough, and fully inside the
// frame.
function judge(detections, videoEl) {
    if (detections.length === 0) return { ok: false, reason: 'no_face' };
    if (detections.length > 1) return { ok: false, reason: 'multiple_faces' };

    const det = detections[0].detection || detections[0];
    if (det.score < ACCEPT_THRESHOLD) return { ok: false, reason: 'no_face' };

    const framing = judgeFraming(det.box, videoEl.videoWidth, videoEl.videoHeight);
    if (!framing.ok) return framing;

    return { ok: true, score: det.score };
}

// Cheap per-frame check used by the continuous scanning loop: detection only,
// no landmarks and no descriptor. Computing a descriptor every frame is the
// expensive part and would make the loop unusable on a mid-range phone, so
// it is deferred until framing has been stable.
export async function probeFace(videoEl) {
    if (!isVideoReady(videoEl)) return { ok: false, reason: 'no_face' };
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.1 });
    const detections = await faceapi.detectAllFaces(videoEl, options);
    return judge(detections, videoEl);
}

// Full pipeline — run once, only after probeFace has been stable, to produce
// the 128-number embedding. Returns a plain Array (not Float32Array) because
// that is what serialises cleanly to JSON for the API.
//
// Return shape: { ok: true, descriptor } | { ok: false, reason }
// reason: 'no_face' | 'multiple_faces' | 'too_far' | 'partial_frame'
async function captureOnce(videoEl) {
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.1 });
    // NOTE: must be withFaceDescriptors() — plural. The singular
    // withFaceDescriptor() only exists on the detectSingleFace() chain; calling
    // it here is undefined and throws "is not a function".
    const detections = await faceapi.detectAllFaces(videoEl, options).withFaceLandmarks().withFaceDescriptors();

    const verdict = judge(detections, videoEl);
    if (!verdict.ok) return verdict;

    const descriptor = detections[0]?.descriptor;
    if (!descriptor || descriptor.length !== 128) return { ok: false, reason: 'no_face' };

    // face-api returns a Float32Array; convert to a plain Array so it
    // serialises to JSON for the API.
    return { ok: true, descriptor: Array.from(descriptor) };
}

// Produces the 128-number embedding, optionally averaging several samples.
//
// Averaging matters at enrolment: a single frame carries per-frame noise, and
// the stored vector is what every future login is compared against. Averaging
// a few frames pulls it toward the centre of that face's cluster, which
// measurably shrinks the distance to later scans. Login uses a single sample
// for speed — matching a noisy probe against a well-centred enrolment is the
// easier direction.
export async function captureDescriptor(videoEl, { samples = 1 } = {}) {
    if (!isVideoReady(videoEl)) return { ok: false, reason: 'no_face' };

    const collected = [];
    let lastReason = 'no_face';

    for (let i = 0; i < samples; i++) {
        const r = await captureOnce(videoEl);
        if (r.ok) collected.push(r.descriptor);
        else lastReason = r.reason;
        // Small gap so consecutive samples are genuinely different frames.
        if (i < samples - 1) await new Promise((res) => setTimeout(res, 120));
    }

    if (collected.length === 0) return { ok: false, reason: lastReason };

    const mean = new Array(128).fill(0);
    for (const d of collected) {
        for (let i = 0; i < 128; i++) mean[i] += d[i];
    }
    for (let i = 0; i < 128; i++) mean[i] /= collected.length;

    return { ok: true, descriptor: mean, samples: collected.length };
}
