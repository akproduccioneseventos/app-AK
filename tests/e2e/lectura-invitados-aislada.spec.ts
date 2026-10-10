import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';
import {
  crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, ponerSesionDelEquipo, SESSION_SECRET,
} from './helpers/fiesta-de-prueba';
import { createPortalSession } from '../../src/lib/security/portal-session';

/**
 * Orden 114 (Codex, PER01): `getInvitados` (src/app/actions/fiesta/invitados.actions.ts) devuelve la
 * lista entera con telefono y credencial, y la usa la pantalla de recepcion. Esta prueba contrasta el
 * transporte REAL (la pagina compilada, servida por el servidor de la prueba) con invitados SINTETICOS
 * y estos roles:
 *   - anonimo (sin cookies)                         -> no recibe la lista
 *   - cliente del portal de OTRA fiesta             -> no la recibe
 *   - cookie de sesion con firma falsa              -> no la recibe (pasa el portero, lo frena el servidor)
 *   - equipo con sesion                             -> la recibe, y la recepcion muestra el nombre
 * El rol "cron" NO aplica por navegador: no hay pantalla ni cookie para el. Lo cubre
 * `src/__tests__/la-lista-de-invitados-pide-sesion.test.ts` (existe). El QR por nombre del invitado
 * (decision del dueno) no se toca: esta prueba no lo mira.
 *
 * "No la recibe" se comprueba sobre el HTML y el texto que llegan al navegador: ni el nombre ni el
 * telefono sinteticos pueden aparecer en ninguno de los dos.
 */
const NOMBRE = 'Zacarias Sintetico Ciento Catorce';
const TELEFONO = '098114114114';
const ID = `e2e_114_lectura_${crypto.randomUUID()}`;
const OTRA_ID = `e2e_114_otra_${crypto.randomUUID()}`;
const CLAVE_OTRA = 'clave-ficticia-otra-114';

test.beforeAll(() => {
  const fiesta: any = crearFiestaDeEstaNoche({ id: ID });
  fiesta.invitados = [{
    id: 'inv_114_sintetico', guestAccessToken: 'token-114-sintetico', nombre: NOMBRE,
    rsvp: 'Confirmado', categoria: 'Adulto', contacto: TELEFONO, partySize: 1, tableNumber: '1',
    dietaryRestriction: 'Ninguna',
  }];
  guardarFiesta(fiesta);
  const otra: any = crearFiestaDeEstaNoche({ id: OTRA_ID, clavePortal: CLAVE_OTRA });
  otra.invitados = [];
  guardarFiesta(otra);
});
test.afterAll(() => { borrarFiesta(ID); borrarFiesta(OTRA_ID); });

async function nadaDeLaLista(page: any) {
  const html = await page.content();
  const texto = await page.locator('body').innerText().catch(() => '');
  for (const secreto of [NOMBRE, TELEFONO, 'token-114-sintetico']) {
    expect(html).not.toContain(secreto);
    expect(texto).not.toContain(secreto);
  }
}

test('anonimo: la recepcion lo manda al ingreso y no le llega la lista', async ({ page }) => {
  await page.goto(`/recepcion/${ID}`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/login/, { timeout: 60_000 });
  await nadaDeLaLista(page);
});

test('cliente del portal de OTRA fiesta: no recibe la lista', async ({ page, context, baseURL }) => {
  await context.addCookies([{
    name: 'ak_portal_session', value: createPortalSession(OTRA_ID, CLAVE_OTRA),
    url: baseURL!, httpOnly: true, sameSite: 'Lax',
  }]);
  await page.goto(`/recepcion/${ID}`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/login/, { timeout: 60_000 });
  await nadaDeLaLista(page);
});

test('cookie de sesion con firma falsa: pasa el portero pero el servidor no entrega la lista', async ({ page, context, baseURL }) => {
  const payload = `v1.${Date.now() + 60 * 60 * 1000}.${crypto.randomUUID()}`;
  const firmaFalsa = crypto.createHmac('sha256', `${SESSION_SECRET}-otro`).update(payload).digest('hex');
  await context.addCookies([{
    name: 'ak_session', value: `${payload}.${firmaFalsa}`, url: baseURL!, httpOnly: true, sameSite: 'Lax',
  }]);
  await page.goto(`/recepcion/${ID}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForLoadState('load').catch(() => {});
  await nadaDeLaLista(page);
  await expect(page.getByRole('heading', { name: NOMBRE })).toHaveCount(0);
});

test('equipo con sesion: la recepcion muestra al invitado sintetico', async ({ page, context, baseURL }) => {
  await ponerSesionDelEquipo(context, baseURL);
  await page.goto(`/recepcion/${ID}`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(new RegExp(`/recepcion/${ID}`));
  await expect(page.getByRole('heading', { name: NOMBRE })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('Mesa 1').first()).toBeVisible();
});
