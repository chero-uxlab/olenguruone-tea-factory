import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: false,
    watch: null,
  },
  build: {
    base: './',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        index1: resolve(__dirname, 'index-1.html'),
        paysubmit: resolve(__dirname, 'pay$submit.html'),
        product: resolve(__dirname, 'product.html'),
        view: resolve(__dirname, 'view.html'),
      },
    },
  },
});
