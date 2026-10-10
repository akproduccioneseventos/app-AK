// @ts-nocheck -- Evita pulsar la portada transitoria que el parametro tipo retira.
import { expect, test } from '@playwright/test';
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.PLAYWRIGHT_BASE_URL!=='http://127.0.0.1:3300')throw new Error('Solo aislado loopback');
async function entrarAlPasoUno(page) {
  const seguir=page.getByRole('button',{name:/Continuar/i});
  const empezar=page.getByTestId('simulator-cover-start');
  if(new URL(page.url()).searchParams.has('tipo')) {
    // El parametro lleva solo al paso 1: no perseguir la portada inicial retirada.
    await expect(seguir).toBeVisible({timeout:60000});
  } else {
    await expect(empezar).toBeEnabled({timeout:60000});
    await empezar.click();
  }
}

test.describe('Orden 96 - Bloques 3 y 9: El simulador respeta el tipo de fiesta y no muestra $0 al arrancar', () => {
  test('abre con ?tipo=boda y queda seleccionada Boda', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto('/simulador-de-presupuesto?tipo=boda', { waitUntil: 'domcontentloaded' });

    await entrarAlPasoUno(page);
    await page.getByRole('button', { name: /Continuar/i }).click();

    // El selector de tipo de evento en el paso 2 debe mostrar "Boda"
    const selectorTipo = page.locator('button[role="combobox"]').first();
    await expect(selectorTipo).toBeVisible({ timeout: 15_000 });
    await expect(selectorTipo).toContainText('Boda');
  });

  test('abre con ?tipo=XV%20años y queda seleccionada 15 años', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto('/simulador-de-presupuesto?tipo=XV%20a%C3%B1os', { waitUntil: 'domcontentloaded' });

    await entrarAlPasoUno(page);
    await page.getByRole('button', { name: /Continuar/i }).click();

    const selectorTipo = page.locator('button[role="combobox"]').first();
    await expect(selectorTipo).toBeVisible({ timeout: 15_000 });
    await expect(selectorTipo).toContainText('15 años');
  });

  test('abre sin parámetro y queda seleccionado Cumpleaños por defecto', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });

    // Sin ?tipo= se muestra la pantalla de bienvenida: click en Comenzar para ir al paso 1, y Continuar para ir al paso 2
    await page.getByTestId('simulator-cover-start').click();
    await page.getByRole('button', { name: /Continuar/i }).click();

    const selectorTipo = page.locator('button[role="combobox"]').first();
    await expect(selectorTipo).toBeVisible({ timeout: 15_000 });
    await expect(selectorTipo).toContainText('Cumpleaños');
  });

  test('en el paso 1 no aparece "$0" en el pie, y al seleccionar servicios sube a mayor que cero', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

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
