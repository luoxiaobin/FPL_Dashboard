import { defineConfig, devices } from '@playwright/test';

const runLiveFplE2e = process.env.RUN_LIVE_FPL_E2E === 'true';
const runFplAuthSetup = process.env.RUN_FPL_AUTH_SETUP === 'true';
const runFplBookmarkletE2e = process.env.RUN_FPL_BOOKMARKLET_E2E === 'true';
const liveBaseURL = process.env.PLAYWRIGHT_LIVE_BASE_URL;
const liveEntryId = process.env.LIVE_FPL_ENTRY_ID;

if (runLiveFplE2e || runFplBookmarkletE2e) {
  if (!liveBaseURL || !URL.canParse(liveBaseURL) || new URL(liveBaseURL).protocol !== 'https:') {
    throw new Error('PLAYWRIGHT_LIVE_BASE_URL must be an absolute HTTPS URL when RUN_LIVE_FPL_E2E=true');
  }
  if (!liveEntryId || !/^\d+$/.test(liveEntryId)) {
    throw new Error('LIVE_FPL_ENTRY_ID must be a positive numeric public FPL entry when RUN_LIVE_FPL_E2E=true');
  }
}

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results/artifacts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [
        ['github'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
      ]
    : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      grepInvert: /@live|@fpl-auth-setup|@fpl-bookmarklet/,
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['iPhone 13'] },
      grepInvert: /@live|@fpl-auth-setup|@fpl-bookmarklet/,
    },
    ...(runLiveFplE2e ? [{
      name: 'live-chromium',
      grep: /@live/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: liveBaseURL,
      },
    }] : []),
    ...(runFplAuthSetup ? [{
      name: 'fpl-auth-setup',
      grep: /@fpl-auth-setup/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://fantasy.premierleague.com',
      },
    }] : []),
    ...(runFplBookmarkletE2e ? [{
      name: 'fpl-bookmarklet',
      grep: /@fpl-bookmarklet/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: liveBaseURL,
        storageState: 'playwright/.auth/fpl.json',
      },
    }] : []),
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/login',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
