import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', timeout: 90_000, expect: { timeout: 25_000 }, fullyParallel: false,
  workers: 1, retries: 0, reporter: [['line'], ['json', { outputFile: process.env.AK_QA_RESULTS }]],
  use: { baseURL: 'http://127.0.0.1:3300', timezoneId: 'America/Montevideo', locale: 'es-UY',
    trace: 'off', video: 'off', screenshot: 'only-on-failure', serviceWorkers: 'block', reducedMotion: 'reduce' },
  projects: [
    { name: 'chromium-desktop', grep: /Chromium desktop/, use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', grep: /Pixel 7/, use: { ...devices['Pixel 7'] } },
  ],
});
