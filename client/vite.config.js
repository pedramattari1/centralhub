import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Local dev proxies /api to the Express server on :3001, so the client can call
// same-origin /api paths and CORS is a non-issue in development.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
