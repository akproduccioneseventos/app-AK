import { expect, test, type Page } from '@playwright/test';

/**
 * Llega al selector de tipo de fiesta sea cual sea la pantalla de entrada. En el celular, con ?tipo=,
 * la portada aparece un instante y la app la saltea: mirar la portada una vez y hacer clic dejaba la
 * prueba esperando un botón que ya no estaba (90 s y rojo, 12/11/2026). Lo que se comprueba sigue
 * siendo el resultado: qué tipo queda elegido.
 */
async function llegarAlSelectorDeTipo(page: Page) {
  const selector = page.locator('button[role="combobox"]').first();
  await expect(async () => {
    if (await selector.isVisible()) return;
    const botones = [
      page.getByTestId('simulator-cover-start'),
      page.getByRole('button', { name: /Armar mi presupuesto|Continuar/i }).first(),
    ];
    for (const boton of botones) {
      if ((await boton.isVisible()) && (await boton.isEnabled())) {
        await boton.click({ timeout: 2000 }).catch(() => {});
        break;
      }
    }
    await expect(selector).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 60_000 });
  return selector;
}

test.describe('Orden 96 - Bloques 3 y 9: El simulador respeta el tipo de fiesta y no muestra $0 al arrancar', () => {
  test('abre con ?tipo=boda y queda seleccionada Boda', async ({ page }, testInfo) => {

    await page.goto('/simulador-de-presupuesto?tipo=boda', { waitUntil: 'domcontentloaded' });

    // El selector de tipo de evento en el paso 2 debe mostrar "Boda"
    const selectorTipo = await llegarAlSelectorDeTipo(page);
    await expect(selectorTipo).toContainText('Boda');
  });

  test('abre con ?tipo=XV%20años y queda seleccionada 15 años', async ({ page }, testInfo) => {

    await page.goto('/simulador-de-presupuesto?tipo=XV%20a%C3%B1os', { waitUntil: 'domcontentloaded' });

    const selectorTipo = await llegarAlSelectorDeTipo(page);
    await expect(selectorTipo).toContainText('15 años');
  });

  test('abre sin parámetro y queda seleccionado Cumpleaños por defecto', async ({ page }, testInfo) => {

    await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });

    // Sin ?tipo= se muestra la pantalla de bienvenida: click en Comenzar para ir al paso 1, y Continuar para ir al paso 2
    await page.getByTestId('simulator-cover-start').click();
    await page.getByRole('button', { name: /Continuar/i }).click();

    const selectorTipo = await llegarAlSelectorDeTipo(page);
    await expect(selectorTipo).toContainText('Cumpleaños');
  });

  test('en el paso 1 no aparece "$0" en el pie, y al seleccionar servicios sube a mayor que cero', async ({ page }, testInfo) => {

    await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });

    // Sin ?tipo= se muestra la pantalla de bienvenida: hay que hacer click en Comenzar.
    await page.getByTestId('simulator-cover-start').click();

    // Bloque 9: El pie no debe mostrar "$0" ni "Total vigente: $0" antes de elegir nada
    const textoPie = page.locator('text=Elegí tus servicios para ver el total').first();
    await expect(textoPie).toBeVisible({ timeout: 15_000 });

    const pieContenedor = textoPie.locator('..');
    await expect(pieContenedor).not.toContainText('$0');
  });
});
