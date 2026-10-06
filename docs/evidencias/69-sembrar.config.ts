import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '69-sembrar-navegador.spec.ts',
  outputDir: '../../test-results/69-seed',
  workers: 1,
  timeout: 30_000,
  reporter: 'list',
});
