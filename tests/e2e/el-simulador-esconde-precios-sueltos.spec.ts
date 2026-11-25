import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const SECRETO = 'playwright-session-secret-with-enough-entropy';
const MUTABLE_FILES = [
  'data/armado-rapido-config.json',
  'src/data/armado-rapido-config.json',
  'data/presupuestos.json',
  'src/data/presupuestos.json',
  'data/crm-leads.json',
  'src/data/crm-leads.json',
  'data/notifications.json',
  'src/data/notifications.json',
];

const snapshots = new Map<string, Buffer | null>();

const tokenDelPdf = (id: string) =>
  crypto.createHmac('sha256', SECRETO).update(`budget-token:${id}`).digest('hex');

function setMostrarPrecios(value: boolean) {
  const srcConfigPath = path.join(process.cwd(), 'src/data/armado-rapido-config.json');
  const dataConfigPath = path.join(process.cwd(), 'data/armado-rapido-config.json');
  const baseRaw = fs.existsSync(dataConfigPath)
    ? fs.readFileSync(dataConfigPath, 'utf8')
    : fs.readFileSync(srcConfigPath, 'utf8');
  const parsed = JSON.parse(baseRaw);
  parsed.mostrarPrecios = value;
  const serialized = `${JSON.stringify(parsed, null, 2)}\n`;
  fs.mkdirSync(path.dirname(dataConfigPath), { recursive: true });
  fs.writeFileSync(dataConfigPath, serialized, 'utf8');
  fs.writeFileSync(srcConfigPath, serialized, 'utf8');
}

function seedPresupuesto(estado: 'Enviado' | 'Aceptado', id = 'e2e_343_precios_ocultos') {
  const dataPath = path.join(process.cwd(), 'data/presupuestos.json');
  const existing = fs.existsSync(dataPath)
    ? JSON.parse(fs.readFileSync(dataPath, 'utf8'))
    : [];
  const filtered = Array.isArray(existing) ? existing.filter((p: any) => p.id !== id) : [];
  filtered.push({
    id,
    numero: 9343,
    clienteNombre: 'Prospecto Precios Ocultos',
    clienteContacto: '099111222',
    eventoTipo: 'Cumpleaños',
    eventoFecha: '2027-08-20T18:00:00.000Z',
    invitadosCantidad: 80,
    invitadosAdultos: 80,
    invitadosNinos: 0,
    invitadosAdolescentes: 0,
    salonFiestas: 'Locación propia',
    itemsPresupuestados: [
      {
        idServicioCatalogo: 'serv_dj_e2e',
        nombreServicio: 'Servicio Audio Iluminación E2E',
        cantidad: 1,
        unidad: 'serv.',
        precioUnitario: 50000,
        precioUnitarioPresupuesto: 50000,
        costoTotalItem: 50000,
        categoriaServicio: 'Otros servicios',
        esRegalo: false,
      },
      {
        idServicioCatalogo: 'serv_regalo_e2e',
        nombreServicio: 'Invitaciones Digitales E2E',
        cantidad: 1,
        unidad: 'serv.',
        precioUnitario: 5000,
        precioUnitarioPresupuesto: 5000,
        costoTotalItem: 0,
        categoriaServicio: 'Regalos Incluidos',
        esRegalo: true,
      },
    ],
    costoTotalEstimado: 50000,
    totalConDescuento: 50000,
    timestamp: '2026-11-24T12:00:00.000Z',
    estado,
    versionDeEnlace: 0,
  });
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  fs.writeFileSync(dataPath, `${JSON.stringify(filtered, null, 2)}\n`, 'utf8');
  return { id, token: tokenDelPdf(id) };
}

test.beforeAll(() => {
  for (const relativePath of MUTABLE_FILES) {
    const absolutePath = path.join(process.cwd(), relativePath);
    snapshots.set(
      absolutePath,
      fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath) : null,
    );
  }
});

test.afterEach(() => {
  for (const [absolutePath, snapshot] of snapshots) {
    if (snapshot === null) fs.rmSync(absolutePath, { force: true });
    else fs.writeFileSync(absolutePath, snapshot);
  }
});

test.afterAll(() => {
  for (const [absolutePath, snapshot] of snapshots) {
    if (snapshot === null) fs.rmSync(absolutePath, { force: true });
    else fs.writeFileSync(absolutePath, snapshot);
  }
});

test.describe('Orden 343 — Interruptor mostrarPrecios en simulador y vista pública', () => {
  test('con mostrarPrecios: false esconde precios sueltos en simulador y en vista Enviado, y los muestra en Aceptado', async ({ page, context }) => {
    test.setTimeout(240_000);
    setMostrarPrecios(false);

    await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });
    const btnStart = page.getByTestId('simulator-cover-start');
    await expect(btnStart).toBeEnabled({ timeout: 60_000 });
    await btnStart.click();

    // Paso 1: Datos del evento
    await expect(page.getByText(/Paso 1 de 4/i)).toBeVisible();
    await page.locator('#simulator-name').fill('Prospecto Precios Ocultos');
    await page.locator('#simulator-phone').fill('099111222');
    await page.getByRole('button', { name: /Tengo sal[oó]n o locaci[oó]n propia/i }).click();
    await page.getByRole('button', { name: /Selecciona una fecha/i }).click();
    const nextMonth = page.getByRole('button', { name: /next month/i });
    for (let m = 0; m < 6; m += 1) await nextMonth.click();
    await page.getByRole('grid').getByRole('button', { name: /\b15\b/, disabled: false }).first().click();
    await page.waitForFunction(() => !document.body.innerText.includes('Verificando disponibilidad')).catch(() => undefined);
    await page.getByRole('button', { name: /Continuar/i }).click();

    // Paso 2: Gastronomía — sin "$ ... p/p" sueltos en las opciones
    await expect(page.getByText(/Paso 2 de 4/i)).toBeVisible();
    const paso2Text = await page.locator('.ak-public-page').innerText();
    expect(paso2Text).not.toMatch(/\$\s*[\d.]+\s*p\/p/i);
    await page.getByRole('button', { name: /Continuar/i }).click();

    // Paso 3: Paquetes — SÍ muestra total del paquete y por persona
    await expect(page.getByText(/Paso 3 de 4/i)).toBeVisible();
    await expect(page.getByText(/Presupuesto Estimado/i).first()).toBeVisible();
    await expect(page.getByText(/por persona/i).first()).toBeVisible();
    await page.getByRole('button', { name: /Continuar/i }).click();

    // Paso 4: Personalización — sin precios sueltos en tarjetas de servicios
    await expect(page.getByText(/Paso 4 de 4/i)).toBeVisible();
    const keepSelection = page.getByRole('button', { name: /Mantener mi selecci[oó]n actual/i });
    await keepSelection.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => undefined);
    if (await keepSelection.isVisible().catch(() => false)) {
      await keepSelection.click();
    }
    await expect(page.getByText(/Servicios contratados en tu propuesta/i)).toBeVisible();
    await expect(page.getByText(/^Incluido$/i).first()).toBeVisible();
    const paso4Text = await page.locator('.ak-public-page').innerText();
    expect(paso4Text).not.toMatch(/•\s*\$\s*[\d.]+/);

    // Vista pública /ver con presupuesto Enviado: oculta precio unitario/por fila, muestra total
    const { id, token } = seedPresupuesto('Enviado');
    await context.clearCookies();
    await page.goto(`/presupuestos/${id}/ver?cliente=1&token=${token}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Servicio Audio Iluminación E2E')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#budget-print-area')).toContainText('Incluido');
    await expect(page.locator('#budget-print-area')).toContainText('REGALO');
    await expect(page.locator('#budget-print-area th', { hasText: /^Precio$/ })).toHaveCount(0);
    await expect(page.locator('#budget-print-area')).toContainText('Importe total');

    // Al pasarlo a Aceptado (contrato), SÍ muestra la columna Precio y los importes por servicio
    seedPresupuesto('Aceptado', id);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#budget-print-area th', { hasText: /^Precio$/ })).toHaveCount(1, { timeout: 30_000 });
    await expect(page.locator('#budget-print-area')).toContainText('$ 50.000');
  });

  test('con mostrarPrecios: true muestra los precios sueltos en simulador y vista Enviado', async ({ page, context }) => {
    test.setTimeout(240_000);
    setMostrarPrecios(true);

    await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });
    const btnStart = page.getByTestId('simulator-cover-start');
    await expect(btnStart).toBeEnabled({ timeout: 60_000 });
    await btnStart.click();

    await page.locator('#simulator-name').fill('Prospecto Precios Visibles');
    await page.locator('#simulator-phone').fill('099111333');
    await page.getByRole('button', { name: /Tengo sal[oó]n o locaci[oó]n propia/i }).click();
    await page.getByRole('button', { name: /Selecciona una fecha/i }).click();
    const nextMonth = page.getByRole('button', { name: /next month/i });
    for (let m = 0; m < 6; m += 1) await nextMonth.click();
    await page.getByRole('grid').getByRole('button', { name: /\b15\b/, disabled: false }).first().click();
    await page.waitForFunction(() => !document.body.innerText.includes('Verificando disponibilidad')).catch(() => undefined);
    await page.getByRole('button', { name: /Continuar/i }).click();

    await expect(page.getByText(/Paso 2 de 4/i)).toBeVisible();
    await expect(page.getByText(/\$\s*[\d.]+\s*p\/p/i).first()).toBeVisible();

    const { id, token } = seedPresupuesto('Enviado', 'e2e_343_precios_visibles');
    await context.clearCookies();
    await page.goto(`/presupuestos/${id}/ver?cliente=1&token=${token}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#budget-print-area th', { hasText: /^Precio$/ })).toHaveCount(1, { timeout: 30_000 });
    await expect(page.locator('#budget-print-area')).toContainText('$ 50.000');
  });
});
