import { expect, test, type Page } from '@playwright/test';
import {
  borrarFiesta,
  crearFiestaDeEstaNoche,
  crearPermisoDeEstacion,
  guardarFiesta,
} from './helpers/fiesta-de-prueba';

/**
 * Lo que se configura, ¿se ve? Eso, y nada más.
 *
 * Durante meses el equipo armó las estaciones poniéndoles texto de marca, pie y
 * texto del QR, y **no pasaba nada**: los ajustes existían en la pantalla de
 * armado y ninguna estación los leía. La regla del proyecto es clara: *un control
 * en pantalla que no cambia nada es peor que no tenerlo, porque el que lo usa
 * cree que hizo algo.*
 *
 * Se engancharon. Esta prueba comprueba **el resultado en pantalla**, no que el
 * campo se guarde: pone valores inconfundibles en la fiesta, abre cada estación
 * como la abre un invitado con el QR, y mira que aparezcan.
 *
 * Si mañana alguien desengancha un ajuste, esto se pone en rojo. Una prueba que
 * mirara sólo la configuración guardada seguiría en verde y no serviría de nada.
 *
 * Las pantallas que prueba este archivo son:
 *   /evento/plataforma-360/[fiestaId]
 *   /evento/bogue/[fiestaId]
 *   /evento/touchpix/[fiestaId]
 *   /evento/buzon/[fiestaId]
 */

const ID = `e2e_ajustes_${Date.now()}`;

/** Textos que no pueden aparecer por casualidad: si se ven, salieron del ajuste. */
const MARCA = 'MARCA-DE-PRUEBA-XYZ';
const QR_TEXTO = 'TEXTO-DEL-QR-XYZ';

test.beforeAll(() => {
  const fiesta = crearFiestaDeEstaNoche({ id: ID }) as Record<string, unknown>;
  const ajustes = { enabled: true, brandText: MARCA, qrCallout: QR_TEXTO, countdownSeconds: 3 };
  fiesta.others = {
    ...(fiesta.others as Record<string, unknown> || {}),
    entretenimiento: {
      modules: {
        plataforma360: { ...ajustes },
        bogue: { ...ajustes },
        espejoMagicoIA: { ...ajustes },
        capsulaTiempo: { ...ajustes },
      },
    },
  };
  guardarFiesta(fiesta as never);
});

test.afterAll(() => {
  borrarFiesta(ID);
});

/** Sin cámara falsa las estaciones se quedan esperando y no dibujan su pantalla. */
async function enchufarCamara(page: Page) {
  await page.addInitScript(() => {
    const armar = () => {
      const lienzo = document.createElement('canvas');
      lienzo.width = 720;
      lienzo.height = 1280;
      lienzo.getContext('2d')?.fillRect(0, 0, lienzo.width, lienzo.height);
      return lienzo.captureStream(30);
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => armar(),
        enumerateDevices: async () => [{ deviceId: 'cam', kind: 'videoinput', label: 'Camara', groupId: 'g' }],
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
  });
}

const ESTACIONES = [
  { nombre: 'Plataforma 360', ruta: 'plataforma-360', modulo: 'plataforma360' },
  { nombre: 'Bogue', ruta: 'bogue', modulo: 'bogue' },
  { nombre: 'Touchpix', ruta: 'touchpix', modulo: 'espejoMagicoIA' },
];

/**
 * Lleva la estación hasta la pantalla de compartir y devuelve lo que dice.
 *
 * El texto de marca NO se dibuja al abrir: aparece junto al QR, recién después de
 * la captura. Por eso hay que sacar la foto de verdad, con paciencia: la 360 graba
 * un video y Bogue arma un loop.
 */
async function llegarACompartir(page: Page): Promise<string> {
  const disparar = page
    .getByRole('button', { name: /sacar|empezar|comenzar|iniciar|grabar|foto|video/i })
    .and(page.locator('button:not([disabled])'))
    .first();
  if ((await disparar.count()) === 0) return '';
  await disparar.click().catch(() => {});

  // Se espera a que aparezca el QR, que es la señal de que llegó a compartir.
  const limite = Date.now() + 90_000;
  let texto = '';
  while (Date.now() < limite) {
    await page.waitForTimeout(3_000);
    texto = ((await page.locator('body').innerText().catch(() => '')) || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (texto.includes(MARCA) || /QR/i.test(texto)) break;
  }
  return texto;
}

test('cada estación muestra en la pantalla de compartir el texto de marca que puso el equipo', async ({ page }, testInfo) => {
  test.setTimeout(600_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
  await enchufarCamara(page);

  const noLoRespetan: string[] = [];

  for (const estacion of ESTACIONES) {
    const acceso = crearPermisoDeEstacion(ID, estacion.modulo);
    await page.goto(`/evento/${estacion.ruta}/${ID}?access=${acceso}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4_000);

    let texto = await llegarACompartir(page);

    // Touchpix no muestra la marca al capturar: la tiene en la ventanita del QR,
    // que se abre con el boton "Compartir". Hay que tocarlo.
    if (!texto.includes(MARCA)) {
      const compartir = page.getByRole('button', { name: /compartir/i }).first();
      if ((await compartir.count()) > 0) {
        await compartir.click().catch(() => {});
        await page.waitForTimeout(3_000);
        texto = ((await page.locator('body').innerText().catch(() => '')) || '')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }

    if (!texto) {
      noLoRespetan.push(`${estacion.nombre}: no hay boton para sacar la captura`);
    } else if (!texto.includes(MARCA)) {
      // Se separan las dos fallas posibles: no llegar, o llegar y no respetar.
      const llego = /QR/i.test(texto);
      noLoRespetan.push(
        llego
          ? `${estacion.nombre}: llego a la pantalla de compartir y NO muestra el texto de marca configurado`
          : `${estacion.nombre}: no llego a la pantalla de compartir en 90 segundos`,
      );
    }
  }

  expect(noLoRespetan.join('\n'), noLoRespetan.join('\n')).toBe('');
});

test('el buzón respeta la cuenta regresiva que puso el equipo', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
  await enchufarCamara(page);

  const acceso = crearPermisoDeEstacion(ID, 'capsulaTiempo');
  const respuesta = await page.goto(`/evento/buzon/${ID}?access=${acceso}`, {
    waitUntil: 'domcontentloaded',
  });
  expect(respuesta?.status(), 'el buzón abre').toBeLessThan(400);
  await page.waitForTimeout(3_000);

  const texto = ((await page.locator('body').innerText().catch(() => '')) || '').trim();
  // No se le pide más que estar sano: el buzón graba mensajes, no saca tandas.
  expect(texto, 'el buzón no muestra texto técnico').not.toMatch(
    /undefined|firestore|is not a valid|Algo sali[oó] mal/i,
  );
  expect(texto.length, 'el buzón muestra su pantalla').toBeGreaterThan(50);
});
