import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',

      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],

      manifest: {
        name: 'FaseehVision',
        short_name: 'FaseehVision',
        description: 'Watch and share videos',
        theme_color: '#0f0f0f',
        background_color: '#0f0f0f',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        globIgnores: ['**/*.mp4', '**/*.webm'], // ✅ never precache videos
        navigateFallback: null,                 // ✅ prevents stale page caching
      },
    }),
  ],

  optimizeDeps: {
    include: ['sonner', 'react', 'react-dom'],
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})