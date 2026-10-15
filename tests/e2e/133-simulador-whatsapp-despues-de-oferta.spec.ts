import { expect, test } from '@playwright/test';
import { AK_WHATSAPP_NUMBER } from '../../src/lib/public-contact';

test('el prospecto puede rechazar la oferta opcional y abrir WhatsApp oficial', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
  test.skip(process.env.AK_ENTORNO_AISLADO !== 'true', 'Guarda presupuesto/lead ficticios: solo QA aislado.');
  test.setTimeout(180_000);

  await page.addInitScript(() => {
    (window as any).__abiertas = [];
    window.open = ((url?: string | URL) => {
      (window as any).__abiertas.push(String(url));
      return null;
    }) as typeof window.open;
  });

  await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('simulator-cover-start').click();
  const continuar = page.getByRole('button', { name: /Continuar/i });
  await continuar.click();

  await page.locator('#simulator-name').fill('Prospecto QA Oferta');
  await page.locator('#simulator-phone').fill('099123457');
  await page.getByRole('button', { name: /Locación propia|Locacion propia/i }).first().click();
  await page.getByRole('button', { name: /fecha|Elegí|Seleccion/i }).first().click();
  await page.getByRole('button', { name: /next|siguiente|Go to next month/i }).first().click().catch(() => undefined);
  await page.locator('[role="gridcell"] button:not([disabled])').nth(10).click();
  await continuar.click();

  const mantenerSeleccion = page.getByRole('button', { name: /Mantener mi selección actual/i });
  for (let paso = 0; paso < 2; paso++) {
    if (await mantenerSeleccion.isVisible().catch(() => false)) await mantenerSeleccion.click();
    await expect(continuar, `el paso ${paso + 3} permite continuar tras resolver una oferta opcional`).toBeEnabled({ timeout: 30_000 });
    await continuar.click();
  }

  await mantenerSeleccion.click({ timeout: 30_000 });
  const verPropuesta = page.getByRole('button', { name: /Ver Resumen y Propuesta/i });
  await expect(verPropuesta).toBeVisible({ timeout: 30_000 });
  await verPropuesta.click();

  const exito = page.getByText('Presupuesto registrado con éxito').first();
  await expect(exito).toBeVisible({ timeout: 90_000 });
  await page.getByRole('button', { name: 'Compartir WhatsApp' }).first().click();
  await page.getByRole('button', { name: /Coordinar Reunión/i }).first().click();

  const abiertas: string[] = await page.evaluate(() => (window as any).__abiertas);
  expect(abiertas.length).toBeGreaterThan(0);
  const esperado = `https://wa.me/${AK_WHATSAPP_NUMBER}?text=`;
  for (const url of abiertas) expect(url.slice(0, esperado.length)).toBe(esperado);
});
