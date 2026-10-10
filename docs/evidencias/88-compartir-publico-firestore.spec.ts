/**
 * Codex, auditoría 80 (SHARE80): la barra flotante del presupuesto copiaba la dirección INTERNA,
 * sin token. El cliente que la abría sin cuenta caía en el ingreso. Ahora copia el enlace del
 * cliente (`cliente=1&token=...`), el mismo que arma el botón de la pantalla.
 *
 * La prueba copia el enlace con la sesión del equipo y lo abre en OTRO navegador sin cookies:
 * tiene que ver el presupuesto, no el ingreso.
 */
// @ts-nocheck -- Adaptacion de la semilla JSON a SDK emulado, sin cambios de producto.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import admin from 'firebase-admin';
import { expect, test } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085'
  ||path.dirname(process.cwd())!==path.join(os.tmpdir(),'ak-codex88')) throw new Error('Solo entorno demo reservado');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'share88-'+process.pid);
const db=app.firestore();
const ID = 'e2e-compartir-presupuesto-88-'+process.pid;
const ARCHIVO = path.join(process.cwd(), 'data', 'presupuestos.json');
let anterior: Buffer | null = null;

test.beforeAll(async () => {
  anterior = fs.existsSync(ARCHIVO) ? fs.readFileSync(ARCHIVO) : null;
  let lista: any[] = [];
  try { lista = JSON.parse(fs.readFileSync(ARCHIVO, 'utf8')); } catch { lista = []; }
  if (!Array.isArray(lista)) lista = [];
  lista = lista.filter((p) => p?.id !== ID);
  lista.push({
    id: ID,
    numero: 4322,
    clienteNombre: 'Prospecto E2E Compartir',
    clienteContacto: '099000000',
    eventoTipo: 'Cumpleaños',
    eventoFecha: '2027-02-20T00:00:00.000Z',
    invitadosCantidad: 80,
    salonFiestas: 'A definir',
    itemsPresupuestados: [{
      id: 'item-1', idServicioCatalogo: 'servicio-e2e', nombreServicio: 'Servicio para compartir con el cliente',
      cantidad: 1, precioUnitario: 50_000, precioUnitarioPresupuesto: 50_000, costoTotalItem: 50_000, calculationMethod: 'fijo',
    }],
    costoTotalEstimado: 50_000,
    totalConDescuento: 50_000,
    timestamp: '2026-10-09T12:00:00.000Z',
    estado: 'Pendiente Verificación',
  });
  fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
  fs.writeFileSync(ARCHIVO, JSON.stringify(lista, null, 2), 'utf8');
  await db.collection('presupuestos').doc(ID).set(lista.find(p=>p.id===ID));
});

test.afterAll(async () => {
  await db.collection('presupuestos').doc(ID).delete();
  await app.delete();
  if (anterior === null) fs.rmSync(ARCHIVO, { force: true });
  else fs.writeFileSync(ARCHIVO, anterior);
});

test('copiar en la barra da el enlace del cliente, que abre sin cuenta', async ({ page, context, baseURL, browser }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 640, 'El botón de copiar se muestra desde tablet; en celular se usa Compartir.');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await ponerSesionDelEquipo(context, baseURL);
  await page.goto(`/presupuestos/${ID}/ver`);
  await expect(page.getByText('Servicio para compartir con el cliente').first()).toBeVisible({timeout:60000});
  await page.getByRole('button', { name: 'Copiar enlace del presupuesto' }).click();
  await expect(page.getByText('Enlace copiado').first()).toBeVisible({ timeout: 20_000 });
  const copiado = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiado).toContain(`/presupuestos/${ID}/ver?`);
  expect(copiado).toContain('cliente=1');
  expect(copiado).toMatch(/token=[0-9a-f]{20,}/);

  const otro = await browser.newContext();
  try {
    const cliente = await otro.newPage();
    await cliente.goto(copiado.replace(/^https?:\/\/[^/]+/, baseURL || ''));
    await expect(cliente.getByText('Servicio para compartir con el cliente').first()).toBeVisible({ timeout: 30_000 });
    expect(cliente.url()).not.toMatch(/\/login/);
  } finally {
    await otro.close();
  }
});
