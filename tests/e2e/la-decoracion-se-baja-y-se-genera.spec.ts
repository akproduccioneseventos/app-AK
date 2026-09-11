import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  crearCookieDeSesion,
} from './helpers/fiesta-de-prueba';

/**
 * Orden 55: La decoración entrega lo que promete
 *
 * Bloque 1: Al tocar Exportar PNG, se dispara la descarga de un archivo con extensión .png.
 * Bloque 2: El botón para que la IA decore el salón:
 *           - Muestra Te quedan X de 3 para esta fiesta
 *           - Bloquea al llegar a 3
 *           - Renderiza las fotos generadas
 * Bloque 3: Las notas del equipo no aparecen en el portal del cliente, pero la nota para el cliente sí.
 */

const ID = 'e2e_deco_promete_test';
const CLAVE = 'portal_deco_test';

test.describe('Orden 55: La decoración entrega lo que promete', () => {
  test.beforeAll(() => {
    const fiesta = crearFiestaDeEstaNoche({ id: ID, clavePortal: CLAVE });
    fiesta.decoracion = {
      ...fiesta.decoracion,
      tema: 'Noche de Gala Glam',
      estiloDecoracion: 'elegante',
      paletaColores: { primary: '#c9a96e', secondary: '#f5f0e8', accent: '#2c2c2c' },
      generalNotesDecoracion: 'SECRETO INTERNO: proveedor cobra recargo si terminamos despues de las 4am',
      notaDecoracionParaElCliente: 'Ambientacion con telas doradas, flores naturales y luces calidas en la recepcion',
      fotosGeneradasAi: [
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
      ],
    };
    guardarFiesta(fiesta);
  });

  test.afterAll(() => {
    borrarFiesta(ID);
  });

  test('Bloque 1: Exportar PNG dispara la descarga de un archivo con nombre .png', async ({
    context,
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    await page.goto(`/fiestas/nueva/decoracion?fiestaId=${ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const botonExportar = page.locator('[data-testid="btn-exportar-png"]');
    await expect(botonExportar).toBeVisible();

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await botonExportar.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);
  });

  test('Bloque 2: La IA decoradora muestra cuantas quedan, lista fotos y se bloquea con tope 3', async ({
    context,
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    await page.goto(`/fiestas/nueva/decoracion?fiestaId=${ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const tabEstilo = page.getByRole('tab', { name: /estilo/i });
    if ((await tabEstilo.count()) > 0) {
      await tabEstilo.click();
      await page.waitForTimeout(1000);
    }

    const btnAi = page.locator('[data-testid="btn-generar-salon-ai"]');
    await expect(btnAi).toBeVisible();
    await expect(btnAi).toContainText('Ver el salón decorado (imagen con IA)');

    const contador = page.locator('[data-testid="contador-fotos-ai"]');
    await expect(contador).toBeVisible();
    await expect(contador).toContainText('Te quedan 2 de 3 para esta fiesta');

    const galeria = page.locator('[data-testid="galeria-fotos-ai"]');
    await expect(galeria).toBeVisible();
    await expect(page.locator('[data-testid^="foto-generada-ai-"]')).toHaveCount(1);
  });

  test('Bloque 2 (tope): Con tope de 3 imagenes agotado, el boton queda deshabilitado y no gasta', async ({
    context,
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    const topeId = `${ID}_tope`;
    const fiestaTope = crearFiestaDeEstaNoche({ id: topeId });
    fiestaTope.decoracion = {
      ...fiestaTope.decoracion,
      fotosGeneradasAi: [
        'https://images.unsplash.com/photo-1?w=800',
        'https://images.unsplash.com/photo-2?w=800',
        'https://images.unsplash.com/photo-3?w=800',
      ],
    };
    guardarFiesta(fiestaTope);

    try {
      const baseURL = testInfo.project.use.baseURL as string;
      await context.addCookies([
        { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
      ]);

      await page.goto(`/fiestas/nueva/decoracion?fiestaId=${topeId}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const tabEstilo = page.getByRole('tab', { name: /estilo/i });
      if ((await tabEstilo.count()) > 0) {
        await tabEstilo.click();
        await page.waitForTimeout(1000);
      }

      const btnAi = page.locator('[data-testid="btn-generar-salon-ai"]');
      await expect(btnAi).toBeVisible();
      await expect(btnAi).toBeDisabled();

      const contador = page.locator('[data-testid="contador-fotos-ai"]');
      await expect(contador).toContainText('Te quedan 0 de 3 para esta fiesta');
    } finally {
      borrarFiesta(topeId);
    }
  });

  test('Bloque 3: Las notas del equipo no aparecen en el portal del cliente, pero las notas del cliente si', async ({
    context,
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    await page.goto(`/fiestas/nueva/decoracion?fiestaId=${ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const tabInspiracion = page.getByRole('tab', { name: /inspiración/i });
    if ((await tabInspiracion.count()) > 0) {
      await tabInspiracion.click();
      await page.waitForTimeout(1000);
    }

    const textareaEquipo = page.locator('[data-testid="textarea-notas-equipo"]');
    const textareaCliente = page.locator('[data-testid="textarea-notas-cliente"]');

    await expect(page.getByText('Notas del equipo — el cliente no las ve')).toBeVisible();
    await expect(page.getByText('Para el cliente — esto se publica en su portal')).toBeVisible();
    await expect(textareaEquipo).toBeVisible();
    await expect(textareaCliente).toBeVisible();

    await page.goto(`/portal/c/${CLAVE}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const contenidoPortal = await page.locator('body').innerText();

    expect(contenidoPortal).toContain('Ambientacion con telas doradas');
    expect(contenidoPortal).not.toContain('SECRETO INTERNO');
    expect(contenidoPortal).not.toContain('recargo si terminamos despues de las 4am');
  });
});
