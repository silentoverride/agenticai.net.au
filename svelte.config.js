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
          'unsafe-inline',
          'unsafe-eval',
          'strict-dynamic',
          'https://dashboard.retellai.com',
          'https://www.google.com',
          'https://www.recaptcha.net',
          'https://www.gstatic.com'
        ],
        'script-src-elem': [
          'self',
          'unsafe-inline',
          'strict-dynamic',
          'https://dashboard.retellai.com',
          'https://www.google.com',
          'https://www.recaptcha.net',
          'https://www.gstatic.com'
        ],
        'style-src': ['self', 'unsafe-inline'],
        'img-src': ['self', 'data:', 'https:'],
        'font-src': ['self', 'data:'],
        'media-src': ['self', 'blob:', 'data:', 'https://api.retellai.com', 'https://*.retellai.com'],
        'connect-src': [
          'self',
          'https://api.retellai.com',
          'https://dashboard.retellai.com',
          'https://*.retellai.com',
          'https://*.livekit.cloud',
          'wss://api.retellai.com',
          'wss://*.retellai.com',
          'wss://*.livekit.cloud',
          'https://www.google.com',
          'https://www.recaptcha.net',
          'https://www.gstatic.com'
        ],
        'worker-src': ['self', 'blob:'],
        'frame-src': ['https://www.google.com', 'https://www.recaptcha.net', 'https://www.gstatic.com'],
        'form-action': ['self', 'https://checkout.stripe.com'],
        'upgrade-insecure-requests': true
      }
    }
  }
};

export default config;
