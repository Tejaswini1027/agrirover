import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

// HTTPS is required so the camera works when the app is opened from a phone
// over the LAN IP — browsers only expose getUserMedia on secure contexts
// (https:// or localhost), so plain http://192.168.x.x silently fails there.
// Set HTTPS=1 to enable it; left off by default so tooling that can't accept
// the self-signed cert can still load the app over http://localhost.
const useHttps = process.env.HTTPS === '1'
export default defineConfig({
  plugins: [react(), tailwindcss(), ...(useHttps ? [basicSsl()] : [])],
  server: {
    port: 5174,
    https: useHttps,
    // Same-origin proxy to the Express/MongoDB backend. Without this, the
    // frontend would need to call the backend's host:port directly, which
    // breaks from a phone in two ways: "localhost" resolves to the phone
    // itself, and an http:// backend call from this https:// page is
    // blocked outright as mixed content.
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
})
