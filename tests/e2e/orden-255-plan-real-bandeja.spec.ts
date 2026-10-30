import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

const presupuestoId = `e2e_plan_255_${crypto.randomUUID()}`;
const nombre = `Cliente ficticio ${presupuestoId}`;
const telefono = `09${String(parseInt(crypto.createHash('sha256').update(presupuestoId).digest('hex').slice(0, 8), 16) % 10000000).padStart(7, '0')}`;
const carpetas = ['data', 'src/data'];

function leer(archivo: string, carpeta = 'data'): Record<string, any>[] {
  const ruta = path.join(process.cwd(), carpeta, archivo);
  if (!fs.existsSync(ruta)) return [];
  const datos = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  if (!Array.isArray(datos)) throw new Error(`La lista ${archivo} no tiene el formato esperado.`);
  return datos;
}

test.beforeEach(() => {
  const presupuesto = {
    id: presupuestoId, clienteNombre: nombre, clienteContacto: telefono,
    eventoTipo: 'Boda', eventoFecha: '2030-10-20', invitadosCantidad: 80,
    salonFiestas: 'Salon ficticio QA', itemsPresupuestados: [], costoTotalEstimado: 100,
    timestamp: new Date().toISOString(), estado: 'Enviado',
  };
  for (const carpeta of carpetas) {
    const ruta = path.join(process.cwd(), carpeta, 'presupuestos.json');
    fs.mkdirSync(path.dirname(ruta), { recursive: true });
    fs.writeFileSync(ruta, JSON.stringify([...leer('presupuestos.json', carpeta), presupuesto], null, 2));
  }
});

test.afterEach(() => {
  const ids = new Set(carpetas.flatMap(carpeta => leer('asistente-propuestas.json', carpeta))
    .filter(item => JSON.stringify(item).includes(presupuestoId)).map(item => item.id));
  for (const carpeta of carpetas) {
    for (const archivo of ['presupuestos.json', 'asistente-propuestas.json', 'scheduled-messages.json', 'ia-aprendizaje.json']) {
      const ruta = path.join(process.cwd(), carpeta, archivo);
      if (!fs.existsSync(ruta)) continue;
      const datos = leer(archivo, carpeta);
      const restantes = datos.filter(item => !JSON.stringify(item).includes(presupuestoId)
        && !ids.has(item.id) && !ids.has(item.propuestaId));
      if (restantes.length !== datos.length) fs.writeFileSync(ruta, JSON.stringify(restantes, null, 2));
    }
  }
});

test('aprobar el plan guarda un solo borrador manual y conserva el presupuesto', async ({ context, page, baseURL }, testInfo) => {
  test.setTimeout(120000);
  await ponerSesionDelEquipo(context, baseURL);
  let ventanasExternas = 0;
  page.on('popup', () => { ventanasExternas++; });
  const presupuestoOriginal = leer('presupuestos.json').find(item => item.id === presupuestoId);

  await page.goto('/centro-de-control', { waitUntil: 'domcontentloaded' });
  const pedido = page.getByPlaceholder(/Por ejemplo: "armale la web/);
  await expect(pedido).toBeVisible();
  await pedido.fill(`Prepara seguimiento del presupuesto del cliente "${nombre}"`);
  await page.getByRole('button', { name: 'Pedir a la IA', exact: true }).click();

  const titulo = `Revisar seguimiento de presupuesto: ${nombre}`;
  const encabezado = page.getByRole('heading', { level: 3, name: titulo, exact: true });
  await expect(encabezado).toBeVisible();
  const tarjeta = page.locator('div').filter({ has: encabezado })
    .filter({ has: page.getByRole('button', { name: 'Sí, hacelo', exact: true }) }).last();
  await expect(tarjeta).toContainText('No se envía ni se agenda');
  expect(leer('scheduled-messages.json').filter(item => item.presupuestoId === presupuestoId)).toHaveLength(0);
  await page.screenshot({ path: testInfo.outputPath('plan-pendiente.png'), fullPage: true });
  await tarjeta.getByRole('button', { name: 'Sí, hacelo', exact: true }).click();

  await expect.poll(() => leer('scheduled-messages.json').filter(item => item.presupuestoId === presupuestoId)).toHaveLength(1);
  const mensaje = leer('scheduled-messages.json').find(item => item.presupuestoId === presupuestoId)!;
  expect(mensaje).toMatchObject({ status: 'pendiente', sendingMode: 'manual_click', targetPhone: telefono });
  expect(mensaje.messageText).toContain(nombre);
  const propuesta = leer('asistente-propuestas.json').find(item => item.accion?.data?.borrador?.presupuestoId === presupuestoId);
  expect(propuesta).toMatchObject({ estado: 'aceptada', planEjecucion: { mensajeId: mensaje.id } });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(pedido).toBeVisible();
  await expect(encabezado).toHaveCount(0);
  expect(leer('scheduled-messages.json').filter(item => item.presupuestoId === presupuestoId)).toHaveLength(1);
  expect(leer('presupuestos.json').find(item => item.id === presupuestoId)).toEqual(presupuestoOriginal);
  expect(ventanasExternas).toBe(0);
  await page.screenshot({ path: testInfo.outputPath('borrador-guardado.png'), fullPage: true });
});
