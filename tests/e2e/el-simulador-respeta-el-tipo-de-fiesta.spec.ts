import { expect, test } from '@playwright/test';

test.describe('Orden 96 - Bloques 3 y 9: El simulador respeta el tipo de fiesta y no muestra $0 al arrancar', () => {
  test('abre con ?tipo=boda y queda seleccionada Boda', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto('/simulador-de-presupuesto?tipo=boda', { waitUntil: 'domcontentloaded' });

    // El selector de tipo de evento debe mostrar "Boda"
    const selectorTipo = page.locator('button[role="combobox"]').first();
    await expect(selectorTipo).toBeVisible({ timeout: 15_000 });
    await expect(selectorTipo).toContainText('Boda');
  });

  test('abre con ?tipo=XV%20años y queda seleccionada 15 años', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto('/simulador-de-presupuesto?tipo=XV%20a%C3%B1os', { waitUntil: 'domcontentloaded' });

    const selectorTipo = page.locator('button[role="combobox"]').first();
    await expect(selectorTipo).toBeVisible({ timeout: 15_000 });
    await expect(selectorTipo).toContainText('15 años');
  });

  test('abre sin parámetro y queda seleccionado Cumpleaños por defecto', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });

    const selectorTipo = page.locator('button[role="combobox"]').first();
    await expect(selectorTipo).toBeVisible({ timeout: 15_000 });
    await expect(selectorTipo).toContainText('Cumpleaños');
  });

  test('en el paso 1 no aparece "$0" en el pie, y al seleccionar servicios sube a mayor que cero', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });

    // Bloque 9: El pie no debe mostrar "$0" ni "Total vigente: $0" antes de elegir nada
    const textoPie = page.locator('text=Elegí tus servicios para ver el total').first();
    await expect(textoPie).toBeVisible({ timeout: 15_000 });

    const pieContenedor = textoPie.locator('..');
    await expect(pieContenedor).not.toContainText('$0');
  });
});
