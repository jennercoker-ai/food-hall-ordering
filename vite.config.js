import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    // In development, proxy /api and /ws to the Express backend
    server: {
      port: 3000,
      proxy: {
        '/api': { target: 'http://localhost:3001', changeOrigin: true },
        '/ws':  { target: 'ws://localhost:3001',   ws: true, changeOrigin: true },
      },
    },

    build: {
      outDir: 'dist',
      // Split vendor chunks for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            state:  ['zustand'],
          },
        },
      },
      // Warn if a single chunk exceeds 500 kB
      chunkSizeWarningLimit: 500,
    },

    define: {
      // Expose build-time env vars to the frontend
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },
  };
});
