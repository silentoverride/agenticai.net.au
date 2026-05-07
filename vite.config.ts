import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  build: {
    target: 'esnext'
  },
  ssr: {
    noExternal: ['cookie', 'devalue', 'set-cookie-parser', 'clsx', '@sveltejs/kit', '@sveltejs/kit/internal', '@sveltejs/kit/internal/server']
  }
});

