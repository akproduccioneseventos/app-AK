import { test } from '@playwright/test';
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
