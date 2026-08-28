import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { initialFiestaActualData } from '../../src/lib/fiesta-defaults';
import type { Invoice } from '../../src/types/invoice';
import type { Presupuesto } from '../../src/types/presupuesto';

const SESSION_SECRET = 'playwright-session-secret-with-enough-entropy';
const FIXTURE_IDS = {
  activo: 'lc_psitio',
  customer: 'e2e-dynamic-customer',
  empleado: 'emp_1759833938625_518g1',
  fiesta: 'e2e-dynamic-fiesta',
  insumo: 'ing-harina',
  invoice: 'e2e-dynamic-invoice',
  menu: 'menu_entradas_maestro',
  presupuesto: 'e2e-dynamic-presupuesto',
  proveedor: 'prov_calsal',
  salon: 'e2e-dynamic-salon',
  servicio: 'serv_hielo',
};

type FileSnapshot = {
  content: Buffer | null;
  filePath: string;
};

const snapshots: FileSnapshot[] = [];

function createLegacySessionToken() {
  const payload = `v1.${Date.now() + 60 * 60 * 1000}.${crypto.randomUUID()}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

function findPageFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findPageFiles(entryPath);
    return entry.name === 'page.tsx' ? [entryPath] : [];
  });
}

function parameterValue(segments: string[], segment: string): string[] {
  const route = segments.join('/');
  if (segment === '[...slugs]') return ['catalogo'];
  if (segment === '[menuId]') return [FIXTURE_IDS.menu];
  if (segment === '[empleadoId]') return [FIXTURE_IDS.empleado];
  if (route.startsWith('customers/')) return [FIXTURE_IDS.customer];
  if (route.startsWith('empleados/')) return [FIXTURE_IDS.empleado];
  if (route.includes('activos-fijos/')) return [FIXTURE_IDS.activo];
  if (route.includes('insumos/')) return [FIXTURE_IDS.insumo];
  if (route.includes('salones/')) return [FIXTURE_IDS.salon];
  if (route.includes('todos-los-servicios/')) return [FIXTURE_IDS.servicio];
  if (route.includes('servicios/editar/')) return [FIXTURE_IDS.servicio];
  if (route.startsWith('fiestas/')) return [FIXTURE_IDS.fiesta];
  if (route.startsWith('invoices/')) return [FIXTURE_IDS.invoice];
  if (route.startsWith('presupuestos/')) return [FIXTURE_IDS.presupuesto];
  if (route.startsWith('proveedores/')) return [FIXTURE_IDS.proveedor];
  throw new Error(`Parametro dinamico sin fixture: ${route}`);
}

function getDynamicInternalRoutes() {
  const appRoot = path.join(process.cwd(), 'src', 'app', '(app)');
  return findPageFiles(appRoot)
    .map((file) => path.relative(appRoot, path.dirname(file)).split(path.sep))
    .filter((segments) => segments.some((segment) => segment.startsWith('[')))
    .map((segments) => {
      const materialized = segments.flatMap((segment) =>
        segment.startsWith('[') ? parameterValue(segments, segment) : [segment],
      );
      return `/${materialized.map(encodeURIComponent).join('/')}`;
    })
    .sort();
}

function writeFixture(relativePath: string, value: unknown) {
  const filePath = path.join(process.cwd(), 'data', relativePath);
  snapshots.push({
    content: fs.existsSync(filePath) ? fs.readFileSync(filePath) : null,
    filePath,
  });
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function restoreFixtures() {
  for (const snapshot of snapshots.reverse()) {
    if (snapshot.content === null) {
      fs.rmSync(snapshot.filePath, { force: true });
    } else {
      fs.writeFileSync(snapshot.filePath, snapshot.content);
    }
  }
  const fiestasDirectory = path.join(process.cwd(), 'data', 'fiestas');
  if (fs.existsSync(fiestasDirectory) && fs.readdirSync(fiestasDirectory).length === 0) {
    fs.rmdirSync(fiestasDirectory);
  }
}

test.beforeAll(() => {
  const fiesta = structuredClone(initialFiestaActualData);
  fiesta.id = FIXTURE_IDS.fiesta;
  fiesta.configuracion = {
    ...fiesta.configuracion,
    clienteNombre: 'Cliente E2E',
    fechaEvento: '2027-08-21',
    invitadosEstimados: 100,
    nombreEvento: 'Evento dinamico E2E',
    nombreLugar: 'Salon E2E',
    tipoCelebracion: 'XV Anos',
  };

  const presupuesto: Presupuesto = {
    id: FIXTURE_IDS.presupuesto,
    clienteNombre: 'Cliente E2E',
    clienteContacto: '099000000',
    eventoTipo: 'XV Anos',
    eventoFecha: '2027-08-21T00:00:00.000Z',
    invitadosCantidad: 100,
    salonFiestas: 'Salon E2E',
    itemsPresupuestados: [
      {
        idServicioCatalogo: 'servicio-e2e',
        nombreServicio: 'Servicio integral E2E',
        cantidad: 1,
        precioUnitario: 100_000,
        precioUnitarioPresupuesto: 100_000,
        costoTotalItem: 100_000,
        calculationMethod: 'fijo',
      },
    ],
    costoTotalEstimado: 100_000,
    totalConDescuento: 100_000,
    timestamp: '2026-07-13T12:00:00.000Z',
    estado: 'Aceptado',
    invoiceId: FIXTURE_IDS.invoice,
  };

  const invoice: Invoice = {
    id: FIXTURE_IDS.invoice,
    invoiceNumber: 'E2E-001',
    customer: { id: FIXTURE_IDS.customer, name: 'Cliente E2E' },
    issueDate: '2026-07-13',
    dueDate: '2026-08-12',
    items: [
      {
        id: 'item-e2e',
        description: 'Servicio integral E2E',
        quantity: 1,
        unitPrice: 100_000,
        total: 100_000,
      },
    ],
    subtotal: 100_000,
    taxRate: 0,
    taxAmount: 0,
    totalAmount: 100_000,
    status: 'Sent',
    currency: 'UYU',
    vendorName: 'AK Producciones',
    payments: [],
  };

  writeFixture('customers.json', [
    {
      id: FIXTURE_IDS.customer,
      name: 'Cliente E2E',
      email: 'cliente-e2e@example.com',
      phone: '099000000',
      address: 'Direccion de prueba',
      status: 'Activo',
    },
  ]);
  writeFixture(`fiestas/${FIXTURE_IDS.fiesta}.json`, fiesta);
  writeFixture('invoices.json', [invoice]);
  writeFixture('presupuestos.json', [presupuesto]);
  writeFixture('salones.json', [
    {
      id: FIXTURE_IDS.salon,
      nombre: 'Salon E2E',
      capacidad: 150,
      direccion: 'Direccion de prueba',
    },
  ]);
});

test.afterAll(() => {
  restoreFixtures();
});

test('every dynamic internal route responds with representative local data', async ({ context }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The dynamic inventory only needs one browser project.');
  test.setTimeout(30 * 60 * 1000);

  const routes = getDynamicInternalRoutes();
  // 34 = las 33 de antes mas el Tablero de la noche
  // (`/fiestas/[id]/entretenimiento/control`), desde donde el operador ve todas
  // las estaciones juntas y cuantas capturas lleva cada una.
  expect(routes).toHaveLength(34);

  await context.addCookies([
    {
      name: 'ak_session',
      value: createLegacySessionToken(),
      url: testInfo.project.use.baseURL as string,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  const failures: string[] = [];
  for (const route of routes) {
    try {
      const response = await context.request.get(route, { timeout: 60_000 });
      const body = await response.text();
      if (response.status() >= 400) failures.push(`${route}: HTTP ${response.status()}`);
      if (new URL(response.url()).pathname === '/login') failures.push(`${route}: redirige a /login`);
      if (/Application error|Internal Server Error|no puede cargar los datos del panel/i.test(body)) {
        failures.push(`${route}: muestra un error de aplicacion`);
      }
    } catch (error) {
      failures.push(`${route}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  expect(failures, failures.join('\n')).toEqual([]);
});

test('representative dynamic screens hydrate without browser errors', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The hydration pass only needs one browser project.');
  test.setTimeout(15 * 60 * 1000);

  await page.context().addCookies([
    {
      name: 'ak_session',
      value: createLegacySessionToken(),
      url: testInfo.project.use.baseURL as string,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  await page.addInitScript(() => {
    window.localStorage.setItem('ak_session', 'true');
    window.sessionStorage.setItem('ak_session', 'true');
  });

  const routes = [
    `/customers/${FIXTURE_IDS.customer}`,
    `/empleados/${FIXTURE_IDS.empleado}/historial`,
    `/empresa/activos-fijos/${FIXTURE_IDS.activo}/editar`,
    `/empresa/insumos/${FIXTURE_IDS.insumo}/editar`,
    `/empresa/menus/${FIXTURE_IDS.menu}/editar`,
    `/empresa/salones/${FIXTURE_IDS.salon}/croquis`,
    `/empresa/servicios/editar/${FIXTURE_IDS.servicio}`,
    `/proveedores/${FIXTURE_IDS.proveedor}/edit`,
    `/invoices/${FIXTURE_IDS.invoice}`,
    `/presupuestos/${FIXTURE_IDS.presupuesto}/ver`,
    `/fiestas/${FIXTURE_IDS.fiesta}/comando-total`,
    `/fiestas/${FIXTURE_IDS.fiesta}/timeline`,
  ];
  const failures: string[] = [];

  for (const route of routes) {
    const pageErrors: string[] = [];
    const onPageError = (error: Error) => pageErrors.push(error.message);
    page.on('pageerror', onPageError);
    try {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForTimeout(500);
      const pathname = new URL(page.url()).pathname;
      const body = await page.locator('body').innerText();
      if (!response || response.status() >= 400) failures.push(`${route}: HTTP ${response?.status() ?? 'sin respuesta'}`);
      if (pathname === '/login') failures.push(`${route}: redirige a /login`);
      if (/Application error|Internal Server Error|no puede cargar los datos del panel/i.test(body)) {
        failures.push(`${route}: muestra un error de aplicacion`);
      }
      if (pageErrors.length > 0) failures.push(`${route}: ${pageErrors.join(' | ')}`);
    } catch (error) {
      failures.push(`${route}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      page.off('pageerror', onPageError);
    }
  }

  expect(failures, failures.join('\n')).toEqual([]);
});
