import { defineConfig, devices } from '@playwright/test';

// Runs against the production build, so build first: `npm run build`.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4300',
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1100 } } }
  ],
  webServer: {
    command: 'node e2e/static-server.mjs',
    url: 'http://127.0.0.1:4300/en-US/',
    reuseExistingServer: !process.env['CI']
  }
});
