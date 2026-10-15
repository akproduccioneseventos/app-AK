import { expect, test } from '@playwright/test';
import { AK_WHATSAPP_NUMBER } from '../../src/lib/public-contact';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test('el prospecto puede rechazar la oferta, abrir WhatsApp oficial y aparecer en el CRM', async ({ page, context }, testInfo) => {
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

  const campaign = `ak-audit-${Date.now()}`;
  await page.goto(`/simulador-de-presupuesto?utm_source=facebook&utm_medium=paid_social&utm_campaign=${campaign}`, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('simulator-cover-start').click();
  const continuar = page.getByRole('button', { name: /Continuar/i });
  await continuar.click();

  const nombre = `Prospecto QA ${Date.now()}`;
  const telefono = `09${Date.now().toString().slice(-7)}`;
  await page.locator('#simulator-name').fill(nombre);
  await page.locator('#simulator-phone').fill(telefono);
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

  const baseURL = testInfo.project.use.baseURL as string;
  await ponerSesionDelEquipo(context, baseURL);
  await page.goto('/contabilidad/crm', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'CRM de Prospectos' })).toBeVisible({ timeout: 30_000 });
  const busqueda = page.getByPlaceholder(/Buscar por nombre, teléfono, salón/i);
  await busqueda.fill(nombre);
  await expect(page.getByText(nombre).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Simulador', { exact: true })).toBeVisible();
  await expect(page.getByText('Facebook', { exact: true })).toBeVisible();
});
