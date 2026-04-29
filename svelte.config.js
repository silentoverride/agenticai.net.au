import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['self'],
        'base-uri': ['self'],
        'object-src': ['none'],
        'frame-ancestors': ['self'],
        'script-src': [
          'self',
          'unsafe-eval',
          'https://dashboard.retellai.com',
          'https://www.google.com',
          'https://www.gstatic.com'
        ],
        'style-src': ['self', 'unsafe-inline'],
        'img-src': ['self', 'data:', 'https:'],
        'font-src': ['self', 'data:'],
        'connect-src': [
          'self',
          'https://dashboard.retellai.com',
          'https://*.retellai.com',
          'https://www.google.com',
          'https://www.gstatic.com'
        ],
        'frame-src': ['https://www.google.com', 'https://www.gstatic.com'],
        'form-action': ['self', 'https://checkout.stripe.com'],
        'upgrade-insecure-requests': true
      }
    }
  }
};

export default config;
