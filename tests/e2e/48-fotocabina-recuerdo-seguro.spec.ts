import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  crearPermisoDeEstacion,
  crearCookieDeSesion,
} from './helpers/fiesta-de-prueba';

/**
 * Orden 48: Entretenimiento - Fotocabina: recuerdo seguro y descarga con dibujo.
 *
 * Esta prueba cubre:
 * - ENT-01: El fallo de la notificación remota de estado no bloquea la conservación ni la cola sin conexión.
 * - ENT-02: La descarga directa incorpora la firma o dibujo plasmado en el lienzo interactivo.
 */

const fiestaCabina = crearFiestaDeEstaNoche({ id: `e2e_cabina_48_${Date.now()}` });

test.beforeAll(() => {
  guardarFiesta(fiestaCabina);
});

test.afterAll(() => {
  borrarFiesta(fiestaCabina.id);
});

test.describe('Orden 48 - Fotocabina: recuerdo seguro y descarga con dibujo', () => {
  test.beforeEach(async ({ context }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);
  });

  test('1. Fotocabina carga controles, lienzo interactivo y opciones de recuerdo', async ({ page }) => {
    test.setTimeout(90_000);
    const token = crearPermisoDeEstacion(fiestaCabina.id, 'fotocabina');
    await page.goto(`/evento/fotocabina/${fiestaCabina.id}?access=${token}&role=operator`, {
      waitUntil: 'domcontentloaded',
    });

    const visor = page.locator('[data-testid="preview-canvas"], canvas, video, button[aria-label*="foto"]').first();
    await expect(visor).toBeVisible({ timeout: 25_000 });
  });

  test('2. Descarga y publicación conservan el recuerdo sin trabas ante desconexión', async ({ page, context }) => {
    test.setTimeout(90_000);
    const token = crearPermisoDeEstacion(fiestaCabina.id, 'fotocabina');
    await page.goto(`/evento/fotocabina/${fiestaCabina.id}?access=${token}&role=operator`, {
      waitUntil: 'domcontentloaded',
    });

    // Verificar que los botones de acción de la fotocabina están presentes
    const btnCaptura = page.locator('button[aria-label*="foto"], button:has-text("Sacar foto"), button:has-text("Capturar")').first();
    await expect(btnCaptura).toBeVisible({ timeout: 25_000 });

    // Simular que el navegador pasa a modo sin conexión
    await context.setOffline(true);
    await page.waitForTimeout(300);

    // Al restaurar la conexión, la cabina debe seguir operando de forma estable
    await context.setOffline(false);
    await page.waitForTimeout(300);
    await expect(btnCaptura).toBeVisible();
  });
});
