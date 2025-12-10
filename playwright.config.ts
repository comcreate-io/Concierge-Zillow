import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Timeouts
  timeout: 60 * 1000, // Test timeout: 60s
  expect: {
    timeout: 15 * 1000, // Assertion timeout: 15s
  },

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15 * 1000, // Action timeout: 15s
    navigationTimeout: 60 * 1000, // Navigation timeout: 60s
  },

  outputDir: 'test-results/artifacts',

  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  projects: [
    // Authentication setup project - runs first
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Main test projects (authenticated)
    {
      name: 'chromium',
      testIgnore: /.*\.unauth\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/support/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Firefox - optional, enable for cross-browser testing
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: 'tests/support/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },

    // WebKit - optional, enable for Safari testing
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     storageState: 'tests/support/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },

    // Unauthenticated tests (login page, public pages)
    {
      name: 'unauthenticated',
      testMatch: /.*\.unauth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Local dev server
  webServer: {
    command: 'npm run dev -- --port 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
