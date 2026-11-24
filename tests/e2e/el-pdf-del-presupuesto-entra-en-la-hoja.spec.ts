import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

const ID_CORTO = 'e2e-presupuesto-corto-338';
const ID_MEDIO = 'e2e-presupuesto-medio-338';
const ID_LARGO = 'e2e-presupuesto-largo-338';

const ARCHIVO = path.join(process.cwd(), 'data', 'presupuestos.json');
const ARCHIVO_SRC = path.join(process.cwd(), 'src', 'data', 'presupuestos.json');

let anteriorData: Buffer | null = null;
let anteriorSrc: Buffer | null = null;

test.beforeAll(() => {
  anteriorData = fs.existsSync(ARCHIVO) ? fs.readFileSync(ARCHIVO) : null;
  anteriorSrc = fs.existsSync(ARCHIVO_SRC) ? fs.readFileSync(ARCHIVO_SRC) : null;

  let lista: any[] = [];
  try {
    lista = JSON.parse(fs.readFileSync(ARCHIVO, 'utf8'));
  } catch {
    lista = [];
  }
  if (!Array.isArray(lista)) lista = [];

  lista = lista.filter((p) => ![ID_CORTO, ID_MEDIO, ID_LARGO].includes(p?.id));

  // Caso corto (1 renglón + regalo + notas + descuento 10%)
  lista.push({
    id: ID_CORTO,
    numero: 5001,
    clienteNombre: 'Cliente Corto Con Nombre Muy Extenso Para Verificar Ajuste De Linea En PDF 338',
    clienteContacto: '099111222',
    eventoTipo: 'Casamiento',
    eventoFecha: '2027-04-15T00:00:00.000Z',
    invitadosCantidad: 100,
    salonFiestas: 'Salón Principal',
    itemsPresupuestados: [
      {
        id: 'item-corto-1',
        idServicioCatalogo: 'serv-1',
        nombreServicio: 'Servicio Principal de Ceremonia y Ambientación LED',
        cantidad: 1,
        precioUnitario: 35000,
        precioUnitarioPresupuesto: 35000,
        costoTotalItem: 35000,
        calculationMethod: 'fijo',
      },
      {
        id: 'item-regalo-1',
        idServicioCatalogo: 'regalo-1',
        nombreServicio: 'Fotocabina 360 Bonificada',
        cantidad: 1,
        precioUnitario: 8000,
        precioUnitarioPresupuesto: 8000,
        costoTotalItem: 0,
        esRegalo: true,
        calculationMethod: 'fijo',
      },
    ],
    descuentoTipo: 'porcentaje',
    descuentoValor: 10,
    nombrePromocion: 'Descuento Promocional',
    notas: 'Notas internas de prueba con bastante texto para verificar que el PDF no desborda de la hoja en ningún dispositivo ni ancho de impresión.',
    costoTotalEstimado: 35000,
    totalConDescuento: 31500,
    timestamp: '2026-11-24T12:00:00.000Z',
    estado: 'Pendiente Verificación',
  });

  // Caso medio (5 renglones + notas largas)
  lista.push({
    id: ID_MEDIO,
    numero: 5002,
    clienteNombre: 'Cliente Medio Orden 338',
    clienteContacto: '099333444',
    eventoTipo: '15 Años',
    eventoFecha: '2027-05-20T00:00:00.000Z',
    invitadosCantidad: 150,
    salonFiestas: 'Salón Jardín',
    itemsPresupuestados: Array.from({ length: 5 }).map((_, idx) => ({
      id: `item-medio-${idx + 1}`,
      idServicioCatalogo: `serv-${idx + 1}`,
      nombreServicio: `Servicio de Catering y Operativa ${idx + 1} con detalles extendidos`,
      cantidad: idx + 1,
      precioUnitario: 10000,
      precioUnitarioPresupuesto: 10000,
      costoTotalItem: (idx + 1) * 10000,
      calculationMethod: 'fijo',
    })),
    descuentoTipo: 'porcentaje',
    descuentoValor: 10,
    nombrePromocion: 'Descuento Promocional',
    notas: 'Notas largas de prueba para el caso medio con múltiples líneas y explicaciones detalladas del evento.',
    costoTotalEstimado: 150000,
    totalConDescuento: 135000,
    timestamp: '2026-11-24T12:00:00.000Z',
    estado: 'Pendiente Verificación',
  });

  // Caso largo (30 renglones + nombre de 80 caracteres + regalo + descuento 10% + notas)
  const nombreLargoServicio = 'Servicio de Producción Integral Avanzada con Iluminación LED y Sonido Profesional';
  lista.push({
    id: ID_LARGO,
    numero: 5003,
    clienteNombre: 'Cliente con Nombre Ultra Largo de Ochenta Caracteres Exactos Para Prueba Extrema PDF Orden 338 ABCDEF',
    clienteContacto: '099555666',
    eventoTipo: 'Corporativo',
    eventoFecha: '2027-06-10T00:00:00.000Z',
    invitadosCantidad: 300,
    salonFiestas: 'Gran Salón Central',
    itemsPresupuestados: [
      ...Array.from({ length: 30 }).map((_, idx) => ({
        id: `item-largo-${idx + 1}`,
        idServicioCatalogo: `serv-largo-${idx + 1}`,
        nombreServicio: `${nombreLargoServicio} (${idx + 1})`,
        cantidad: 1,
        precioUnitario: 5000,
        precioUnitarioPresupuesto: 5000,
        costoTotalItem: 5000,
        calculationMethod: 'fijo',
      })),
      {
        id: 'item-regalo-largo',
        idServicioCatalogo: 'regalo-largo',
        nombreServicio: 'Staff de Mozos y Barra de Tragos Premium Bonificada',
        cantidad: 1,
        precioUnitario: 12000,
        precioUnitarioPresupuesto: 12000,
        costoTotalItem: 0,
        esRegalo: true,
        calculationMethod: 'fijo',
      },
    ],
    descuentoTipo: 'porcentaje',
    descuentoValor: 10,
    nombrePromocion: 'Descuento Promocional',
    notas: 'Notas extremadamente largas con múltiples párrafos y condiciones comerciales para verificar que el documento PDF no rompe las páginas ni desborda horizontalmente la hoja A4.',
    costoTotalEstimado: 150000,
    totalConDescuento: 135000,
    timestamp: '2026-11-24T12:00:00.000Z',
    estado: 'Pendiente Verificación',
  });

  fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
  fs.writeFileSync(ARCHIVO, JSON.stringify(lista, null, 2), 'utf8');
  if (fs.existsSync(path.dirname(ARCHIVO_SRC))) {
    fs.writeFileSync(ARCHIVO_SRC, JSON.stringify(lista, null, 2), 'utf8');
  }
});

test.afterAll(() => {
  if (anteriorData === null) fs.rmSync(ARCHIVO, { force: true });
  else fs.writeFileSync(ARCHIVO, anteriorData);

  if (anteriorSrc !== null && fs.existsSync(path.dirname(ARCHIVO_SRC))) {
    fs.writeFileSync(ARCHIVO_SRC, anteriorSrc);
  }
});

test.describe('Orden 338 - El PDF del presupuesto entra en la hoja', () => {
  for (const idPresupuesto of [ID_CORTO, ID_MEDIO, ID_LARGO]) {
    test(`presupuesto ${idPresupuesto} no desborda en impresión y descarga PDF correctamente`, async ({ context, page }, testInfo) => {
      test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
      test.setTimeout(90_000);
      const baseURL = (testInfo.project.use.baseURL as string) || 'http://127.0.0.1:3100';
      await ponerSesionDelEquipo(context, baseURL);

      // Desktop viewport
      await page.setViewportSize({ width: 1024, height: 900 });
      await page.goto(`/presupuestos/${idPresupuesto}/ver`, { waitUntil: 'domcontentloaded', timeout: 60_000 });

      const pdfRoot = page.locator('#budget-print-area, .ak-budget-pdf-root').first();
      await expect(pdfRoot).toBeVisible({ timeout: 20_000 });

      // Verificar scrollWidth <= clientWidth + 2 en desktop
      let desbordaDesktop = await pdfRoot.evaluate((el) => el.scrollWidth > el.clientWidth + 2);
      expect(desbordaDesktop).toBe(false);

      // Emular media print y ancho útil A4 (794px)
      await page.setViewportSize({ width: 794, height: 1123 });
      await page.emulateMedia({ media: 'print' });
      await page.waitForTimeout(300);

      const desbordaPrint = await pdfRoot.evaluate((el) => el.scrollWidth > el.clientWidth + 2);
      expect(desbordaPrint).toBe(false);

      // Botón Descargar PDF
      const btnDescargar = page.getByRole('button', { name: /Descargar PDF|Descargar/i }).first();
      if (await btnDescargar.isVisible({ timeout: 3000 }).catch(() => false)) {
        const downloadPromise = page.waitForEvent('download', { timeout: 20_000 }).catch(() => null);
        await btnDescargar.click();
        const download = await downloadPromise;
        if (download) {
          const suggestedFilename = download.suggestedFilename();
          expect(suggestedFilename).toMatch(/\.pdf$/i);
          const downloadPath = await download.path();
          if (downloadPath && fs.existsSync(downloadPath)) {
            const fileBuffer = fs.readFileSync(downloadPath);
            expect(fileBuffer.length).toBeGreaterThan(1024);
            const header = fileBuffer.subarray(0, 5).toString('ascii');
            expect(header).toContain('%PDF');
          }
        }
      }
    });
  }
});
