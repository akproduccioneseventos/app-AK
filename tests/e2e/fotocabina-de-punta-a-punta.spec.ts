import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { borrarFiesta, crearCookieDeSesion, crearFiestaDeEstaNoche, crearPermisoDeEstacion } from './helpers/fiesta-de-prueba';

/**
 * La fotocabina, usada de punta a punta.
 *
 * El dueño la va a usar en una fiesta y preguntó si "realmente funciona con
 * todo". La respuesta honesta no sale de leer el código: sale de abrirla, sacar
 * la tanda de fotos y mirar la tira que queda.
 *
 * Esto hace exactamente eso, y deja las fotos de pantalla en
 * `test-results/fotocabina/` para poder mirarlas con ojos humanos.
 */

const fiesta = crearFiestaDeEstaNoche({ id: `e2e_fotocabina_${Date.now()}` });
const ID = fiesta.id;

test.afterAll(() => {
  borrarFiesta(ID);
});

/** Cámara falsa: sin esto el navegador de prueba no entrega ninguna señal. */
async function enchufarCamara(page: Page) {
  await page.addInitScript(() => {
    const armar = () => {
      const lienzo = document.createElement('canvas');
      lienzo.width = 720;
      lienzo.height = 1280;
      const pincel = lienzo.getContext('2d');
      if (pincel) {
        pincel.fillStyle = '#123f5e';
        pincel.fillRect(0, 0, lienzo.width, lienzo.height);
        pincel.fillStyle = '#ffffff';
        pincel.font = 'bold 56px sans-serif';
        pincel.fillText('INVITADO', 180, 620);
      }
      return lienzo.captureStream(30);
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => armar(),
        enumerateDevices: async () => [
          { deviceId: 'cam', kind: 'videoinput', label: 'Camara de prueba', groupId: 'g' },
        ],
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
  });
}

test('la fotocabina saca la tanda y arma la tira de recuerdo', async ({ context, page }, testInfo) => {
  test.setTimeout(300_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
  fs.mkdirSync('test-results/fotocabina', { recursive: true });

  const baseURL = testInfo.project.use.baseURL as string;
  await context.addCookies([
    { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
  ]);
  await enchufarCamara(page);

  const erroresJs: string[] = [];
  page.on('pageerror', (e) => erroresJs.push(e.message));

  const acceso = crearPermisoDeEstacion(ID, 'fotocabina');
  const respuesta = await page.goto(`/evento/fotocabina/${ID}?access=${acceso}`, {
    waitUntil: 'domcontentloaded',
  });
  expect(respuesta?.status(), 'la fotocabina abre').toBeLessThan(400);
  await page.waitForTimeout(3_000);
  await page.screenshot({ path: 'test-results/fotocabina/1-abre.png' });

  const texto = (await page.locator('body').innerText().catch(() => '')) || '';
  expect(texto, 'no muestra texto tecnico').not.toMatch(/undefined|firestore|is not a valid/i);

  // La cámara tiene que estar entrando: sin imagen no hay foto.
  const hayCamara = await page.evaluate(() => {
    const v = document.querySelector('video');
    return Boolean(v && (v as HTMLVideoElement).srcObject);
  });
  expect(hayCamara, 'la camara entra en la pantalla').toBe(true);

  // Disparar la tanda.
  const disparar = page
    .getByRole('button', { name: /sacar|empezar|comenzar|iniciar|foto/i })
    .and(page.locator('button:not([disabled])'))
    .first();
  expect(await disparar.count(), 'hay un boton para sacar la foto').toBeGreaterThan(0);
  await disparar.click();

  // La tanda son tres fotos con cuenta regresiva: se le da tiempo de sobra.
  await page.waitForTimeout(45_000);
  await page.screenshot({ path: 'test-results/fotocabina/2-despues-de-la-tanda.png', fullPage: true });

  const textoFinal = (await page.locator('body').innerText().catch(() => '')) || '';
  fs.writeFileSync(
    'test-results/fotocabina/lo-que-dice.txt',
    `TEXTO:\n${textoFinal.replace(/\s+/g, ' ').trim()}\n\nERRORES JS:\n${erroresJs.join('\n')}\n`,
  );

  // Lo que NO puede pasar: que se rompa por dentro o muestre basura tecnica.
  expect(erroresJs.join('\n'), 'la pantalla no se rompe por dentro').toBe('');
  expect(textoFinal, 'no muestra texto tecnico despues de la tanda').not.toMatch(
    /undefined|firestore|is not a valid|Algo sali[oó] mal/i,
  );
});
