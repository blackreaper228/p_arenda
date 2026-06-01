import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/p_arenda/',
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        test: './test.html',
      },
    },
  },
});
