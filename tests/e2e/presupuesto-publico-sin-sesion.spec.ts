/**
 * Codex, auditoria 78 (orden 128 B): el cliente abria el enlace de su presupuesto (el del PDF)
 * sin cuenta del equipo y veia "Presupuesto no encontrado". La pantalla pedia la ficha privada
 * de la empresa junto con el presupuesto; esa lectura rechazaba al que no tiene sesion y se
 * llevaba puesto el presupuesto, que si se podia leer con el enlace.
 *
 * Esta prueba abre el enlace SIN sesion y mira lo que ve el cliente: el presupuesto, sin los
 * botones del equipo. Con el enlace alterado, no se ve.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const SECRETO = 'playwright-session-secret-with-enough-entropy';
const ID = 'e2e-presupuesto-publico';
const ARCHIVO = path.join(process.cwd(), 'data', 'presupuestos.json');
let anterior: Buffer | null = null;

const tokenDelPdf = (id: string) =>
  crypto.createHmac('sha256', SECRETO).update(`budget-token:${id}`).digest('hex');

test.beforeAll(() => {
  anterior = fs.existsSync(ARCHIVO) ? fs.readFileSync(ARCHIVO) : null;
  fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
  fs.writeFileSync(ARCHIVO, JSON.stringify([{
    id: ID,
    numero: 4321,
    clienteNombre: 'Familia Ficticia',
    clienteContacto: '099000000',
    eventoTipo: 'Cumpleaños',
    eventoFecha: '2027-01-23T00:00:00.000Z',
    invitadosCantidad: 100,
    salonFiestas: 'A definir',
    itemsPresupuestados: [{
      id: 'item-1',
      idServicioCatalogo: 'servicio-e2e',
      nombreServicio: 'Servicio de prueba para el cliente',
      cantidad: 1,
      precioUnitario: 100_000,
      precioUnitarioPresupuesto: 100_000,
      costoTotalItem: 100_000,
      calculationMethod: 'fijo',
    }],
    costoTotalEstimado: 100_000,
    totalConDescuento: 100_000,
    timestamp: '2026-10-07T12:00:00.000Z',
    estado: 'Pendiente Verificación',
  }], null, 2), 'utf8');
});

test.afterAll(() => {
  if (anterior === null) fs.rmSync(ARCHIVO, { force: true });
  else fs.writeFileSync(ARCHIVO, anterior);
});

test('el cliente abre su presupuesto con el enlace del PDF, sin cuenta del equipo', async ({ page, context }) => {
  await context.clearCookies();
  await page.goto(`/presupuestos/${ID}/ver?cliente=1&token=${tokenDelPdf(ID)}`);

  await expect(page.getByText('Servicio de prueba para el cliente').first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Presupuesto no encontrado')).toHaveCount(0);
  await expect(page.getByText('Este enlace no abre el presupuesto')).toHaveCount(0);
  // Lo del equipo no aparece para el cliente.
  await expect(page.getByRole('button', { name: /crear fiesta/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /aprobar/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /editar/i })).toHaveCount(0);
});

test('con el enlace alterado no se ve el presupuesto', async ({ page, context }) => {
  await context.clearCookies();
  const alterado = tokenDelPdf(ID).replace(/^./, (c) => (c === 'a' ? 'b' : 'a'));
  await page.goto(`/presupuestos/${ID}/ver?cliente=1&token=${alterado}`);

  await expect(page.getByText('Este enlace no abre el presupuesto')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Servicio de prueba para el cliente')).toHaveCount(0);
});
