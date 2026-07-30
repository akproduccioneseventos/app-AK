import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type BrowserContext } from '@playwright/test';
import { initialFiestaActualData } from '../../src/lib/fiesta-defaults';

const SESSION_SECRET = 'playwright-session-secret-with-enough-entropy';
const FIESTA_ID = 'e2e-entertainment-fiesta';
const fiestaFile = path.join(process.cwd(), 'data', 'fiestas', `${FIESTA_ID}.json`);
let originalFiestaFile: Buffer | null = null;

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
  const fiesta = structuredClone(initialFiestaActualData);
  fiesta.id = FIESTA_ID;
  fiesta.configuracion = {
    ...fiesta.configuracion,
    clienteNombre: 'Cliente Entretenimiento E2E',
    fechaEvento: '2027-08-21',
    nombreEvento: 'Evento Entretenimiento E2E',
    nombreLugar: 'Salon E2E',
    tipoCelebracion: 'XV Anos',
  };

  fs.mkdirSync(path.dirname(fiestaFile), { recursive: true });
  fs.writeFileSync(fiestaFile, JSON.stringify(fiesta, null, 2), 'utf8');
});

test.afterAll(() => {
  if (originalFiestaFile === null) {
    fs.rmSync(fiestaFile, { force: true });
  } else {
    fs.writeFileSync(fiestaFile, originalFiestaFile);
  }
});

test('operator screens load for every camera station', async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The operator matrix only needs one browser project.');
  const baseURL = testInfo.project.use.baseURL as string;
  await addAppSession(context, baseURL);

  const routes = [
    `/evento/fotocabina/${FIESTA_ID}?role=operator`,
    `/evento/plataforma-360/${FIESTA_ID}?role=operator`,
    `/evento/bogue/${FIESTA_ID}?role=operator`,
    `/evento/espejo-magico/${FIESTA_ID}?mode=foto&role=operator`,
    `/evento/espejo-magico/${FIESTA_ID}?mode=firma&role=operator`,
    `/evento/touchpix/${FIESTA_ID}?role=operator`,
  ];

  for (const route of routes) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), route).toBeLessThan(400);
    await expect(page.locator('body'), route).not.toContainText(/acceso de estacion no autorizado|no se pudo abrir esta estacion/i);
    await expect(page.locator('button:visible').first(), route).toBeVisible();
  }
});

test('photobooth display receives a browser camera stream', async ({ context, page }, testInfo) => {
  const baseURL = testInfo.project.use.baseURL as string;
  await addAppSession(context, baseURL);
  await page.addInitScript(() => {
    const getUserMedia = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 1280;
      const drawing = canvas.getContext('2d');
      drawing?.fillRect(0, 0, canvas.width, canvas.height);
      return canvas.captureStream(30);
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
  });

  const response = await page.goto(`/evento/fotocabina/${FIESTA_ID}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('body')).not.toContainText(/acceso de estacion no autorizado|no se pudo abrir esta estacion/i);
  await expect(page.locator('video').first()).toBeVisible();
});

test('AI mirror keeps one coherent touch selector on desktop and mobile', async ({ context, page }, testInfo) => {
  const baseURL = testInfo.project.use.baseURL as string;
  await addAppSession(context, baseURL);
  await page.addInitScript(() => {
    const getUserMedia = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 1280;
      canvas.getContext('2d')?.fillRect(0, 0, canvas.width, canvas.height);
      return canvas.captureStream(30);
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
  });

  const response = await page.goto(
    `/evento/espejo-magico/${FIESTA_ID}?mode=ia`,
    { waitUntil: 'domcontentloaded' },
  );
  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByText('1. Elegí tu Estilo IA')).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveCount(1);

  const captureButton = page.getByRole('button', { name: 'Crear avatar IA' });
  await expect(captureButton).toBeDisabled();
  await page.getByRole('button', { name: 'Cine & Accion' }).click();
  await expect(page.getByTestId('selected-ai-style')).toHaveText('Afiche de Cine');
  await expect(
    page.getByRole('button', { name: 'Afiche de Cine' }),
  ).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('checkbox').check();
  await expect(captureButton).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
});
