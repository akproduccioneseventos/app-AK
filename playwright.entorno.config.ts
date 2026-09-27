import { defineConfig } from '@playwright/test';

/**
 * Sólo siembra los datos del entorno de pruebas aislado (`npm run entorno:pruebas`). No abre
 * navegador ni servidor: corre `scripts/entorno-de-pruebas/*.sembrar.ts` con el cargador de
 * Playwright, que entiende TypeScript y los atajos `@/`, para reusar la misma fiesta de las pruebas.
 */
export default defineConfig({
  testDir: 'scripts/entorno-de-pruebas',
  testMatch: '*.sembrar.ts',
  reporter: 'line',
  workers: 1,
});
