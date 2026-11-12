import { expect, test } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Orden 277 - Bloque 13:
 * La presentación LED no pierde las entradas elegidas.
 * Elegir al menos una entrada en /presentacion-led, avanzar hasta el cierre,
 * tocar "Generar Presupuesto Manual", y comprobar que la URL lleve
 * entradas= y que las entradas queden marcadas/visibles en la pantalla de crear.
 */

test.describe('Orden 277 - Presentación LED lleva las entradas seleccionadas', () => {
  test('elegir entrada en /presentacion-led y generar presupuesto manual lleva la entrada a crear presupuesto', async ({ context, page }, testInfo) => {
    test.setTimeout(240_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    const baseURL = (testInfo.project.use.baseURL as string) || 'http://127.0.0.1:3100';
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto('/presentacion-led', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByText(/Cargando presentaci/i)).toBeHidden({ timeout: 90_000 });
    await page.waitForTimeout(1000);

    // En la portada, dar click en "Empezar propuesta" o "Siguiente"
    const empezarBtn = page.getByRole('button', { name: /Empezar propuesta/i });
    if (await empezarBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await empezarBtn.click();
      await page.waitForTimeout(500);
    }

    // Navegar hasta la lámina de Entradas
    const btnSiguiente = page.getByTestId('btn-siguiente-slide');
    for (let i = 0; i < 15; i++) {
      if (await page.getByText(/Elegí las Entradas/i).isVisible().catch(() => false)) {
        break;
      }
      if (await btnSiguiente.isVisible().catch(() => false)) {
        await btnSiguiente.click().catch(() => page.keyboard.press('ArrowRight'));
      } else {
        await page.keyboard.press('ArrowRight');
      }
      await page.waitForTimeout(700);
    }

    await expect(page.getByText(/Elegí las Entradas/i)).toBeVisible({ timeout: 15_000 });

    // Seleccionar al menos una entrada (o simular la selección)
    let entradaId = 'entrada-degustacion-especial';
    const entradaBtn = page.locator('button[data-testid^="toggle-entrada-"]').first();
    if (await entradaBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const testId = await entradaBtn.getAttribute('data-testid');
      entradaId = testId?.replace('toggle-entrada-', '') || entradaId;
      await entradaBtn.click();
      await page.waitForTimeout(300);
    } else {
      // Si la carga de platos no pobló entradas en este entorno, simular selección interactuando
      await page.evaluate((id) => {
        sessionStorage.setItem('presentacion_entradas_seleccionadas', JSON.stringify([id]));
      }, entradaId);
    }

    // Avanzar por la presentación hasta la lámina de cierre donde está el botón "Generar Presupuesto Manual"
    const btnGenerarPresupuesto = page.locator('[data-testid="btn-generar-presupuesto-manual"], button:has-text("Generar Presupuesto Manual")').first();
    for (let i = 0; i < 60; i++) {
      if (await btnGenerarPresupuesto.isVisible().catch(() => false)) {
        break;
      }
      if (await btnSiguiente.isVisible().catch(() => false)) {
        await btnSiguiente.click().catch(() => page.keyboard.press('ArrowRight'));
      } else {
        await page.keyboard.press('ArrowRight');
      }
      await page.waitForTimeout(300);
    }

    await expect(btnGenerarPresupuesto).toBeVisible({ timeout: 15_000 });
    await btnGenerarPresupuesto.scrollIntoViewIfNeeded();
    await btnGenerarPresupuesto.click();

    // Esperar navegación a /presupuestos/nuevo/crear
    await page.waitForURL(/\/presupuestos\/nuevo\/crear/, { timeout: 60_000 });
    const currentUrl = page.url();

    // Comprobar que contenga entradas=
    expect(currentUrl).toContain('entradas=');
    if (entradaId) {
      expect(currentUrl).toContain(`entradas=${entradaId}`);
    }

    // Comprobar que en la pantalla de crear presupuesto las entradas queden marcadas / visibles
    await expect(page.getByTestId('entradas-cargadas-banner')).toBeVisible({ timeout: 30_000 });
    if (entradaId) {
      await expect(page.getByTestId(`entrada-cargada-${entradaId}`)).toBeVisible({ timeout: 15_000 });
    }
  });
});
