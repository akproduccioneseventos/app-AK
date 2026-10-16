import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', timeout: 60_000, expect: { timeout: 20_000 }, workers: 1, retries: 0,
  reporter: [['line'], ['json', { outputFile: process.env.AK_QA_RESULTS }]],
  use: { baseURL: 'http://127.0.0.1:3300', locale: 'es-UY', serviceWorkers: 'block', trace: 'off', video: 'off' },
  projects: [
    { name: 'chromium-utc', use: { ...devices['Desktop Chrome'], timezoneId: 'UTC' } },
    { name: 'chromium-uy', use: { ...devices['Desktop Chrome'], timezoneId: 'America/Montevideo' } },
  ],
});
