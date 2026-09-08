import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as faceapi from 'face-api.js';

/*
 * Client-side face authentication.
 *
 * There is no auth backend in this project — enrolment and login both run
 * entirely in the browser against face-api.js embeddings kept in
 * localStorage. The rule this module enforces:
 *
 *   FACE DETECTED  ≠  USER AUTHENTICATED
 *
 * A login only succeeds when a freshly scanned 128-D descriptor is within a
 * strict distance of a *specific* registered user's stored descriptor. No
 * face match → the login is rejected. The scanned descriptor is never
 * written back over anyone's enrolment.
 */

// ---------------------------------------------------------------------------
// Matching threshold
// ---------------------------------------------------------------------------
// face-api.js's FaceRecognitionNet emits an L2-normalised 128-D embedding.
// Euclidean distance between two of them is ~0.0 for the identical image,
// roughly 0.2–0.45 for two photos of the *same* person, and ~0.6–1.2 for
// *different* people. face-api's own `FaceMatcher` uses 0.6 as its default
// cut-off; we deliberately use a stricter value so a stranger who lands
// around ~0.5 is still refused. Enrolment averages several frames
// (see captureDescriptor), which tightens the same-person spread and makes
// this strict threshold comfortable to hit for the real user.
//
// Raise toward 0.5–0.55 only if a legitimate user is rejected under very
// different lighting; do not raise it just to make an unknown face pass.
export const FACE_MATCH_THRESHOLD = 0.45;

const USERS_KEY = 'agv-users-v1'; // array of enrolled users (with descriptors)
const SESSION_KEY = 'agv-session-uid'; // id of the currently signed-in user

const AuthContext = createContext(null);

// ---------------------------------------------------------------------------
// Storage helpers — each enrolled user has their OWN descriptor. There is no
// single "global" face descriptor anywhere.
// ---------------------------------------------------------------------------
function readUsers() {
    try {
        const parsed = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeUsers(users) {
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (err) {
        console.error('[face-auth] could not persist users:', err);
    }
}

function newId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function isDescriptor(d) {
    return Array.isArray(d) && d.length === 128 && d.every((n) => typeof n === 'number' && Number.isFinite(n));
}

// What the rest of the app is allowed to see. The raw biometric descriptor
// is stripped so it never reaches a component, prop, or the DOM.
function publicUser(u) {
    if (!u) return null;
    const { faceDescriptor, ...safe } = u; // eslint-disable-line no-unused-vars
    return safe;
}

// ---------------------------------------------------------------------------
// One-to-many face matching
// ---------------------------------------------------------------------------
// Returns a discriminated result and NEVER returns a user unless
// `success === true`. There is no "return the first user" fallback.
//
//   { success: true,  user, distance }
//   { success: false, reason: 'NO_DESCRIPTOR' | 'NO_USERS' | 'FACE_NOT_RECOGNIZED', distance? }
export function matchFace(scannedDescriptor, users, threshold = FACE_MATCH_THRESHOLD) {
    const hasScan = isDescriptor(scannedDescriptor);

    const candidates = (users || []).filter((u) => isDescriptor(u.faceDescriptor));
    const scored = hasScan
        ? candidates.map((u) => ({
              user: u,
              distance: faceapi.euclideanDistance(scannedDescriptor, u.faceDescriptor),
          }))
        : [];

    // Pick the single closest enrolled user (one-to-many).
    const best = scored.reduce(
        (acc, cur) => (acc == null || cur.distance < acc.distance ? cur : acc),
        null
    );

    const accepted = !!best && best.distance <= threshold;

    // Dev-only diagnostics. Distances and names only — never the descriptors.
    if (import.meta.env.DEV) {
        console.groupCollapsed('[face-auth] login attempt');
        console.log('scanned face descriptor generated:', hasScan);
        console.log('number of registered users:', candidates.length);
        console.log('best matching user:', best ? best.user.name : '(none)');
        console.log('best distance:', best ? best.distance.toFixed(4) : 'n/a');
        console.log('configured threshold:', threshold);
        if (scored.length) {
            console.log(
                'all distances:',
                scored
                    .slice()
                    .sort((a, b) => a.distance - b.distance)
                    .map((s) => `${s.user.name}: ${s.distance.toFixed(4)}`)
            );
        }
        console.log('match accepted:', accepted);
        console.groupEnd();
    }

    if (!hasScan) return { success: false, reason: 'NO_DESCRIPTOR' };
    if (candidates.length === 0) return { success: false, reason: 'NO_USERS' };
    if (!accepted) return { success: false, reason: 'FACE_NOT_RECOGNIZED', distance: best.distance };
    return { success: true, user: best.user, distance: best.distance };
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);

    // Restore an existing session by id. This reads the stored user; it does
    // not touch their descriptor.
    useEffect(() => {
        try {
            const uid = localStorage.getItem(SESSION_KEY);
            if (uid) {
                const found = readUsers().find((u) => u.id === uid);
                if (found) setUser(publicUser(found));
                else localStorage.removeItem(SESSION_KEY);
            }
        } finally {
            setChecking(false);
        }
    }, []);

    // Sign up / explicit re-registration — the ONLY place a face descriptor
    // is ever created or replaced.
    const signup = useCallback(async (profile) => {
        const descriptor = profile?.faceDescriptor;
        if (!isDescriptor(descriptor)) {
            throw new Error('Face capture is incomplete. Please scan your face again.');
        }

        const users = readUsers();

        // Don't let the same face enrol twice under a new name.
        const existing = matchFace(descriptor, users);
        if (existing.success) {
            throw new Error(`This face is already registered to ${existing.user.name}.`);
        }

        const record = {
            id: newId(),
            name: String(profile.fullName || profile.name || 'Farmer').trim() || 'Farmer',
            // Registered biometric. Written here and nowhere else.
            faceDescriptor: descriptor.map(Number),
            profile: {
                dateOfBirth: profile.dateOfBirth || '',
                gender: profile.gender || '',
                location: profile.location || null,
                contact: profile.contact || null,
                farmerProfile: profile.farmerProfile || null,
                aadhaarLast4: profile.aadhaarLast4 || '',
                onboarding: profile.onboarding || null,
            },
            createdAt: new Date().toISOString(),
        };

        writeUsers([...users, record]);
        localStorage.setItem(SESSION_KEY, record.id);
        setUser(publicUser(record));
    }, []);

    // Log in — READ-ONLY with respect to enrolled biometric data.
    const login = useCallback(async (scannedDescriptor) => {
        const users = readUsers();
        const result = matchFace(scannedDescriptor, users);

        if (!result.success) {
            if (result.reason === 'NO_USERS') {
                throw new Error('No registered face found. Please sign up first.');
            }
            // FACE_NOT_RECOGNIZED or NO_DESCRIPTOR
            throw new Error('Face not recognized. No matching account found.');
        }

        // Authenticate the matched user. We intentionally do NOT write
        // `scannedDescriptor` back onto result.user — the enrolment stays
        // exactly as it was registered.
        localStorage.setItem(SESSION_KEY, result.user.id);
        setUser(publicUser(result.user));
        return { success: true, user: publicUser(result.user) };
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({ user, isAuthenticated: !!user, checking, signup, login, logout }),
        [user, checking, signup, login, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
