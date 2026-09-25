import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Orden 86 — las pantallas nuevas hacen lo que dicen (25 de septiembre de 2026).
 *
 * Cada prueba mira el RESULTADO que ve la persona, no que la pantalla abra:
 * - la bandeja de salida ofrece mandar por mail y, sin Google, lleva a conectarlo;
 * - las reseñas de Google, sin acceso, lo dicen en criollo y no dejan publicar nada;
 * - el mail del contador se guarda y sigue ahí al recargar;
 * - la firma del portal es una constancia: falta el papel y no hay atajo para reservar.
 */
const DATA = path.join(process.cwd(), 'src', 'data');
const MENSAJES = path.join(DATA, 'scheduled-messages.json');
const EMPRESA = path.join(DATA, 'company-info.json');

const fiesta: any = crearFiestaDeEstaNoche({ id: `e2e_orden86_${Date.now()}` });
fiesta.contratoServicioTexto = 'Contrato de prueba de la orden 86.';
fiesta.firmaDigitalConstancia = {
  signedAt: '2026-09-20T15:00:00.000Z',
  signedBy: 'Ana Constancia Pérez',
  textoHuella: 'a'.repeat(64),
  planPagosAceptado: false,
};
delete fiesta.contratoFirmaInfo;
// La pantalla del contrato pide cliente y presupuesto asignados, como una fiesta de verdad.
fiesta.configuracion = { ...fiesta.configuracion, clienteId: 'cli_e2e_orden86' };
fiesta.presupuestoId = 'pre_e2e_orden86';

let mensajesAntes: string | null = null;
let empresaAntes: string | null = null;

test.beforeAll(() => {
  guardarFiesta(fiesta);
  mensajesAntes = fs.existsSync(MENSAJES) ? fs.readFileSync(MENSAJES, 'utf8') : null;
  empresaAntes = fs.existsSync(EMPRESA) ? fs.readFileSync(EMPRESA, 'utf8') : null;
  // Guardar la ficha pide nombre y RUT (salen en contratos y facturas): la de prueba los trae.
  const empresa = empresaAntes ? JSON.parse(empresaAntes) : {};
  fs.writeFileSync(EMPRESA, JSON.stringify({ ...empresa, companyName: 'AK Producciones', companyTaxId: '210000000019', cuentasBancariasPortal: [] }, null, 2));
  fs.writeFileSync(MENSAJES, JSON.stringify([{
    id: 'msg_orden86_mail',
    targetType: 'cliente',
    targetId: fiesta.id,
    targetName: 'Cliente Mail Orden 86',
    targetPhone: '099123456',
    targetEmail: 'cliente-orden86@ejemplo.com',
    subject: 'Tu fiesta',
    templateType: 'recordatorio_cuota',
    messageText: 'Hola, te recordamos la cuota.',
    scheduledAt: new Date().toISOString(),
    status: 'pendiente',
  }], null, 2));
});

test.afterAll(() => {
  borrarFiesta(fiesta.id);
  if (mensajesAntes === null) fs.rmSync(MENSAJES, { force: true });
  else fs.writeFileSync(MENSAJES, mensajesAntes);
  if (empresaAntes === null) fs.rmSync(EMPRESA, { force: true });
  else fs.writeFileSync(EMPRESA, empresaAntes);
});

test.describe('Orden 86: las pantallas nuevas hacen lo que dicen', () => {
  test.beforeEach(async ({ context }, testInfo) => {
    await ponerSesionDelEquipo(context, testInfo.project.use.baseURL as string);
  });

  test('bandeja de salida: un mensaje con mail ofrece el mail, y sin Google lleva a conectarlo', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/contabilidad/crm/outbox', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Cliente Mail Orden 86').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('cliente-orden86@ejemplo.com').first()).toBeVisible();
    // Sin cuenta de Google en las pruebas: el botón lleva a la pantalla donde se conecta.
    const conectar = page.getByRole('link', { name: /Conectá Google en Ajustes/ }).first();
    await expect(conectar).toBeVisible();
    await expect(conectar).toHaveAttribute('href', '/settings/google-workspace');
  });

  test('reseñas de Google: sin acceso lo dice en criollo y no deja publicar', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/empresa/resenas-google', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Google no tiene habilitado|No se encontraron las credenciales|acceso a las reseñas/i).first())
      .toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: /Publicar respuesta/ })).toHaveCount(0);
  });

  test('el mail del contador se guarda y sigue ahí al recargar', async ({ page }) => {
    test.setTimeout(90_000);
    const mail = `contador-${Date.now()}@estudio.com.uy`;
    await page.goto('/settings/company', { waitUntil: 'domcontentloaded' });
    // Se espera a que la ficha termine de cargar: si se escribe antes, la carga lo pisa.
    await expect(page.locator('#company-name')).not.toHaveValue('', { timeout: 30_000 });
    const campo = page.locator('#email-contador');
    await expect(campo).toBeEditable({ timeout: 30_000 });
    await campo.fill(mail);
    await page.getByRole('button', { name: /Guardar Información/ }).click();
    // Se espera el aviso de guardado: el botón sigue habilitado un instante después del toque.
    await expect(page.getByText('Información Guardada').first()).toBeVisible({ timeout: 20_000 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#email-contador')).toHaveValue(mail, { timeout: 30_000 });
  });

  test('firma del portal: el equipo ve que falta el papel y no hay atajo para confirmar la reserva', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(`/fiestas/nueva/gestion-documental/contrato-servicio?fiestaId=${fiesta.id}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Ana Constancia Pérez firmó en el portal/).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Falta el contrato firmado en papel/).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Confirmar reserva/ })).toHaveCount(0);
  });
});
