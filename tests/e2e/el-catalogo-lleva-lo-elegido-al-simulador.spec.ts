import { expect, test } from '@playwright/test';

/**
 * Orden 277 — Bloque 1:
 * En /catalogo/xv-anos elegir Intermedio, tocar "Crear presupuesto manual"
 * y comprobar que la dirección del simulador tiene `tipo` y `paquete=Intermedio`
 * y que el paso de datos muestra 15 años, no Cumpleaños.
 */

test.describe('Orden 277: Del catálogo al simulador con evento y paquete', () => {
  test('al elegir paquete Intermedio en catálogo xv-anos pasa los datos al simulador', async ({ page }) => {
    test.setTimeout(90_000);

    await page.goto('/catalogo/xv-anos', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 });

    // Ir a la lámina de servicios (índice 4 en SLIDE_ORDER)
    const dotServicios = page.locator('div[aria-label="Progreso del catálogo"] button').nth(4);
    await dotServicios.click();
    await page.waitForTimeout(500);

    // Seleccionar Paquete Intermedio
    const paqueteIntermedio = page.locator('h3', { hasText: 'Paquete Intermedio' }).first();
    await expect(paqueteIntermedio).toBeVisible({ timeout: 15_000 });
    await paqueteIntermedio.click();

    // Ir a la última lámina de cierre (índice 8 en SLIDE_ORDER)
    const dotCierre = page.locator('div[aria-label="Progreso del catálogo"] button').nth(8);
    await dotCierre.click();
    await page.waitForTimeout(500);

    // Tocar "Crear presupuesto manual"
    const btnCrearManual = page.getByRole('button', { name: /Crear presupuesto manual/i });
    await expect(btnCrearManual).toBeVisible({ timeout: 15_000 });
    await btnCrearManual.click();

    // Comprobar que la dirección del simulador tiene `tipo` y `paquete=Intermedio`
    await page.waitForURL(/\/simulador-de-presupuesto/, { timeout: 20_000 });
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/tipo=(15|XV)(%20|\+)A/i);
    expect(currentUrl).toContain('paquete=Intermedio');
    expect(currentUrl).toContain('entry=catalogo-xv-anos');

    // Avanzar de paso 1 a paso 2 (datos del evento)
    const btnContinuar = page.getByRole('button', { name: /Continuar/i });
    await expect(btnContinuar).toBeVisible({ timeout: 20_000 });
    await btnContinuar.click();

    // El paso de datos muestra 15 años, no Cumpleaños
    await expect(page.locator('h2', { hasText: /Ingresá tus datos/i })).toBeVisible({ timeout: 20_000 });
    const selectTrigger = page.locator('button[role="combobox"]').first();
    await expect(selectTrigger).toContainText('15 años');
    await expect(selectTrigger).not.toHaveText(/^(?!.*15 años).*Cumpleaños/);
  });
});
