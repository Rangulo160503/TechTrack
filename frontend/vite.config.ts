import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // 0.0.0.0 — reachable from iPhone/other devices on the same WiFi
    port: 5173,
    strictPort: true,
    // Cloudflare Quick Tunnel / ngrok send Host: *.trycloudflare.com (Vite 6+ blocks unknown hosts).
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', '.ngrok.io', '.loca.lt'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5176',
        changeOrigin: true,
      },
      '/hubs': {
        target: 'http://127.0.0.1:5176',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
