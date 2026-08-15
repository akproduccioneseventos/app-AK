import { test } from '@playwright/test';
import crypto from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';

/**
 * Fotos de las pantallas que ve el cliente y el invitado.
 *
 * No comprueba nada: saca las fotos para que alguien las mire con ojo de
 * vendedor. Las pruebas de siempre controlan que las pantallas FUNCIONEN; esto
 * es para ver si además se ven bien, que es otra cosa y no la miraba nadie.
 *
 * Corre sólo cuando se pide, con AK_FOTOS=true, para no sumar minutos a cada
 * corrida.
 */

const ACTIVA = process.env.AK_FOTOS === 'true';
const ID = 'e2e_fotos_app';
const CLAVE = 'clave-fotos-e2e';
const SALIDA = path.join(process.cwd(), 'capturas');
const SESSION_SECRET = 'playwright-session-secret-with-enough-entropy';

/** Las pantallas del equipo piden sesión: sin esto redirigen al ingreso. */
function crearTokenDeSesion() {
  const payload = `v1.${Date.now() + 60 * 60 * 1000}.${crypto.randomUUID()}`;
  const firma = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${firma}`;
}

const FIESTA = crearFiestaDeEstaNoche({ id: ID, clavePortal: CLAVE });

const PANTALLAS: Array<{ nombre: string; url: string }> = [
  { nombre: 'landing-publica', url: '/' },
  { nombre: 'simulador-de-presupuesto', url: '/simulador-de-presupuesto' },
  { nombre: 'portal-del-cliente', url: `/portal/c/${CLAVE}` },
  { nombre: 'portal-cliente-por-id', url: `/portal-cliente/${ID}` },
  { nombre: 'muro-social', url: `/evento/social/${ID}` },
  { nombre: 'buzon-de-deseos', url: `/evento/buzon/${ID}` },
  { nombre: 'fotocabina', url: `/evento/fotocabina/${ID}` },
  { nombre: 'galeria-de-la-fiesta', url: `/evento/galeria/${ID}` },
  { nombre: 'confirmar-invitados', url: `/evento/actual/checkin?fiestaId=${ID}&guestId=${FIESTA.invitados?.[0]?.id ?? ''}` },
  { nombre: 'presentacion-led', url: '/presentacion-led' },
];

test.describe('fotos de la app', () => {
  test.skip(!ACTIVA, 'Se corre a pedido con AK_FOTOS=true');

  test.beforeAll(() => {
    fs.mkdirSync(SALIDA, { recursive: true });
    guardarFiesta(FIESTA);
  });

  test.afterAll(() => {
    borrarFiesta(ID);
  });

  for (const pantalla of PANTALLAS) {
    test(`foto de ${pantalla.nombre}`, async ({ page }, testInfo) => {
      test.setTimeout(90_000);
      const dispositivo = testInfo.project.name.includes('mobile') ? 'celular' : 'escritorio';
      await page.goto(pantalla.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);

      /**
       * Bajar despacio hasta el final antes de fotografiar.
       *
       * Varias secciones aparecen recién cuando entran en pantalla. Sin este
       * paseo, la foto de página completa las agarra invisibles y sale medio
       * blanca: parece una pantalla rota cuando en realidad está bien.
       */
      await page.evaluate(async () => {
        const alto = window.innerHeight;
        for (let y = 0; y < document.body.scrollHeight; y += alto) {
          window.scrollTo(0, y);
          await new Promise(r => setTimeout(r, 250));
        }
        window.scrollTo(0, 0);
        await new Promise(r => setTimeout(r, 400));
      });
      await page.waitForTimeout(1200);

      // La primera pantalla, que es la que decide si el cliente sigue mirando.
      await page.screenshot({
        path: path.join(SALIDA, `${dispositivo}-${pantalla.nombre}-primera-vista.png`),
      });
      await page.screenshot({
        path: path.join(SALIDA, `${dispositivo}-${pantalla.nombre}.png`),
        fullPage: true,
      });
    });
  }
});

/**
 * Las pantallas del equipo también venden.
 *
 * El dueño las abre adelante del cliente en la reunión: el presupuesto, el
 * calendario, la lista de invitados. Una pantalla interna desprolija se ve igual
 * que una pública desprolija.
 */
const PANTALLAS_DEL_EQUIPO: Array<{ nombre: string; url: string }> = [
  { nombre: 'equipo-eventos', url: '/eventos' },
  { nombre: 'equipo-calendario', url: '/calendario' },
  { nombre: 'equipo-prospectos', url: '/contabilidad/crm' },
  { nombre: 'equipo-presupuestos', url: '/presupuestos/nuevo' },
  { nombre: 'equipo-clientes', url: '/customers' },
  { nombre: 'equipo-panel-contable', url: '/empresa/contabilidad' },
  { nombre: 'equipo-facturas', url: '/invoices' },
  { nombre: 'equipo-pagos-rapidos', url: '/pagos-rapidos' },
  { nombre: 'equipo-menus', url: '/empresa/menus' },
  { nombre: 'equipo-empleados', url: '/empleados' },
  { nombre: 'equipo-proveedores', url: '/proveedores' },
  { nombre: 'equipo-alertas', url: '/alertas' },
  { nombre: 'equipo-incidentes', url: '/incidentes' },
  { nombre: 'equipo-aprobaciones', url: '/aprobaciones' },
  { nombre: 'equipo-guias-de-armado', url: '/playbooks' },
  { nombre: 'equipo-ajustes', url: '/settings' },
];

test.describe('fotos de las pantallas del equipo', () => {
  test.skip(!ACTIVA, 'Se corre a pedido con AK_FOTOS=true');

  test.beforeAll(() => {
    fs.mkdirSync(SALIDA, { recursive: true });
  });

  test.beforeEach(async ({ context, baseURL }) => {
    if (!baseURL) throw new Error('Playwright baseURL no configurada.');
    await context.addInitScript(() => {
      window.localStorage.setItem('ak_session', 'true');
      window.sessionStorage.setItem('ak_session', 'true');
    });
    await context.addCookies([
      { name: 'ak_session', value: crearTokenDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);
  });

  for (const pantalla of PANTALLAS_DEL_EQUIPO) {
    test(`foto de ${pantalla.nombre}`, async ({ page }, testInfo) => {
      test.setTimeout(120_000);
      const dispositivo = testInfo.project.name.includes('mobile') ? 'celular' : 'escritorio';
      await page.goto(pantalla.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4000);
      await page.screenshot({
        path: path.join(SALIDA, `${dispositivo}-${pantalla.nombre}-primera-vista.png`),
      });
    });
  }
});
