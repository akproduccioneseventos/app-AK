import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { borrarFiesta, crearFiestaDeEstaNoche, crearPermisoDeEstacion, guardarFiesta } from './helpers/fiesta-de-prueba';

/**
 * ¿CÓMO SE VEN? Foto de pantalla de cada estación, para mirarlas con ojos humanos.
 *
 * Leyendo código no se ve si un botón queda chico, si una pantalla queda vacía o si
 * algo no llega a dibujarse. Eso sólo se ve abriendo la app. Ya nos pasó: **todas
 * las estaciones estaban muertas y los controles daban verde.**
 *
 * Deja las fotos en `test-results/como-se-ven/` y **falla si alguna estación no
 * dibuja su pantalla o muestra texto técnico al invitado.**
 *
 * Las pantallas que prueba este archivo son:
 *   /evento/fotocabina/[fiestaId]
 *   /evento/plataforma-360/[fiestaId]
 *   /evento/bogue/[fiestaId]
 *   /evento/espejo-magico/[fiestaId]
 *   /evento/touchpix/[fiestaId]
 *   /evento/buzon/[fiestaId]
 */

const ID = `e2e_verse_${Date.now()}`;
const MARCA = 'MARCA-DE-PRUEBA-XYZ';

test.beforeAll(() => {
  const fiesta = crearFiestaDeEstaNoche({ id: ID }) as Record<string, unknown>;
  const ajustes = { enabled: true, brandText: MARCA, qrCallout: 'TEXTO-DEL-QR-XYZ' };
  fiesta.others = {
    ...((fiesta.others as Record<string, unknown>) || {}),
    entretenimiento: {
      modules: {
        fotocabina: { ...ajustes },
        plataforma360: { ...ajustes },
        bogue: { ...ajustes },
        espejoMagicoIA: { ...ajustes },
        capsulaTiempo: { ...ajustes },
      },
    },
  };
  guardarFiesta(fiesta as never);
});

test.afterAll(() => borrarFiesta(ID));

async function enchufarCamara(page: Page) {
  await page.addInitScript(() => {
    const armar = () => {
      const l = document.createElement('canvas');
      l.width = 720; l.height = 1280;
      const p = l.getContext('2d');
      if (p) { p.fillStyle = '#123f5e'; p.fillRect(0, 0, l.width, l.height); }
      return l.captureStream(30);
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => armar(),
        enumerateDevices: async () => [{ deviceId: 'cam', kind: 'videoinput', label: 'Camara', groupId: 'g' }],
        addEventListener: () => {}, removeEventListener: () => {},
      },
    });
  });
}

const ESTACIONES = [
  { nombre: 'fotocabina', ruta: 'fotocabina', modulo: 'fotocabina' },
  { nombre: 'plataforma-360', ruta: 'plataforma-360', modulo: 'plataforma360' },
  { nombre: 'bogue', ruta: 'bogue', modulo: 'bogue' },
  { nombre: 'espejo-magico', ruta: 'espejo-magico', modulo: 'espejoMagicoIA' },
  { nombre: 'touchpix', ruta: 'touchpix', modulo: 'espejoMagicoIA' },
  { nombre: 'buzon', ruta: 'buzon', modulo: 'capsulaTiempo' },
];

test('las seis estaciones se dibujan y no le muestran texto tecnico al invitado', async ({ page }, testInfo) => {
  test.setTimeout(420_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
  fs.mkdirSync('test-results/como-se-ven', { recursive: true });
  await enchufarCamara(page);

  const problemas: string[] = [];

  for (const e of ESTACIONES) {
    const erroresJs: string[] = [];
    page.on('pageerror', (x) => erroresJs.push(x.message));

    const acceso = crearPermisoDeEstacion(ID, e.modulo);
    await page.goto(`/evento/${e.ruta}/${ID}?access=${acceso}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6_000);
    await page.screenshot({ path: `test-results/como-se-ven/${e.nombre}.png`, fullPage: true });

    const texto = ((await page.locator('body').innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
    const botones = await page.locator('button:not([disabled])').count();
    fs.writeFileSync(
      `test-results/como-se-ven/${e.nombre}.txt`,
      `BOTONES: ${botones}\n\nTEXTO:\n${texto}\n\nERRORES:\n${erroresJs.join('\n')}\n`,
    );

    if (texto.length < 40) problemas.push(`${e.nombre}: no dibuja su pantalla (casi no muestra texto)`);
    if (botones === 0) problemas.push(`${e.nombre}: no tiene ningun boton para tocar`);
    if (/undefined|firestore|is not a valid|Algo sali[oó] mal/i.test(texto)) {
      problemas.push(`${e.nombre}: le muestra texto tecnico al invitado`);
    }
    if (erroresJs.length > 0) problemas.push(`${e.nombre}: se rompe por dentro (${erroresJs[0]})`);
  }

  expect(problemas.join('\n'), problemas.join('\n')).toBe('');
});
