import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { AK_WHATSAPP_NUMBER } from '../../src/lib/public-contact';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

const basePath = '/simulador-de-presupuesto';

test('viaje comercial movil conserva UTM, registra presupuesto y prospecto CRM tras recarga', async ({ page, context }, testInfo) => {
  expect(testInfo.project.name).toBe('chromium-mobile');
  expect(process.env.AK_ENTORNO_AISLADO, 'No ejecutar escrituras fuera de QA ficticio').toBe('true');
  test.setTimeout(180_000);

  const runId = `ak-mobile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const campaign = `facebook-${runId}`;
  const nombre = `QA movil ${runId}`;
  const telefono = `09${Date.now().toString().slice(-7)}`;
  const opened: string[] = [];

  await page.addInitScript(() => {
    (window as any).__akOpened = [];
    window.open = ((url?: string | URL) => {
      (window as any).__akOpened.push(String(url));
      return null;
    }) as typeof window.open;
  });

  await page.goto(`${basePath}?utm_source=facebook&utm_medium=paid_social&utm_campaign=${encodeURIComponent(campaign)}`, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('simulator-cover-start').click();
  const continuar = page.getByRole('button', { name: /Continuar/i });
  await continuar.click();

  await page.locator('#simulator-name').fill(nombre);
  await page.locator('#simulator-phone').fill(telefono);
  await page.getByRole('button', { name: /Locación propia|Locacion propia/i }).first().click();
  await page.getByRole('button', { name: /fecha|Elegí|Seleccion/i }).first().click();
  await page.getByRole('button', { name: /next month|mes siguiente/i }).first().click();
  await page.locator('[role="gridcell"] button:not([disabled])').nth(10).click();
  await continuar.click();

  const mantenerSeleccion = page.getByRole('button', { name: /Mantener mi selección actual/i });
  for (let paso = 0; paso < 2; paso++) {
    if (await mantenerSeleccion.isVisible().catch(() => false)) await mantenerSeleccion.click();
    await expect(continuar, `paso ${paso + 3}`).toBeEnabled({ timeout: 30_000 });
    await continuar.click();
  }
  await mantenerSeleccion.click({ timeout: 30_000 });
  const propuesta = page.getByRole('button', { name: /Ver Resumen y Propuesta|^Generar$/i }).first();
  await expect(propuesta).toBeVisible({ timeout: 30_000 });
  await propuesta.click();
  await expect(page.getByText('Presupuesto registrado con éxito').first()).toBeVisible({ timeout: 90_000 });

  const leerFilas = (nombreArchivo: string) => {
    const porId = new Map<string, any>();
    for (const carpeta of ['data', 'src/data']) {
      const archivo = path.join(process.cwd(), carpeta, nombreArchivo);
      if (!fs.existsSync(archivo)) continue;
      const filas = JSON.parse(fs.readFileSync(archivo, 'utf8'));
      expect(Array.isArray(filas), `Fixture inesperado: ${archivo}`).toBe(true);
      for (const fila of filas) {
        expect(typeof fila.id).toBe('string');
        porId.set(fila.id, fila);
      }
    }
    return [...porId.values()];
  };
  const prospectos = leerFilas('crm-leads.json').filter(f => JSON.stringify(f).includes(nombre));
  expect(prospectos).toHaveLength(1);
  const prospecto = prospectos[0];
  expect(JSON.stringify(prospecto.acquisition)).toContain(campaign);
  expect(prospecto.acquisition?.source).toBe('facebook');
  expect(prospecto.budgetSource).toBe('simulator_common');
  expect(typeof prospecto.presupuestoId).toBe('string');
  const presupuesto = leerFilas('presupuestos.json').find(f => f.id === prospecto.presupuestoId);
  expect(presupuesto, 'Presupuesto persistido vinculado al prospecto').toBeTruthy();

  const pdfButton = page.getByRole('button', { name: /Guardar PDF|Descargar PDF/i }).first();
  await expect(pdfButton).toBeVisible();
  const downloadWait = page.waitForEvent('download');
  await pdfButton.click();
  const download = await downloadWait;
  expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  const pdfPath = testInfo.outputPath('presupuesto-movil.pdf');
  await download.saveAs(pdfPath);
  expect(fs.statSync(pdfPath).size).toBeGreaterThan(5000);
  expect(fs.readFileSync(pdfPath).subarray(0, 4).toString()).toBe('%PDF');
  await testInfo.attach('presupuesto-movil', { path: pdfPath, contentType: 'application/pdf' });

  const shareButton = page.getByRole('button', { name: 'Compartir WhatsApp' }).first();
  await expect(shareButton).toBeVisible();
  await shareButton.click();
  const meetingButton = page.getByRole('button', { name: /Coordinar Reunión/i }).first();
  await expect(meetingButton).toBeVisible();
  await meetingButton.click();
  opened.push(...await page.evaluate(() => (window as any).__akOpened as string[]));
  expect(opened.length).toBeGreaterThanOrEqual(2);
  for (const url of opened) expect(url.startsWith(`https://wa.me/${AK_WHATSAPP_NUMBER}?text=`)).toBeTruthy();

  await testInfo.attach('resumen-movil', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });

  const baseURL = testInfo.project.use.baseURL as string;
  await ponerSesionDelEquipo(context, baseURL);
  await page.goto('/contabilidad/crm', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'CRM de Prospectos' })).toBeVisible({ timeout: 30_000 });
  const mostrarProspecto = async () => {
    const tarjeta = page.getByText(nombre).first();
    if (!await tarjeta.isVisible()) {
      await page.getByRole('heading', { level: 3, name: /Con presupuesto \d+/ }).getByRole('button').click();
    }
    await expect(tarjeta).toBeVisible({ timeout: 30_000 });
  };
  const busqueda = page.getByPlaceholder(/Buscar por nombre, teléfono, salón/i);
  await busqueda.fill(nombre);
  await mostrarProspecto();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder(/Buscar por nombre, teléfono, salón/i).fill(nombre);
  await mostrarProspecto();
  const releido = leerFilas('presupuestos.json').find(f => f.id === prospecto.presupuestoId);
  expect(releido).toEqual(presupuesto);
  expect(leerFilas('crm-leads.json').find(f => f.id === prospecto.id)).toEqual(prospecto);
  await testInfo.attach('crm-movil-recargado', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
});
