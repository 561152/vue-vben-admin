import type { PlaywrightTestConfig } from '@playwright/test';

import { devices } from '@playwright/test';

/**
 * Web-Antd 按钮功能测试配置
 */
const config: PlaywrightTestConfig = {
  expect: {
    timeout: 10000,
  },
  forbidOnly: !!process.env.CI,
  outputDir: 'node_modules/.e2e/test-results/',
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  reporter: [
    ['list'],
    ['html', { outputFolder: 'node_modules/.e2e/test-results' }],
  ],
  retries: process.env.CI ? 2 : 0,
  testDir: './__tests__/e2e',
  timeout: 60 * 1000,
  use: {
    actionTimeout: 10000,
    baseURL: 'http://localhost:5666',
    headless: !!process.env.CI,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm dev --port 5666',
    port: 5666,
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
  workers: process.env.CI ? 1 : undefined,
};

export default config;
