import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Frontend fetches use the shared API_BASE ("/api" by default).
      // In dev this forwards to the FastAPI backend on :8000.
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    // Same proxy for `vite preview` so the production bundle is testable
    // locally without setting VITE_API_BASE.
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
})
