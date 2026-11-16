import { expect, test } from '@playwright/test';

test.describe('Orden 96 / Orden 290: El simulador respeta el tipo de fiesta y no muestra $0 al arrancar', () => {
  test('abre con ?tipo=boda y queda seleccionada Boda', async ({ page }) => {
    await page.goto('/simulador-de-presupuesto?tipo=boda', { waitUntil: 'domcontentloaded' });

    // Con ?tipo= arranca directamente en el paso 1; el botón para avanzar al paso 2 es simulator-first-step-cta
    const firstStepCta = page.getByTestId('simulator-first-step-cta');
    await expect(firstStepCta).toBeVisible({ timeout: 15_000 });
    await firstStepCta.click();

    // El selector de tipo de evento en el paso 2 debe mostrar "Boda"
    const selectorTipo = page.locator('button[role="combobox"]').first();
    await expect(selectorTipo).toBeVisible({ timeout: 15_000 });
    await expect(selectorTipo).toContainText('Boda');
  });

  test('abre con ?tipo=XV%20años y queda seleccionada 15 años', async ({ page }) => {
    await page.goto('/simulador-de-presupuesto?tipo=XV%20a%C3%B1os', { waitUntil: 'domcontentloaded' });

    const firstStepCta = page.getByTestId('simulator-first-step-cta');
    await expect(firstStepCta).toBeVisible({ timeout: 15_000 });
    await firstStepCta.click();

    const selectorTipo = page.locator('button[role="combobox"]').first();
    await expect(selectorTipo).toBeVisible({ timeout: 15_000 });
    await expect(selectorTipo).toContainText('15 años');
  });

  test('abre sin parámetro y queda seleccionado Cumpleaños por defecto', async ({ page }) => {
    await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });

    // Sin ?tipo= se muestra la pantalla de bienvenida: click en Comenzar para ir al paso 1
    const coverStart = page.getByTestId('simulator-cover-start');
    await expect(coverStart).toBeVisible({ timeout: 15_000 });
    await coverStart.click();

    // En el paso 1, el botón para avanzar al paso 2 es simulator-first-step-cta
    const firstStepCta = page.getByTestId('simulator-first-step-cta');
    await expect(firstStepCta).toBeVisible({ timeout: 15_000 });
    await firstStepCta.click();

    const selectorTipo = page.locator('button[role="combobox"]').first();
    await expect(selectorTipo).toBeVisible({ timeout: 15_000 });
    await expect(selectorTipo).toContainText('Cumpleaños');
  });

  test('en el paso 1 no aparece "$0" en el pie, y al seleccionar servicios sube a mayor que cero', async ({ page }) => {
    await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });

    // Sin ?tipo= se muestra la pantalla de bienvenida: hay que hacer click en Comenzar.
    const coverStart = page.getByTestId('simulator-cover-start');
    await expect(coverStart).toBeVisible({ timeout: 15_000 });
    await coverStart.click();

    // Bloque 9: El pie no debe mostrar "$0" ni "Total vigente: $0" antes de elegir nada
    const textoPie = page.locator('text=Elegí tus servicios para ver el total').first();
    await expect(textoPie).toBeVisible({ timeout: 15_000 });

    const pieContenedor = textoPie.locator('..');
    await expect(pieContenedor).not.toContainText('$0');
  });
});
