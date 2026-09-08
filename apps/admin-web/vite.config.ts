import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3101,
    proxy: {
      '/api/v1/admin/employees': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/v1/admin/attendances': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/v1/admin/audit-logs': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/api/v1/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3002',
        ws: true,
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
