import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('codemirror') || id.includes('@codemirror') || id.includes('@lezer')) {
              return 'codemirror';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('react-redux') || id.includes('@reduxjs/toolkit')) {
              return 'react-vendor';
            }
            if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('zod')) {
              return 'forms';
            }
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/auth': 'http://localhost:3000',
      '/problem': 'http://localhost:3000',
      '/code': 'http://localhost:3000'
    }
  }
})