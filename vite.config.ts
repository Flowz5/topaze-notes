import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  resolve: {
    dedupe: ["yjs", "y-prosemirror", "y-webrtc"]
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { maximumFileSizeToCacheInBytes: 5000000 },
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Topaze Notes',
        short_name: 'Topaze',
        description: 'Base de connaissances connectée',
        theme_color: '#f27f22',
        background_color: '#faf7f3',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      }
    })
  ],
})
