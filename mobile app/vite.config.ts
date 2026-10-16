import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'lucide-react',
      'clsx',
      'tailwind-merge',
    ],
  },
  server: {
    port: 3000,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('pdfjs-dist')) {
              return 'pdfjs';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('@radix-ui')) {
              return 'radix';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
          }
          return undefined;
        },
      },
    },
  },
});
