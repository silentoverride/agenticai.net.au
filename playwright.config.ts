import { defineConfig, devices } from '@playwright/test';

/**
 * Staff Portal Safety Spine E2E configuration.
 * Runs against the Vite dev server. Does not require Clerk or external services.
 *
 * Usage:
 *   npx playwright test --config playwright.config.ts
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: 'list',
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: 'npm run dev -- --port 5173',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
