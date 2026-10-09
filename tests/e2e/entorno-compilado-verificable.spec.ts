import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, leerFiesta } from './helpers/fiesta-de-prueba';

/**
 * Orden 114: el entorno de la prueba tiene que poder verificarse, no suponerse.
 *  1) /api/health dice QUE CODIGO atiende (`version`: commit + "compilada <fecha>", grabado por
 *     scripts/build-next-with-memory.mjs). "desconocida" o vacia = no se sabe que se probo.
 *  2) Aislamiento: ninguna credencial real. Con las claves de mentira de la corrida, health informa
 *     gemini / mercadoPago / instagram / googleWorkspace / mail en falso; si alguno da true, el
 *     servidor esta leyendo credenciales de verdad (p. ej. un .env.local) y la prueba no es aislada.
 *     El campo `environment` es NODE_ENV (la compilacion siempre dice "production"), por eso NO
 *     sirve para distinguir y no se usa.
 *  3) Persistencia del sembrado: una fiesta sembrada con guardarFiesta (archivo local) la lee la app
 *     por una pantalla publica (/invitacion/<id>), sin tocar ninguna base de produccion.
 * Complementa src/__tests__/la-salud-dice-que-version-atiende.test.ts (que mira la ruta, no el
 * servidor compilado).
 */
const ID = `e2e_114_entorno_${crypto.randomUUID()}`;
const NOMBRE_EVENTO = `Fiesta Sembrada Ciento Catorce ${crypto.randomUUID().slice(0, 8)}`;

test.beforeAll(() => {
  const fiesta: any = crearFiestaDeEstaNoche({ id: ID });
  fiesta.configuracion = { ...fiesta.configuracion, nombreEvento: NOMBRE_EVENTO };
  guardarFiesta(fiesta);
});
test.afterAll(() => borrarFiesta(ID));

test('la salud dice que version atiende (una compilada, no "desconocida")', async ({ request }) => {
  const r = await request.get('/api/health');
  expect(r.ok()).toBe(true);
  const cuerpo = await r.json();
  expect(typeof cuerpo.version).toBe('string');
  expect(cuerpo.version.trim()).not.toBe('');
  expect(cuerpo.version).not.toBe('desconocida');
  // "<commit> · compilada <fecha ISO>"
  expect(cuerpo.version).toMatch(/^\S+ · compilada \d{4}-\d{2}-\d{2}T/);
});

test('el servidor de la prueba esta aislado: ninguna credencial real configurada', async ({ request }) => {
  const cuerpo = await (await request.get('/api/health')).json();
  expect(cuerpo.services.gemini).toBe(false);
  expect(cuerpo.services.mercadoPago).toBe(false);
  expect(cuerpo.services.instagram).toBe(false);
  expect(cuerpo.services.googleWorkspace).toBe(false);
  expect(cuerpo.services.mail).toBe(false);
});

test('una fiesta sembrada se lee despues por la app, desde el archivo local', async ({ page }) => {
  // El sembrado esta en disco (no en produccion)...
  expect(leerFiesta(ID)?.configuracion?.nombreEvento).toBe(NOMBRE_EVENTO);
  // ...y la app lo sirve: el titulo de la invitacion sale del nombre del evento sembrado.
  await page.goto(`/invitacion/${ID}`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(new RegExp(NOMBRE_EVENTO), { timeout: 60_000 });
});
