// Empty string -> requests go to the same origin the page was loaded from
// (e.g. https://<lan-ip>:5174/api/...), which Vite's dev proxy forwards to
// the backend. This is what makes login/signup work from a phone: a
// hardcoded 'http://localhost:5000' would point at the phone itself, not
// the PC, and a cross-origin http:// call from an https:// page would also
// be blocked by the browser as mixed content.
export const API_URL = import.meta.env.VITE_API_URL || '';
