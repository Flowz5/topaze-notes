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
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Topaze Notes',
        short_name: 'Topaze',
        description: 'Base de connaissances connectée',
        theme_color: '#0b2d30',
        icons: [
          {
            src: 'https://vitejs.dev/logo.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
})
