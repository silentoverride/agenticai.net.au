import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, 'src/lib')
    }
  },
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules'],
    testTimeout: 60_000,
    hookTimeout: 120_000
  },
  esbuild: {
    target: 'es2022'
  }
});
