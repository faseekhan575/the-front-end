import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'masked-icon.svg',
      ],

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
    src: '/for.jpeg',
    sizes: '512x512',
    type: 'image/jpeg',
  },
  {
    src: '/for-maskable.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'any maskable',
  },
]
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },

      // Custom service worker for push notifications
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
    }),
  ],

  // ✅ your original React + dependency fix config (kept)
  optimizeDeps: {
    include: ['sonner', 'react', 'react-dom'],
  },

  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})