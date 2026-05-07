import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  ssr: {
    noExternal: [/^@clerk\//, 'cookie', 'devalue', 'set-cookie-parser', 'clsx']
  }
});

