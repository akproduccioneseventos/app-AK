import { test, expect } from '@playwright/test';

/**
 * Codex, auditoría 92 (PERS92-GEO): "Marcar llegada" del personal pide la ubicación, pero la
 * cabecera de la app decía geolocation=() y el navegador la bloqueaba aunque la persona diera
 * permiso. Se mira lo que manda el servidor y lo que el navegador permite de verdad, con la
 * ubicación nativa de Playwright (sin reemplazar getCurrentPosition).
 *
 * Probado rompiéndolo: con geolocation=() de vuelta en next.config.js, se pone en rojo.
 */
test.use({ geolocation: { latitude: -31.3833, longitude: -57.9667 }, permissions: ['geolocation'] });

test('la app deja pedir la ubicación y el navegador la entrega', async ({ page }) => {
  const respuesta = await page.goto('/acceso-personal/token-de-prueba', { waitUntil: 'domcontentloaded' });
  expect(respuesta?.headers()['permissions-policy']).toContain('geolocation=(self)');

  const resultado = await page.evaluate(
    () =>
      new Promise<{ ok: boolean; lat?: number; error?: string }>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ ok: true, lat: pos.coords.latitude }),
          (err) => resolve({ ok: false, error: err.message }),
          { timeout: 10_000 },
        );
      }),
  );
  expect(resultado.error).toBeUndefined();
  expect(resultado.ok).toBe(true);
  expect(resultado.lat).toBeCloseTo(-31.3833, 3);
});
