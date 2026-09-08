// Verifies one-to-many face matching without a camera or face-api.
// Mirrors matchFace() in src/context/AuthContext.jsx.
//
// Run: node tests/faceMatch.test.mjs

const FACE_MATCH_THRESHOLD = 0.45;

function isDescriptor(d) {
    return Array.isArray(d) && d.length === 128 && d.every((n) => typeof n === 'number' && Number.isFinite(n));
}

// Same formula face-api.js's euclideanDistance uses.
function euclideanDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
    return Math.sqrt(sum);
}

function matchFace(scannedDescriptor, users, threshold = FACE_MATCH_THRESHOLD) {
    const hasScan = isDescriptor(scannedDescriptor);
    const candidates = (users || []).filter((u) => isDescriptor(u.faceDescriptor));
    const scored = hasScan
        ? candidates.map((u) => ({ user: u, distance: euclideanDistance(scannedDescriptor, u.faceDescriptor) }))
        : [];
    const best = scored.reduce((acc, cur) => (acc == null || cur.distance < acc.distance ? cur : acc), null);
    const accepted = !!best && best.distance <= threshold;

    if (!hasScan) return { success: false, reason: 'NO_DESCRIPTOR' };
    if (candidates.length === 0) return { success: false, reason: 'NO_USERS' };
    if (!accepted) return { success: false, reason: 'FACE_NOT_RECOGNIZED', distance: best.distance };
    return { success: true, user: best.user, distance: best.distance };
}

// --- synthetic 128-D descriptors -----------------------------------------
// Distinct base vectors per person; a small per-element jitter simulates a
// second capture of the same face (well within threshold), a large offset
// simulates a different person (well outside it).
const mk = (seed) => Array.from({ length: 128 }, (_, i) => Math.sin(seed * 12.9898 + i * 78.233) * 0.5);
const jitter = (v, amt) => v.map((x, i) => x + Math.sin(i * 3.1 + amt) * amt);

const FACE_A = mk(1);
const FACE_B = mk(2);
const FACE_C = mk(3);
const FACE_A_LOGIN = jitter(FACE_A, 0.01); // same person, new scan  -> distance ~0.11
const FACE_B_LOGIN = jitter(FACE_B, 0.01);

const shreyas = { id: 'u1', name: 'Shreyas', faceDescriptor: FACE_A };
const teju = { id: 'u2', name: 'Teju', faceDescriptor: FACE_B };

let fail = 0;
const check = (name, cond, detail = '') => {
    if (!cond) fail++;
    console.log(`  ${cond ? 'PASS' : 'FAIL'} ${name}${detail ? ` -> ${detail}` : ''}`);
};

console.log('=== TEST 1: register Shreyas (Face A), login with Face A ===');
{
    const r = matchFace(FACE_A_LOGIN, [shreyas]);
    check('recognized as Shreyas', r.success && r.user.name === 'Shreyas', `d=${r.distance?.toFixed(3)}`);
}

console.log('=== TEST 2: register Shreyas (Face A), login with different Face B ===');
{
    const r = matchFace(FACE_B_LOGIN, [shreyas]);
    check('login rejected', r.success === false, r.reason);
    check('no user returned', r.user === undefined);
    check('reason is FACE_NOT_RECOGNIZED', r.reason === 'FACE_NOT_RECOGNIZED', `d=${r.distance?.toFixed(3)}`);
}

console.log('=== TEST 3: Shreyas (A) + Teju (B) enrolled ===');
{
    const users = [shreyas, teju];
    const a = matchFace(FACE_A_LOGIN, users);
    check('Face A -> Shreyas', a.success && a.user.name === 'Shreyas', `d=${a.distance?.toFixed(3)}`);
    const b = matchFace(FACE_B_LOGIN, users);
    check('Face B -> Teju', b.success && b.user.name === 'Teju', `d=${b.distance?.toFixed(3)}`);
    const c = matchFace(jitter(FACE_C, 0.01), users);
    check('Face C -> rejected', c.success === false && c.reason === 'FACE_NOT_RECOGNIZED', `d=${c.distance?.toFixed(3)}`);
}

console.log('=== TEST 4: no registered users ===');
{
    const r = matchFace(FACE_A_LOGIN, []);
    check('login rejected', r.success === false);
    check('reason is NO_USERS', r.reason === 'NO_USERS');
}

console.log('=== TEST 5: scan produced no descriptor ===');
{
    const r = matchFace(null, [shreyas]);
    check('login rejected', r.success === false);
    check('reason is NO_DESCRIPTOR', r.reason === 'NO_DESCRIPTOR');
}

console.log('=== TEST 6: login never mutates the enrolled descriptor ===');
{
    const before = JSON.stringify(shreyas.faceDescriptor);
    matchFace(FACE_B_LOGIN, [shreyas]);
    matchFace(FACE_A_LOGIN, [shreyas]);
    check('Shreyas descriptor unchanged', JSON.stringify(shreyas.faceDescriptor) === before);
}

console.log(fail === 0 ? '\nALL PASS' : `\n${fail} FAILURE(S)`);
process.exit(fail === 0 ? 0 : 1);
