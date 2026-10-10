// @ts-nocheck
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import admin from 'firebase-admin';
import { expect, test } from '@playwright/test';
import {ponerSesionDelEquipo,crearFiestaDeEstaNoche,borrarFiesta} from './helpers/fiesta-de-prueba';

const SESSION_SECRET = 'playwright-session-secret-with-enough-entropy';
const EMULATOR = '127.0.0.1:8085';
const RUN_ID = crypto.randomUUID();
const FIESTA_ID = `ak-entorno-aislado-${process.pid}-${RUN_ID}`;
const TEMP_DIR = path.join(os.tmpdir(), FIESTA_ID);
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'demo-ak-producciones';
let firestore;
let firebaseApp;

test.skip(process.env.AK_ENTORNO_AISLADO !== 'true', 'Solo corre contra el entorno temporal aislado.');

function cookieDeSesion() {
  const payload = `v1.${Date.now() + 60 * 60 * 1000}.${crypto.randomUUID()}`;
  return `${payload}.${crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')}`;
}

async function exigirAislamiento(baseURL) {
  if (process.env.FIRESTORE_EMULATOR_HOST !== EMULATOR) {
    throw new Error(`Bloqueado: FIRESTORE_EMULATOR_HOST debe ser exactamente ${EMULATOR}.`);
  }
  if (!PROJECT_ID.startsWith('demo-')) throw new Error('Bloqueado: se exige un proyecto Firebase demo-.');
  if (!process.env.PLAYWRIGHT_BASE_URL) {
    throw new Error('Bloqueado: usar un servidor externo ya iniciado con Firestore emulator; el webServer normal fuerza JSON local.');
  }
  const url = new URL(baseURL);
  if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
    throw new Error('Bloqueado: la aplicación debe estar en loopback, nunca en un entorno real.');
  }
}

test.beforeAll(async () => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL;
  await exigirAislamiento(baseURL);
  firebaseApp = admin.initializeApp({ projectId: PROJECT_ID }, `ak-qa-${RUN_ID}`);
  firestore = firebaseApp.firestore();
  const base=crearFiestaDeEstaNoche({id:FIESTA_ID});
  const fixture = {
    ...base,
    id: FIESTA_ID,
    configuracion: { ...base.configuracion,nombreEvento: `QA carga ${RUN_ID}` },
    personalAsignado: [],
    estado: 'planificacion',
    listaDeCargaOperativa: {
      id: `lista-${RUN_ID}`,
      notasGenerales: '',
      categorias: [{
        id: `categoria-${RUN_ID}`,
        nombre: 'Equipo QA aislado',
        items: [{
          id: `item-${RUN_ID}`,
          nombre: `Equipo de prueba ${RUN_ID}`,
          cantidad: '1',
          unidad: 'Uds.',
          cargado: false,
        }],
      }],
    },
  };
  await fs.mkdir(TEMP_DIR, { recursive: true });
  const fixturePath = path.join(TEMP_DIR, 'fiesta.json');
  await fs.writeFile(fixturePath, JSON.stringify(fixture), 'utf8');
  const ownFixture = JSON.parse(await fs.readFile(fixturePath, 'utf8'));
  await firestore.collection('fiestas').doc(FIESTA_ID).set(ownFixture);
});

test.afterAll(async () => {
  borrarFiesta(FIESTA_ID);
  if (firestore) await firestore.collection('fiestas').doc(FIESTA_ID).delete().catch(() => {});
  if (firebaseApp) await firebaseApp.delete().catch(() => {});
  if (path.dirname(path.resolve(TEMP_DIR)) === path.resolve(os.tmpdir())
    && path.basename(TEMP_DIR) === FIESTA_ID && FIESTA_ID.startsWith('ak-entorno-aislado-')) {
    await fs.rm(TEMP_DIR, { recursive: true, force: true });
  }
});

test('carga operativa guarda en Firestore y otro consumidor la recupera', async ({ browser, page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Un navegador alcanza para este recorrido.');
  test.setTimeout(240_000);
  const baseURL = testInfo.project.use.baseURL;
  await exigirAislamiento(baseURL);

  const context = page.context();
  await context.addInitScript(() => {
    localStorage.setItem('ak_session', 'true');
    sessionStorage.setItem('ak_session', 'true');
  });
  await context.addCookies([{
    name: 'ak_session',
    value: cookieDeSesion(),
    url: baseURL,
    httpOnly: true,
    sameSite: 'Lax',
  }]);

  const item = `Equipo de prueba ${RUN_ID}`;
  await ponerSesionDelEquipo(context,baseURL);
  await page.goto(`/fiestas/nueva/carga-operativa?fiestaId=${FIESTA_ID}`, { waitUntil: 'domcontentloaded' });
  const cargado = page.getByRole('checkbox', { name: `Marcar ${item} como cargado` });
  await expect(cargado).toBeVisible();
  await cargado.check();
  await expect(cargado).toBeChecked();

  const ref = firestore.collection('fiestas').doc(FIESTA_ID);
  await expect.poll(async () => {
    const snap = await ref.get();
    return snap.data()?.listaDeCargaOperativa?.categorias?.[0]?.items?.[0]?.cargado;
  }, { message: 'el cambio de UI debe llegar a Firestore emulator por el guardado real' }).toBe(true);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('checkbox', { name: `Marcar ${item} como cargado` })).toBeChecked();

  const otherContext = await browser.newContext();
  await otherContext.addInitScript(() => {
    localStorage.setItem('ak_session', 'true');
    sessionStorage.setItem('ak_session', 'true');
  });
  await otherContext.addCookies([{
    name: 'ak_session',
    value: cookieDeSesion(),
    url: baseURL,
    httpOnly: true,
    sameSite: 'Lax',
  }]);
  const otherConsumer = await otherContext.newPage();
  await ponerSesionDelEquipo(otherContext,baseURL);
  try {
    await otherConsumer.goto(`/fiestas/nueva/carga-operativa?fiestaId=${FIESTA_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(otherConsumer.getByRole('checkbox', { name: `Marcar ${item} como cargado` })).toBeChecked();
  } finally {
    await otherContext.close();
  }
});
