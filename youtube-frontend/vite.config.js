import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  optimizeDeps: {
    include: ['sonner', 'react', 'react-dom'],   // Force these to be optimized together
  },

  resolve: {
    dedupe: ['react', 'react-dom'],   // This is the key for duplicate React issues
  },
})