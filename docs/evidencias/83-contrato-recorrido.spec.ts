import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, leerFiesta } from './helpers/fiesta-de-prueba';
import { createPortalSession } from '../../src/lib/security/portal-session';

// Copiar esta sonda a tests/e2e SOLO en la copia temporal aislada.
const texto = 'CONTRATO FICTICIO E2E 83. Sin validez ni reserva real. Papel obligatorio.';
const nombre = 'Titular Ficticio Prueba Ochenta Tres';
const clave = 'clave-ficticia-83';
const creadas: string[] = [];

async function preparar(page: any, context: any, baseURL: string, firmado = false) {
  if (baseURL !== 'http://127.0.0.1:3300' || process.env.AK_ENTORNO_AISLADO !== 'true') {
    throw new Error('Solo se prueba contrato ficticio en entorno aislado.');
  }
  const id = `e2e_83_contrato_${crypto.randomUUID()}`;
  creadas.push(id);
  const fiesta: any = crearFiestaDeEstaNoche({ id, clavePortal: clave });
  fiesta.estado = 'Presupuestada';
  fiesta.contratoServicioTexto = texto;
  delete fiesta.contratoFirmaInfo;
  delete fiesta.firmaDigitalConstancia;
  fiesta.contratoDatos = { planPagos: { activo: false } };
  if (firmado) fiesta.firmaDigitalConstancia = {
    signedBy: nombre, signedAt: '2026-10-09T15:00:00.000Z',
    textoHuella: crypto.createHash('sha256').update(texto).digest('hex'),
    planPagosAceptado: false,
  };
  guardarFiesta(fiesta);
  await context.addCookies([{ name: 'ak_portal_session', value: createPortalSession(id, clave),
    url: baseURL, httpOnly: true, sameSite: 'Lax' }]);
  await page.goto(`/portal/${id}/contrato`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Contrato de Servicio', exact: true })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(texto, { exact: true })).toBeVisible();
  return id;
}

test.afterEach(() => { while (creadas.length) borrarFiesta(creadas.pop()!); });

test('constancia guarda nombre y huella, persiste y NO contrata ni registra papel', async ({ page, context, baseURL }) => {
  const id = await preparar(page, context, baseURL!);
  const boton = page.getByRole('button', { name: /Dejar Constancia de Firma Digital/i });
  await expect(boton).toBeDisabled();
  await page.getByLabel(/Tu nombre completo/i).fill(nombre);
  await page.getByLabel(/He le.do y acepto/i).check();
  await expect(boton).toBeEnabled();
  await boton.click();
  await expect(page.getByText('Constancia de Firma', { exact: true })).toBeVisible({ timeout: 30_000 });
  const guardada = leerFiesta(id);
  expect(guardada.firmaDigitalConstancia.signedBy).toBe(nombre);
  expect(guardada.firmaDigitalConstancia.textoHuella).toBe(crypto.createHash('sha256').update(texto).digest('hex'));
  expect(guardada.contratoFirmaInfo?.isSigned).not.toBe(true);
  expect(guardada.estado).toBe('Presupuestada');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Constancia de Firma', { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: /Dejar Constancia/i })).toHaveCount(0);
});

test('despues de constancia el nombre del titular se ve en su contrato', async ({ page, context, baseURL }, info) => {
  await preparar(page, context, baseURL!, true);
  await expect(page.getByText('Constancia de Firma', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('83-contrato-constancia.png'), fullPage: true });
  await expect(page.getByText(nombre, { exact: true })).toBeVisible();
});

test('despues de constancia sigue disponible imprimir el papel obligatorio', async ({ page, context, baseURL }) => {
  await preparar(page, context, baseURL!, true);
  await expect(page.getByText(/Para confirmar tu reserva falta firmar el contrato en papel/)).toBeVisible();
  await expect(page.getByRole('button', { name: /IMPRIMIR.*DESCARGAR CONTRATO/ })).toBeVisible();
});

test('si se corta la firma no inventa constancia y permite reintentar sin perder nombre', async ({ page, context, baseURL }) => {
  const id = await preparar(page, context, baseURL!);
  await page.getByLabel(/Tu nombre completo/i).fill(nombre);
  await page.getByLabel(/He le.do y acepto/i).check();
  let cortada = false;
  await page.route('**/*', async (route: any) => {
    const request = route.request();
    if (!cortada && request.method() === 'POST' && request.postData()?.includes(nombre)) {
      cortada = true;
      await route.abort('failed');
    } else await route.continue();
  });
  const boton = page.getByRole('button', { name: /Dejar Constancia/i });
  await boton.click();
  await expect(page.getByText('No pudimos registrar tu firma', { exact: true })).toBeVisible();
  expect(cortada).toBe(true);
  await expect(boton).toBeEnabled();
  await expect(page.getByLabel(/Tu nombre completo/i)).toHaveValue(nombre);
  expect(leerFiesta(id).firmaDigitalConstancia).toBeUndefined();
});
