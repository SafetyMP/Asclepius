import { defineConfig, devices } from '@playwright/test';

const PORT = 3200;
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}${basePath}/`;
const staticDirectory = process.env.PLAYWRIGHT_STATIC_DIR ?? 'out';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 2, // Keep the static preview server below its connection backlog.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `python3 scripts/serve-static.py --port ${PORT} --directory ${staticDirectory}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
