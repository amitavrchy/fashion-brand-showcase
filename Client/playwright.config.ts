import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 12_000 },
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3003',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: [
    {
      command: 'node --env-file=.env test/browser-server.mjs',
      cwd: path.resolve('../Server'),
      url: 'http://127.0.0.1:4002/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- --port 3003',
      url: 'http://localhost:3003',
      env: { API_URL: 'http://127.0.0.1:4002', NEXT_DIST_DIR: '.next-test' },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
