import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(), 
    wasm(), 
    topLevelAwait(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Extnd. Second Brain',
        short_name: 'Extnd.',
        description: 'Votre Second Cerveau pour apprendre plus vite.',
        theme_color: '#0d1117',
        background_color: '#0d1117',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 30000000
      }
    })
  ],
  server: {
    port: 5174,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  base: './', // Important for Electron file:// protocol
  optimizeDeps: {
    exclude: ['voy-search', '@huggingface/transformers'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/@tiptap/')) {
            return 'tiptap';
          }
          if (id.includes('node_modules/@phosphor-icons/') || id.includes('node_modules/lucide-react/')) {
            return 'icons';
          }
          if (id.includes('node_modules/react-force-graph') || id.includes('node_modules/d3-force/')) {
            return 'force-graph';
          }
          if (id.includes('node_modules/framer-motion/') || id.includes('node_modules/clsx/') || id.includes('node_modules/tailwind-merge/')) {
            return 'ui';
          }
        }
      }
    }
  }
})
