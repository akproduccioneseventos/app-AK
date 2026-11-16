import { expect, test } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Orden 277 - Bloque 13 (Devuelta en Orden 298 - Bloque 8):
 * La presentación LED no pierde las entradas elegidas.
 * En /presentacion-led se seleccionan entradas, se avanza hasta el cierre y
 * se toca "Generar Presupuesto Manual", comprobando que la URL lleve
 * entradas= y que las entradas queden marcadas/visibles en la pantalla de crear.
 */

test.describe('Orden 277 - Presentación LED lleva las entradas seleccionadas', () => {
  test('elegir entrada en /presentacion-led y generar presupuesto manual lleva la entrada a crear presupuesto', async ({ context, page }, testInfo) => {
    test.setTimeout(120_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    const baseURL = (testInfo.project.use.baseURL as string) || 'http://127.0.0.1:3100';
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto('/presentacion-led', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(page.getByText(/Cargando presentaci/i)).toBeHidden({ timeout: 60_000 });
    await page.waitForTimeout(500);

    // Empezar propuesta si aparece botón inicial
    const empezarBtn = page.getByRole('button', { name: /Empezar propuesta/i });
    if (await empezarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await empezarBtn.click();
      await page.waitForTimeout(300);
    }

    // Configurar o seleccionar al menos una entrada
    const entradaId = 'entrada-degustacion-especial';
    await page.evaluate((id) => {
      sessionStorage.setItem('presentacion_entradas_seleccionadas', JSON.stringify([id]));
    }, entradaId);

    // Ir directo a la lámina de cierre o avanzar con teclado
    const btnGenerarPresupuesto = page.locator('[data-testid="btn-generar-presupuesto-manual"], button:has-text("Generar Presupuesto Manual")').first();
    for (let i = 0; i < 30; i++) {
      if (await btnGenerarPresupuesto.isVisible({ timeout: 500 }).catch(() => false)) {
        break;
      }
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(200);
    }

    // Si aún no está visible, dar click en siguiente slide
    if (!(await btnGenerarPresupuesto.isVisible().catch(() => false))) {
      const btnSiguiente = page.getByTestId('btn-siguiente-slide');
      for (let i = 0; i < 20; i++) {
        if (await btnGenerarPresupuesto.isVisible().catch(() => false)) break;
        if (await btnSiguiente.isVisible().catch(() => false)) {
          await btnSiguiente.click().catch(() => page.keyboard.press('ArrowRight'));
        } else {
          await page.keyboard.press('ArrowRight');
        }
        await page.waitForTimeout(200);
      }
    }

    await expect(btnGenerarPresupuesto).toBeVisible({ timeout: 15_000 });
    await btnGenerarPresupuesto.scrollIntoViewIfNeeded();
    await btnGenerarPresupuesto.click();

    // Esperar navegación a /presupuestos/nuevo/crear
    await page.waitForURL(/\/presupuestos\/nuevo\/crear/, { timeout: 30_000 });
    const currentUrl = page.url();

    // Comprobar que contenga entradas=
    expect(currentUrl).toContain('entradas=');
    expect(currentUrl).toContain(`entradas=${entradaId}`);

    // Comprobar que en la pantalla de crear presupuesto las entradas queden marcadas / visibles
    await expect(page.getByTestId('entradas-cargadas-banner')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId(`entrada-cargada-${entradaId}`)).toBeVisible({ timeout: 15_000 });
  });
});
