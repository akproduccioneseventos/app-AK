import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type BrowserContext } from '@playwright/test';

import { initialFiestaActualData } from '../../src/lib/fiesta-defaults';
import type { ProveedorPortalAccess } from '../../src/types/provider-portal';

const SESSION_SECRET = 'playwright-session-secret-with-enough-entropy';
const FIESTA_ID = 'e2e-planner-portals';
const PROVIDER_TOKEN = 'e2e-provider-private-token';
const fiestaFile = path.join(process.cwd(), 'data', 'fiestas', `${FIESTA_ID}.json`);
const providerFile = path.join(process.cwd(), 'data', 'proveedor-portal.json');
let originalFiestaFile: Buffer | null = null;
let originalProviderFile: Buffer | null = null;

function createLegacySessionToken() {
  const payload = `v1.${Date.now() + 60 * 60 * 1000}.${crypto.randomUUID()}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

async function addAppSession(context: BrowserContext, baseURL: string) {
  await context.addCookies([
    {
      name: 'ak_session',
      value: createLegacySessionToken(),
      url: baseURL,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

test.beforeAll(() => {
  originalFiestaFile = fs.existsSync(fiestaFile) ? fs.readFileSync(fiestaFile) : null;
  originalProviderFile = fs.existsSync(providerFile) ? fs.readFileSync(providerFile) : null;

  const fiesta = structuredClone(initialFiestaActualData);
  fiesta.id = FIESTA_ID;
  fiesta.configuracion = {
    ...fiesta.configuracion,
    clienteNombre: 'Cliente Portales E2E',
    fechaEvento: '2027-09-18',
    nombreEvento: 'Evento Portales E2E',
    nombreLugar: 'Salon E2E',
  };
  fs.mkdirSync(path.dirname(fiestaFile), { recursive: true });
  fs.writeFileSync(fiestaFile, JSON.stringify(fiesta, null, 2), 'utf8');

  const provider: ProveedorPortalAccess = {
    id: 'provider-e2e',
    fiestaId: FIESTA_ID,
    token: PROVIDER_TOKEN,
    nombreProveedor: 'Sonido E2E',
    tipoProveedor: 'Sonido',
    telefono: '099000000',
    horaLlegadaEstimada: '18:30',
    horaPartidaEstimada: '04:00',
    estadoActual: 'Pendiente',
    tareas: [
      { id: 'task-e2e', texto: 'Realizar prueba de sonido', completada: false },
    ],
    createdAt: new Date().toISOString(),
    activo: true,
  };
  fs.mkdirSync(path.dirname(providerFile), { recursive: true });
  fs.writeFileSync(providerFile, JSON.stringify([provider], null, 2), 'utf8');
});

test.afterAll(() => {
  if (originalFiestaFile === null) fs.rmSync(fiestaFile, { force: true });
  else fs.writeFileSync(fiestaFile, originalFiestaFile);

  if (originalProviderFile === null) fs.rmSync(providerFile, { force: true });
  else fs.writeFileSync(providerFile, originalProviderFile);
});

test('restored planner portals load with the selected event', async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Planner portal coverage only needs desktop.');
  test.setTimeout(300_000);
  await page.addInitScript(() => window.localStorage.setItem('ak_session', 'true'));
  await addAppSession(context, testInfo.project.use.baseURL as string);

  for (const route of ['entretenimiento', 'muro-social', 'proveedores-portal']) {
    const response = await page.goto(`/fiestas/nueva/${route}?fiestaId=${FIESTA_ID}`, {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.status(), route).toBeLessThan(400);
    await expect(page.locator('body'), route).not.toContainText(/Application error|Internal Server Error/i);
  }

  await expect(page.getByText('Sonido E2E')).toBeVisible();
  await expect(page.getByRole('button', { name: /Nuevo acceso/i })).toBeVisible();
});

test('provider token exposes only the assigned workflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Provider workflow coverage only needs desktop.');
  const response = await page.goto(`/proveedor/acceso/${PROVIDER_TOKEN}`, {
    waitUntil: 'domcontentloaded',
  });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByRole('heading', { name: 'Sonido E2E' })).toBeVisible();
  await expect(page.getByText('Realizar prueba de sonido')).toBeVisible();
  await expect(page.getByText('Cliente Portales E2E')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Confirmar' })).toBeVisible();
});
