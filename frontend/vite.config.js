import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Intervalo - Repaso Espaciado',
        short_name: 'Intervalo',
        description: 'Sistema de repaso adaptativo con repetición espaciada',
        theme_color: '#1E1E34',
        background_color: '#1E1E34',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/?source=pwa',
        categories: ['education', 'productivity'],
        screenshots: [],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // Cache static assets (JS, CSS, fonts, images)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,woff2}'],
        // API calls always go to network
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/session') || url.pathname.startsWith('/health'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
