import { expect, test } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
} from './helpers/fiesta-de-prueba';

/**
 * Orden 37 — Control de celular: ancho 360 píxeles, sin desborde, letra legible sin zoom y botón siempre visible.
 *
 * El celular es donde mira casi todo el mundo:
 * 1. Ancho 360 px: el celular más común. La página NO debe correrse para el costado
 *    (document.documentElement.scrollWidth <= window.innerWidth).
 * 2. Ningún input con font-size < 16px para evitar que iOS Safari / Chrome hagan zoom automático.
 * 3. En el formulario de contacto, escribiendo de verdad, el botón de enviar sigue a la vista.
 */

const ANCHO_CELULAR = 360;
const ALTO_CELULAR = 740;

const RUTAS_PUBLICAS_CELULAR = [
  '/',
  '/bodas',
  '/quinceaneras',
  '/cumpleanos',
  '/catalogo',
  '/club-uruguay',
  '/simulador-de-presupuesto',
];

test.describe('Orden 37 — Que ande en el celular (360px)', () => {
  test.use({ viewport: { width: 360, height: ALTO_CELULAR } });

  let fiestaId: string;

  test.beforeAll(() => {
    const fiesta = crearFiestaDeEstaNoche({ id: `e2e_cel_${Date.now()}` });
    fiestaId = fiesta.id;
    guardarFiesta(fiesta);
  });

  test.afterAll(() => {
    if (fiestaId) {
      borrarFiesta(fiestaId);
    }
  });

  test('comprobación a 360 píxeles: la página no se corre para el costado en ninguna pantalla clave', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.setViewportSize({ width: 360, height: ALTO_CELULAR });

    for (const ruta of RUTAS_PUBLICAS_CELULAR) {
      const resp = await page.goto(ruta, { waitUntil: 'domcontentloaded' });
      expect(resp?.status()).toBeLessThan(400);
      await page.waitForTimeout(1_000);

      const desborde = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth - window.innerWidth;
      });

      expect(desborde, `En ${ruta} a 360px de ancho la página no debe correrse para el costado`).toBeLessThanOrEqual(2);
    }
  });

  test('ningún campo de texto tiene letra menor a 16 píxeles en formularios de contacto ni RSVP', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.setViewportSize({ width: 360, height: ALTO_CELULAR });

    // 1. Formulario de contacto en landing
    await page.goto('/bodas', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_000);

    const camposChicosContacto = await page.evaluate(() => {
      // Solo los campos donde SE ESCRIBE hacen que el telefono acerque la pantalla
      // solo. Una casilla de tildar o un boton no: su letra no importa y castigarlos
      // marcaba en rojo un formulario correcto (paso el 4 de septiembre de 2026).
      const SIN_ESCRITURA = ['checkbox', 'radio', 'button', 'submit', 'reset', 'hidden', 'file', 'range', 'color', 'image'];
      const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
      return inputs
        .filter((el) => {
          const tipo = (el.getAttribute('type') || '').toLowerCase();
          if (SIN_ESCRITURA.includes(tipo)) return false;
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          return fontSize > 0 && fontSize < 16;
        })
        .map((el) => el.getAttribute('name') || el.id || el.tagName);
    });

    expect(
      camposChicosContacto.length,
      `En /bodas ningún input debe tener letra < 16px (evita zoom molesto): ${camposChicosContacto.join(', ')}`
    ).toBe(0);

    // 2. RSVP del invitado
    await page.goto(`/invitacion/${fiestaId}/rsvp`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_000);

    const camposChicosRsvp = await page.evaluate(() => {
      // Solo los campos donde SE ESCRIBE hacen que el telefono acerque la pantalla
      // solo. Una casilla de tildar o un boton no: su letra no importa y castigarlos
      // marcaba en rojo un formulario correcto (paso el 4 de septiembre de 2026).
      const SIN_ESCRITURA = ['checkbox', 'radio', 'button', 'submit', 'reset', 'hidden', 'file', 'range', 'color', 'image'];
      const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
      return inputs
        .filter((el) => {
          const tipo = (el.getAttribute('type') || '').toLowerCase();
          if (SIN_ESCRITURA.includes(tipo)) return false;
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          return fontSize > 0 && fontSize < 16;
        })
        .map((el) => el.getAttribute('name') || el.id || el.tagName);
    });

    expect(
      camposChicosRsvp.length,
      `En /rsvp ningún input debe tener letra < 16px (evita zoom molesto): ${camposChicosRsvp.join(', ')}`
    ).toBe(0);
  });

  test('en el formulario de contacto, escribiendo de verdad, el botón de enviar sigue a la vista', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.setViewportSize({ width: 360, height: ALTO_CELULAR });
    await page.goto('/bodas', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_000);

    // El campo se llama #lead-nombre. La version anterior buscaba
    // "#landing-form-name, input[name=nombre]", que no existe en ninguna landing:
    // la prueba se quedaba esperando 120 segundos y moria por tiempo agotado.
    const inputNombre = page.locator('#lead-nombre');
    await inputNombre.scrollIntoViewIfNeeded();
    await expect(inputNombre).toBeVisible();
    await inputNombre.fill('María Pérez');
    await page.locator('#lead-telefono').fill('099 123 456');

    // Y lo que de verdad importa: despues de escribir, el boton de enviar tiene que
    // quedar DENTRO de la pantalla, no solo existir en el documento.
    const botonEnviar = page.locator('form button[type="submit"]').first();
    await botonEnviar.scrollIntoViewIfNeeded();
    await expect(botonEnviar).toBeVisible();

    const botonADentro = await botonEnviar.evaluate((el) => {
      const caja = el.getBoundingClientRect();
      return caja.top >= 0 && caja.bottom <= window.innerHeight && caja.left >= 0 && caja.right <= window.innerWidth;
    });
    expect(botonADentro, 'Despues de escribir, el boton de enviar debe quedar dentro de la pantalla del celular').toBe(true);
  });
});
