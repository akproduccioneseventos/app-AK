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
 *
 * **La pantalla que prueba este archivo es `/evento/fotocabina/[fiestaId]`.**
 * Queda escrita entera a proposito: el enlace se arma con una variable, y asi
 * el control "Lo que se dijo es lo que es" puede ver que esta pantalla SI tiene
 * quien la pruebe.
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
  //
  // **Se espera hasta 15 segundos, no se mira una sola vez.** Con la máquina cargada —las 182
  // pruebas corriendo de a tres— la cámara de mentira tarda más en engancharse, y esta prueba
  // frenó la verificación entera dos veces por eso, siempre pasando cuando corría sola. Lo que
  // se comprueba sigue siendo lo mismo: que la cámara entre. Sólo se le da tiempo.
  let hayCamara = false;
  for (let intento = 0; intento < 15 && !hayCamara; intento++) {
    hayCamara = await page.evaluate(() => {
      const v = document.querySelector('video');
      return Boolean(v && (v as HTMLVideoElement).srcObject);
    });
    if (!hayCamara) await page.waitForTimeout(1_000);
  }
  expect(hayCamara, 'la camara entra en la pantalla').toBe(true);

  // Disparar la tanda: el boton de sacar la foto, por su nombre fijo. Antes se buscaba "cualquier
  // boton que diga foto", y "Personalizar foto" tambien entraba (Codex, auditoria 79).
  const disparar = page.getByTestId('boton-sacar-foto');
  await expect(disparar, 'hay un boton para sacar la foto').toBeEnabled({ timeout: 15_000 });
  await disparar.click();

  // Lo que se espera es EL RESULTADO: la tira armada en pantalla. Antes se esperaban 45 segundos
  // fijos y se miraba solo que no hubiera errores: la prueba pasaba con la captura rota
  // (Codex, auditoria 79, orden 129). La tanda son tres fotos con cuenta regresiva.
  const tira = page.locator('img[alt="Captura Final"]');
  await expect(tira, 'la tira de recuerdo aparece en pantalla').toBeVisible({ timeout: 90_000 });
  await page.screenshot({ path: 'test-results/fotocabina/2-despues-de-la-tanda.png', fullPage: true });

  const fuente = (await tira.getAttribute('src')) || '';
  expect(fuente, 'la tira es una imagen sacada en este navegador').toMatch(/^data:image\/(jpeg|png)/);
  const medidas = await tira.evaluate((img: HTMLImageElement) => ({ ancho: img.naturalWidth, alto: img.naturalHeight }));
  expect(medidas.ancho, 'la tira tiene contenido').toBeGreaterThan(100);
  expect(medidas.alto, 'la tira tiene contenido').toBeGreaterThan(100);
  // Es una TIRA de la tanda, no una sola foto: estan las miniaturas de cada foto.
  await expect(page.locator('img[alt^="Foto "][alt$=" de la tanda"]'), 'las fotos de la tanda').toHaveCount(3);
  await expect(page.getByText('No se pudo armar la tira'), 'la tira se armo, no quedo la ultima foto sola').toHaveCount(0);

  const textoFinal = (await page.locator('body').innerText().catch(() => '')) || '';
  fs.writeFileSync(
    'test-results/fotocabina/lo-que-dice.txt',
    `TEXTO:\n${textoFinal.replace(/\s+/g, ' ').trim()}\n\nERRORES JS:\n${erroresJs.join('\n')}\n`,
  );

  // Lo que NO puede pasar: que se rompa por dentro o muestre basura tecnica.
  expect(erroresJs.join('\n'), 'la pantalla no se rompe por dentro').toBe('');
  expect(textoFinal, 'no muestra texto tecnico despues de la tanda').not.toMatch(
    /undefined|firestore|is not a valid|Algo sali[oó] mal|todavia se esta preparando/i,
  );
});
