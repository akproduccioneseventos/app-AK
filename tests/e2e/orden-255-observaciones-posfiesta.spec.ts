import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, leerFiesta, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';
import { hoyEnUruguay } from '../../src/lib/utils';

const baseId = `e2e_orden255_${Date.now()}`;
const origenId = `${baseId}_anterior`;
const destinoId = `${baseId}_proxima`;
const hoy = hoyEnUruguay();
const [anio, mes, dia] = hoy.split('-').map(Number);
const fecha = (dias: number) => new Date(Date.UTC(anio, mes - 1, dia + dias, 12)).toISOString().slice(0, 10);

test.beforeAll(() => {
  for (const [id, diferencia] of [[origenId, -3], [destinoId, 3]] as const) {
    const fiesta = crearFiestaDeEstaNoche({ id, fechaEvento: fecha(diferencia) });
    fiesta.estado = 'Confirmada';
    fiesta.configuracion.nombreEvento = `Prueba de observaciones ${id}`;
    fiesta.configuracion.tipoCelebracion = 'Boda';
    fiesta.configuracion.invitadosEstimados = 100;
    fiesta.configuracion.horaInicio = '19:00';
    fiesta.configuracion.horaFin = '23:00';
    fiesta.presupuestoId = undefined;
    fiesta.invitados = [];
    guardarFiesta(fiesta);
  }
});

test.afterAll(() => {
  borrarFiesta(origenId);
  borrarFiesta(destinoId);
  for (const carpeta of ['data', 'src/data']) {
    const archivo = path.join(process.cwd(), carpeta, 'observaciones-posfiesta.json');
    if (!fs.existsSync(archivo)) continue;
    const contenido = JSON.parse(fs.readFileSync(archivo, 'utf8'));
    if (Array.isArray(contenido)) fs.writeFileSync(archivo, JSON.stringify(contenido.filter(item => item.fiestaId !== origenId && item.fiestaId !== destinoId), null, 2));
  }
});

test('guarda un hecho y lo usa como referencia sin modificar la proxima fiesta', async ({ context, page }, testInfo) => {
  test.setTimeout(300000);
  await ponerSesionDelEquipo(context, testInfo.project.use.baseURL as string);
  // Los archivos de prueba no deben disparar una recarga de desarrollo durante el guardado.
  await page.routeWebSocket('**/_next/webpack-hmr', socket => socket.close());
  await page.goto(`/fiestas/nueva/post-evento?fiestaId=${origenId}`, { waitUntil: 'domcontentloaded' });
  // La primera ruta de next dev compila en frio en la maquina de 8 GB.
  await expect(page.getByRole('button', { name: 'Guardar hechos', exact: true })).toBeVisible({ timeout: 120000 });
  await page.getByLabel('Observación', { exact: true }).click();
  await page.getByRole('option', { name: 'Sobró', exact: true }).click();
  await page.getByLabel('Artículo o rol', { exact: true }).fill('Arroz de prueba');
  await page.getByLabel('Cantidad observada', { exact: true }).fill('0.5');
  await page.getByLabel('Unidad', { exact: true }).fill('kg');
  await page.getByRole('button', { name: 'Guardar hechos', exact: true }).click();
  const guardados = page.getByRole('region', { name: 'Hechos guardados en esta fiesta', exact: true });
  await expect(guardados).toContainText('Sobró 0.5 kg de Arroz de prueba');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(guardados).toContainText('Sobró 0.5 kg de Arroz de prueba');
  const antes = leerFiesta(destinoId);
  await page.goto(`/fiestas/nueva/personal?fiestaId=${destinoId}`, { waitUntil: 'domcontentloaded' });
  const referencias = page.getByRole('region', { name: 'Sugerencias basadas en fiestas anteriores', exact: true });
  await expect(referencias).toContainText('Arroz de prueba');
  await expect(referencias).toContainText('100 estimadas');
  await expect(referencias).toContainText('Revisar; no modifica cantidades ni asignaciones.');
  expect(leerFiesta(destinoId).personalAsignado).toEqual(antes.personalAsignado);
  expect(leerFiesta(destinoId).comprasSugeridas).toEqual(antes.comprasSugeridas);
  await page.screenshot({ path: testInfo.outputPath('referencias-posfiesta.png'), fullPage: true });
});
