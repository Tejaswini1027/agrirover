// Mirrors the server-side checks in backend/routes/auth.js — this lets the
// signup wizard block a step with a friendly message immediately, but the
// server is still the source of truth and re-validates everything.

export const PHONE_RE = /^[6-9]\d{9}$/;

export function isValidFullName(value) {
    return typeof value === 'string' && value.trim().length >= 2;
}

export function isValidDOB(value) {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    if (date > now) return false;
    const age = (now - date) / (1000 * 60 * 60 * 24 * 365.25);
    return age >= 10 && age <= 120;
}

export function isValidPhone(value) {
    return typeof value === 'string' && PHONE_RE.test(value.trim());
}

export function isNonEmpty(value) {
    return typeof value === 'string' && value.trim().length > 0;
}
