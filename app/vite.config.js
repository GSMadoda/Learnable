import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The Express backend (../server.js) serves `../public` statically and falls back
// to ../public/index.html for client routes. Building straight into ../public keeps
// the backend untouched: `npm run build` produces the SPA the server already serves.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // `npm run dev` proxies API calls to the running Express server so the SPA
    // works end-to-end in local development without a separate build.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
})
