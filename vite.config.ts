import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { VitePWA } from 'vite-plugin-pwa'

const cspPlugin = () => {
  return {
    name: 'html-transform',
    transformIndexHtml(html: string, { server }: any) {
      const isDev = !!server;
      const csp = isDev 
        // Dev: 'unsafe-eval' is required by Vite HMR; 'unsafe-inline' for hot-reloaded styles.
        ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://*.firebaseapp.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:; img-src 'self' data: blob: safe-file: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com; connect-src 'self' https: wss:; worker-src 'self' blob:; frame-src 'self' https://*.firebaseapp.com https://*.firebaseio.com https://apis.google.com;"
        // Prod: 'unsafe-inline' removed from script-src (error-handler.js is now an external file).
        // connect-src https: is intentionally kept broad — the HuggingFace embedding models are
        // loaded from dynamic CDN URLs that cannot be statically enumerated.
        : "default-src 'self'; script-src 'self' https://apis.google.com https://www.gstatic.com https://*.firebaseapp.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:; img-src 'self' data: blob: safe-file: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com; connect-src 'self' https: wss:; worker-src 'self' blob:; frame-src 'self' https://*.firebaseapp.com https://*.firebaseio.com https://apis.google.com;";
      
      return html.replace(
        '<meta name="csp-placeholder" content="">',
        `<meta http-equiv="Content-Security-Policy" content="${csp}">`
      );
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    }
  },
  define: {
    'process.env': {}
  },
  plugins: [
    cspPlugin(),
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
  },
  base: './', // Important for Electron file:// protocol
  optimizeDeps: {
    force: true, // Forcer Vite à recompiler les dépendances comme anki-apkg-export
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
