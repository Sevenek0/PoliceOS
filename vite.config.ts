import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // W trybie deweloperskim API (dokumenty + dostęp) idzie do serwera produkcyjnego.
    proxy: {
      '/api': { target: 'http://57.131.194.88:8082', changeOrigin: true },
    },
  },
})
