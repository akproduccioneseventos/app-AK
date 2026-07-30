import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import {
  defaultCartaTragosData,
  defaultClientPortalSettings,
  defaultModulosContratados,
  initialFiestaActualData,
} from '../../src/lib/fiesta-defaults';

const FIESTA_ID_PREFIX = 'e2e-public-experience';
const ACCESS_KEY_PREFIX = 'E2E-PUBLIC-CLIENT';
const GUEST_ID = 'guest-public-e2e';
const GUEST_TOKEN = 'guest-public-e2e-secure-token';
const EVENT_NAME = 'Evento Público E2E';
let fiestaId = FIESTA_ID_PREFIX;
let accessKey = ACCESS_KEY_PREFIX;
let fiestaFile = '';
let originalFiestaFile: Buffer | null = null;

function eventDate() {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  return date.toISOString().slice(0, 10);
}

async function expectHealthyPublicPage(page: Page) {
  await expect(page.locator('body')).not.toContainText(
    /Application error|Internal Server Error|No pudimos abrir|Evento no disponible/i,
  );

  const health = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    text: document.body.innerText,
    internalLinks: [...document.querySelectorAll<HTMLAnchorElement>('a[href]')]
      .map((link) => link.getAttribute('href') || '')
      .filter((href) => /^\/(?:contabilidad|customers|empresa|empleados|eventos|fiestas|invoices|pagos-rapidos|presupuestos|proveedores|settings)(?:\/|\?|$)/.test(href)),
  }));

  expect(health.scrollWidth).toBeLessThanOrEqual(health.clientWidth + 2);
  expect(health.text).not.toMatch(/[ÃÂ]|â(?:€|™|œ|ž|€¦)|ðŸ/);
  expect(health.internalLinks).toEqual([]);
}

test.beforeAll(({}, workerInfo) => {
  const projectSuffix = workerInfo.project.name.endsWith('mobile') ? 'mobile' : 'desktop';
  fiestaId = `${FIESTA_ID_PREFIX}-${projectSuffix}`;
  accessKey = `${ACCESS_KEY_PREFIX}-${projectSuffix}`;
  fiestaFile = path.join(process.cwd(), 'data', 'fiestas', `${fiestaId}.json`);
  originalFiestaFile = fs.existsSync(fiestaFile) ? fs.readFileSync(fiestaFile) : null;
  const fiesta = structuredClone(initialFiestaActualData);
  fiesta.id = fiestaId;
  fiesta.configuracion = {
    ...fiesta.configuracion,
    clienteNombre: 'Cliente Público E2E',
    direccionLugar: 'Artigas 123, Salto',
    fechaEvento: eventDate(),
    horaInicio: '21:00',
    invitadosEstimados: 120,
    nombreEvento: EVENT_NAME,
    nombreLugar: 'Salón E2E',
    tipoCelebracion: 'XV Años',
  };
  fiesta.modulosContratados = {
    ...defaultModulosContratados,
    ...(fiesta.modulosContratados || {}),
    checkin: true,
  };
  fiesta.clientPortalSettings = {
    ...structuredClone(defaultClientPortalSettings),
    enabled: true,
    accessKey,
    clientPassword: accessKey,
    accessPhase: 'en_vivo',
  };
  fiesta.invitados = [{
    id: GUEST_ID,
    nombre: 'Invitada E2E',
    rsvp: 'Confirmado',
    partySize: 2,
    tableNumber: '8',
    dietaryRestriction: 'Vegetariano',
    guestAccessToken: GUEST_TOKEN,
    cancionesDJ: ['Vivir mi vida'],
  }];
  fiesta.guestPortalSettings = {
    showMural: true,
    showFotos: true,
    showInvitacionWeb: true,
    showMesaAsignada: true,
    showItinerario: true,
    showMusica: true,
    showRegalos: false,
    showCheckin: true,
    welcomeMessage: 'Bienvenida a tu experiencia AK.',
  };
  fiesta.guestExperienceSettings = {
    enabled: true,
    showAkBranding: true,
    showLandingCta: true,
    showSocialCta: true,
    showBudgetSimulatorCta: true,
    landingUrl: '/',
    simulatorUrl: '/simulador-de-presupuesto',
    whatsappUrl: 'https://wa.me/59898355530',
    allowSongSuggestions: true,
    allowPhotoUpload: true,
    allowGuestPortal: true,
    showMenu: true,
  };
  fiesta.programa = [{
    id: 'programa-e2e',
    hora: '22:00',
    titulo: 'Entrada principal',
    descripcion: 'Bienvenida al evento',
    icono: 'Sparkles',
  }];
  fiesta.cartaTragos = structuredClone(defaultCartaTragosData);
  fiesta.others = {
    ...(fiesta.others || {}),
    barraTecnologica: {
      settings: {
        enabled: true,
        title: 'Barra interactiva AK',
        subtitle: 'Elegí tu trago',
        guestPrompt: 'Ingresá tu nombre para pedir',
        barmanTitle: 'Cola de barra',
        hashtag: '#EventoPublicoE2E',
        instagramHandle: '@akproducciones',
        brandText: 'AK Producciones',
        accentColor: '#dc2626',
        requireGuestName: true,
        allowPhotoCapture: true,
        autoPublishPhotos: false,
        showIngredients: true,
        showAlcoholFreeTag: true,
        showDrinkDescription: true,
        showDrinkVideo: true,
        requireSocialFollowForPhotos: false,
        socialFollowPrompt: 'Seguinos para ver más experiencias.',
      },
      orders: [],
    },
  };

  fs.mkdirSync(path.dirname(fiestaFile), { recursive: true });
  fs.writeFileSync(fiestaFile, JSON.stringify(fiesta, null, 2), 'utf8');
});

test.afterAll(() => {
  if (originalFiestaFile === null) fs.rmSync(fiestaFile, { force: true });
  else fs.writeFileSync(fiestaFile, originalFiestaFile);
});

test('client and guest portals load as public experiences without admin links', async ({ page }) => {
  test.setTimeout(180_000);

  const clientResponse = await page.goto(`/portal/c/${accessKey}`, { waitUntil: 'domcontentloaded' });
  expect(clientResponse?.status()).toBeLessThan(400);
  await expect(page.getByRole('heading', { name: EVENT_NAME })).toBeVisible();
  await expect(page.getByText('Portal VIP', { exact: true })).toBeVisible();
  await expectHealthyPublicPage(page);

  const guestResponse = await page.goto(
    `/invitacion/${fiestaId}/invitado/${GUEST_ID}?token=${encodeURIComponent(GUEST_TOKEN)}`,
    { waitUntil: 'domcontentloaded' },
  );
  expect(guestResponse?.status()).toBeLessThan(400);
  await expect(page.getByRole('heading', { name: EVENT_NAME })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Invitada E2E' })).toBeVisible();
  await expect(page.getByTestId('guest-portal-table')).toContainText('Mesa 8');
  await expect(page.getByTestId('guest-portal-qr')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Muro social' })).toBeVisible();
  const drinksButton = page.getByRole('button', { name: 'Carta de tragos' });
  await expect(drinksButton).toBeVisible();
  await drinksButton.click();
  await expect(page.getByRole('heading', { name: 'Elegí tu trago' })).toBeVisible();
  await expectHealthyPublicPage(page);
});

test('social wall, bar, totem and live mural render without broken public states', async ({ page }) => {
  test.setTimeout(240_000);
  const routes = [
    { path: `/evento/social/${fiestaId}`, marker: EVENT_NAME },
    { path: `/evento/barra/${fiestaId}`, marker: 'Elegí tu Trago' },
    { path: `/evento/totem/${fiestaId}/principal`, marker: 'Bienvenidos' },
    { path: `/evento/muro-en-vivo/${fiestaId}`, marker: 'Muro social en vivo' },
  ];

  for (const route of routes) {
    const pageErrors: string[] = [];
    const onPageError = (error: Error) => pageErrors.push(error.message);
    page.on('pageerror', onPageError);
    try {
      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), route.path).toBeLessThan(400);
      await expect(page.getByText(route.marker, { exact: false }).first(), route.path).toBeVisible();
      await expectHealthyPublicPage(page);
      expect(pageErrors, `${route.path}: ${pageErrors.join(' | ')}`).toEqual([]);
    } finally {
      page.off('pageerror', onPageError);
    }
  }
});
