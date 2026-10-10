import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';
import { createPortalSession } from '../../src/lib/security/portal-session';

/**
 * Codex, auditoría 83 (orden 133). Con la constancia digital firmada:
 * - CT83-NOMBRE: la pantalla decía "Firmado Digitalmente" sin el nombre del titular.
 * - CT83-PAPEL: desaparecía el botón de imprimir, y el aviso igual pedía el papel.
 * Adaptada de `docs/evidencias/83-contrato-recorrido.spec.ts` (datos ficticios).
 */
const texto = 'CONTRATO FICTICIO E2E 133. Sin validez ni reserva real. Papel obligatorio.';
const nombre = 'Titular Ficticio Prueba Ciento Treinta y Tres';
const clave = 'clave-ficticia-133';
const creadas: string[] = [];

async function abrirFirmado(page: any, context: any, baseURL: string) {
  const id = `e2e_133_contrato_${crypto.randomUUID()}`;
  creadas.push(id);
  const fiesta: any = crearFiestaDeEstaNoche({ id, clavePortal: clave });
  fiesta.estado = 'Presupuestada';
  fiesta.contratoServicioTexto = texto;
  delete fiesta.contratoFirmaInfo;
  fiesta.contratoDatos = { planPagos: { activo: false } };
  fiesta.firmaDigitalConstancia = {
    signedBy: nombre, signedAt: '2026-10-09T15:00:00.000Z', ip: '203.0.113.9',
    textoHuella: crypto.createHash('sha256').update(texto).digest('hex'),
    planPagosAceptado: false,
  };
  guardarFiesta(fiesta);
  await context.addCookies([{ name: 'ak_portal_session', value: createPortalSession(id, clave),
    url: baseURL, httpOnly: true, sameSite: 'Lax' }]);
  await page.goto(`/portal/${id}/contrato`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Constancia de Firma', { exact: true })).toBeVisible({ timeout: 60_000 });
}

test.afterEach(() => { while (creadas.length) borrarFiesta(creadas.pop()!); });

test('con la constancia firmada se ve el nombre del titular, no la IP', async ({ page, context, baseURL }) => {
  await abrirFirmado(page, context, baseURL!);
  await expect(page.getByText(nombre, { exact: true }).first()).toBeVisible();
  await expect(page.getByText('203.0.113.9')).toHaveCount(0);
});

test('con la constancia firmada sigue el botón de imprimir el papel, y el clic imprime', async ({ page, context, baseURL }) => {
  await page.addInitScript(() => {
    (window as any).__impresiones = 0;
    window.print = () => { (window as any).__impresiones += 1; };
  });
  await abrirFirmado(page, context, baseURL!);
  await expect(page.getByText('Falta el contrato en papel')).toHaveCount(1);
  await page.getByRole('button', { name: /IMPRIMIR.*DESCARGAR CONTRATO/ }).first().click();
  await expect.poll(() => page.evaluate(() => (window as any).__impresiones)).toBe(1);
  // No aparece nada que dé la reserva por confirmada.
  await expect(page.getByRole('button', { name: /confirmar reserva/i })).toHaveCount(0);
});
