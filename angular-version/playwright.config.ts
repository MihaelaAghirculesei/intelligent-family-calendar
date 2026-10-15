import { defineConfig, devices } from '@playwright/test';

// Runs against the production build, so build first: `npm run build`.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // The Windows builds of WebKit and Firefox crash when many run at once.
  workers: process.platform === 'win32' ? 2 : undefined,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4300',
    trace: 'on-first-retry'
  },
  // The three engines on a desktop screen, and the touch tests on a phone
  // with Chrome's and Safari's engines (Firefox has no phone emulation).
  projects: [
    ...(['Desktop Chrome', 'Desktop Firefox', 'Desktop Safari'] as const).map(device => ({
      name: devices[device].defaultBrowserType,
      testIgnore: 'touch.spec.ts',
      use: { ...devices[device], viewport: { width: 1440, height: 1100 } },
      // Several headless Firefox windows at once crash its compositor on
      // Windows; on Linux, as in CI, they run in parallel without trouble.
      ...(device === 'Desktop Firefox' && process.platform === 'win32' ? { workers: 1 } : {})
    })),
    { name: 'phone-chromium', testMatch: 'touch.spec.ts', use: devices['Pixel 7'] },
    { name: 'phone-webkit', testMatch: 'touch.spec.ts', use: devices['iPhone 14'] }
  ],
  webServer: {
    command: 'node e2e/static-server.mjs',
    url: 'http://127.0.0.1:4300/en-US/',
    reuseExistingServer: !process.env['CI']
  }
});
