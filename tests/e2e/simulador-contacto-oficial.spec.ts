/**
 * Orden 126 (CONTACT75): los botones de WhatsApp del simulador abren el numero OFICIAL de AK.
 *
 * Mira el RESULTADO: la direccion que recibe `window.open` al tocar "Consultar" y
 * "Compartir WhatsApp" (nada se abre de verdad: se intercepta).
 *
 * IMPORTANTE: esos botones aparecen recien en el paso final, y llegar ahi GENERA un presupuesto y un
 * prospecto reales en el CRM. Por eso corre SOLO en el entorno aislado de la orden 114
 * (`AK_ENTORNO_AISLADO=true`); en cualquier otro se saltea. Nunca contra datos reales.
 */
import { expect, test } from '@playwright/test';
import { AK_WHATSAPP_NUMBER } from '../../src/lib/public-contact';

test('los botones de WhatsApp del simulador abren el numero oficial de AK', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
  test.skip(process.env.AK_ENTORNO_AISLADO !== 'true', 'Genera un presupuesto y un prospecto: solo en el entorno aislado (orden 114).');
  test.setTimeout(180_000);

  await page.addInitScript(() => {
    (window as any).__abiertas = [];
    window.open = ((url?: string | URL) => { (window as any).__abiertas.push(String(url)); return null; }) as typeof window.open;
  });

  await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('simulator-cover-start').click();
  const continuar = page.getByRole('button', { name: /Continuar/i });
  await continuar.click(); // paso 1 -> 2

  // Paso 2: datos minimos
  await page.locator('#simulator-name').fill('Prospecto E2E Contacto');
  await page.locator('#simulator-phone').fill('099123456');
  await page.getByRole('button', { name: /Locación propia|Locacion propia/i }).first().click();
  // Fecha: el selector abre un calendario; se toma un dia habilitado del mes siguiente.
  await page.getByRole('button', { name: /fecha|Elegí|Seleccion/i }).first().click();
  await page.getByRole('button', { name: /next|siguiente|Go to next month/i }).first().click().catch(() => undefined);
  await page.locator('[role="gridcell"] button:not([disabled])').nth(10).click();
  await continuar.click();

  // Pasos 3, 4 y 5: la app elige sola lo recomendado; solo se avanza.
  for (let i = 0; i < 3; i++) {
    await expect(continuar).toBeEnabled({ timeout: 30_000 });
    await continuar.click();
  }

  const consultar = page.getByRole('button', { name: /Coordinar Reunión/i }).first();
  await expect(page.getByText('Presupuesto registrado con éxito').first()).toBeVisible({ timeout: 90_000 });

  await page.getByRole('button', { name: 'Compartir WhatsApp' }).first().click();
  await consultar.click();

  const abiertas: string[] = await page.evaluate(() => (window as any).__abiertas);
  expect(abiertas.length).toBeGreaterThanOrEqual(1);
  const esperado = `https://wa.me/${AK_WHATSAPP_NUMBER}?text=`;
  for (const url of abiertas) {
    expect(url.startsWith(esperado), `abre el numero oficial: ${url}`).toBe(true);
    expect(url).not.toContain('59899123456');
  }
});
