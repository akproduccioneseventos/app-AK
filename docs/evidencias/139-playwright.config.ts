import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', timeout: 120_000, expect: { timeout: 20_000 }, workers: 1, retries: 0,
  reporter: [['line'], ['json', { outputFile: process.env.AK_QA_RESULTS }]],
  use: { baseURL: 'http://127.0.0.1:3300', timezoneId: 'America/Montevideo', locale: 'es-UY',
    trace: 'off', video: 'off', screenshot: 'off', serviceWorkers: 'block' },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] } },
  ],
});
