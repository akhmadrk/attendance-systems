import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3100,
    proxy: {
      '/api/v1/attendance': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/v1/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/v1/profile': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
