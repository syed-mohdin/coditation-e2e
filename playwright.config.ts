import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from repo root; in CI, variables come from the runner environment.
dotenv.config({ path: path.resolve(__dirname, '.env') });

const isCI = process.env.CI === 'true';

export default defineConfig({
  // All test specs live under projects/
  testDir: './projects',
  testMatch: '**/*.spec.ts',

  // Global timeouts — setup tests do login + multiple API calls + page load,
  // which can approach 30s on a lightly loaded single-node Frappe server.
  timeout: 60_000,
  expect: { timeout: 5_000 },

  // Retry on CI only; fail fast locally
  retries: isCI ? 2 : 0,

  // Keep parallelism sane
  workers: isCI ? 2 : undefined,

  // Always collect these so post-mortem is possible
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],

  // Named playwright projects allow `npm run test:hrms` to target only HRMS
  projects: [
    {
      name: 'hrms-chromium',
      testDir: './projects/hrms/tests',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.HRMS_BASE_URL ?? 'https://hrms.example.com',
      },
    },
    // Uncomment to also run HRMS on Firefox / WebKit
    // {
    //   name: 'hrms-firefox',
    //   testDir: './projects/hrms/tests',
    //   use: { ...devices['Desktop Firefox'], baseURL: process.env.HRMS_BASE_URL },
    // },
    // {
    //   name: 'hrms-webkit',
    //   testDir: './projects/hrms/tests',
    //   use: { ...devices['Desktop Safari'], baseURL: process.env.HRMS_BASE_URL },
    // },
    //
    // Future projects follow the same pattern:
    // {
    //   name: 'collins-chromium',
    //   testDir: './projects/collins/tests',
    //   use: { ...devices['Desktop Chrome'], baseURL: process.env.COLLINS_BASE_URL },
    // },
  ],

  // Output folder for test artifacts
  outputDir: 'test-results',
});
