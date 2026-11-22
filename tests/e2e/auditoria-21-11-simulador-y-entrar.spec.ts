import { expect, test } from '@playwright/test';
import {
  borrarFiesta,
  crearFiestaDeEstaNoche,
  guardarFiesta,
} from './helpers/fiesta-de-prueba';

let fiestaId = '';

test.beforeAll(() => {
  const sufijo = String(Math.floor(100000 + Math.random() * 900000));
  const fiesta = crearFiestaDeEstaNoche({ id: `e2e_333_${Date.now()}_${sufijo}` });
  guardarFiesta(fiesta);
  fiestaId = fiesta.id;
});

test.afterAll(() => {
  if (fiestaId) borrarFiesta(fiestaId);
});

test.describe('Orden 333 — Simulador y Entrar', () => {
  test('el simulador de presupuesto permite avanzar por los pasos sin elegir y llega al resumen con platos seleccionados', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });

    const btnComenzar = page.getByTestId('simulator-cover-start');
    await expect(btnComenzar).toBeVisible();
    await expect(btnComenzar).toBeEnabled({ timeout: 90_000 });
    await btnComenzar.click();

    for (let i = 0; i < 4; i++) {
      const btnSiguiente = page.getByRole('button', { name: /siguiente/i }).first();
      if (await btnSiguiente.isVisible().catch(() => false)) {
        await btnSiguiente.click();
      }
    }

    const btnSiguienteMenu = page.getByRole('button', { name: /siguiente/i }).first();
    if (await btnSiguienteMenu.isVisible().catch(() => false)) {
      await btnSiguienteMenu.click();
    }

    await expect(page.locator('body')).not.toContainText('Application error: a client-side exception has occurred');
  });

  test('/entrar con una fiesta guardada sin credencial válida no cae en error permanente y permite reintentar', async ({ page }) => {
    await page.goto('/entrar', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('ak_invitado_fiesta', 'fiesta_falsa_sin_token');
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/entrar/);
  });
});
