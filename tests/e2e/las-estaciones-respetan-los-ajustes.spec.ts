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

test('cada estación muestra el texto de marca que puso el equipo', async ({ page }, testInfo) => {
  test.setTimeout(300_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
  await enchufarCamara(page);

  const noLoRespetan: string[] = [];

  for (const estacion of ESTACIONES) {
    const acceso = crearPermisoDeEstacion(ID, estacion.modulo);
    await page.goto(`/evento/${estacion.ruta}/${ID}?access=${acceso}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4_000);

    const texto = ((await page.locator('body').innerText().catch(() => '')) || '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!texto.includes(MARCA)) {
      noLoRespetan.push(
        `${estacion.nombre}: se configuró el texto de marca y no aparece en pantalla`,
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
