import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
  },
  server: {
    port: 3000,
    proxy: {
      // Optional: allow direct dev on 3000 by proxying API to 4000
      '/accounts': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
