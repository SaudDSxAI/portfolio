import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // /api/projects, /api/projects/refresh → FastAPI (keep path as-is)
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Legacy endpoints that don't have the /api prefix
      '/chat': { target: 'http://localhost:8000', changeOrigin: true },
      '/session': { target: 'http://localhost:8000', changeOrigin: true },
      '/health': { target: 'http://localhost:8000', changeOrigin: true },
      '/generate-cv': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
