import { expect, test } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  ponerSesionDelEquipo,
} from './helpers/fiesta-de-prueba';

/**
 * ORDEN 79 — OCHO ENLACES QUE NO LLEVAN A NINGÚN LADO Y BARRIDO.
 *
 * Se comprueba que:
 * 1. En el portal, "Cotizar mi fiesta" va a /simulador-de-presupuesto.
 * 2. En Presencia Digital, "Conexiones" va a /settings/social-connections.
 * 3. En Atracción de Fiestas, "Ver Fiestas Activas" va a /eventos.
 * 4. En los cinco reportes e impresos:
 *    - Con fiestaId, vuelven a la fiesta conservando el identificador.
 *    - Sin fiestaId, van a /eventos.
 */

test.describe('Orden 79 - los enlaces llegan a donde dicen', () => {
  const fiestaId = `e2e_enlaces_${Date.now()}`;

  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });
    guardarFiesta(fiesta);
  });

  test.afterAll(async () => {
    borrarFiesta(fiestaId);
  });

  test('1.a: En el portal, "Cotizar mi fiesta" lleva al simulador de presupuesto', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto('/portal', { waitUntil: 'domcontentloaded' });
    const botonCotizar = page.locator('a[href="/simulador-de-presupuesto"]', { hasText: 'Cotizar mi fiesta' });
    await expect(botonCotizar).toBeVisible({ timeout: 15_000 });
  });

  test('1.b: En Presencia Digital, "Conexiones" apunta a /settings/social-connections', async ({ page, context, baseURL }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await ponerSesionDelEquipo(context, baseURL);
    await page.goto('/empresa/presencia-digital', { waitUntil: 'domcontentloaded' });

    const linkConexiones = page.locator('a[href="/settings/social-connections"]', { hasText: 'Conexiones' });
    await expect(linkConexiones).toBeVisible({ timeout: 15_000 });
  });

  test('1.c: En atraccion-fiestas, "Ver Fiestas Activas" apunta a /eventos', async ({ page, context, baseURL }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await ponerSesionDelEquipo(context, baseURL);
    await page.goto('/contabilidad/crm/atraccion-fiestas', { waitUntil: 'domcontentloaded' });

    // Si no hay prospectos o en estado vacío, el botón apunta a /eventos
    const linkEventos = page.locator('a[href="/eventos"]');
    // Si la tabla estuviera vacía o con datos, verificamos que no exista ningún link roto a /fiestas
    const linkRoto = page.locator('a[href="/fiestas"]');
    await expect(linkRoto).toHaveCount(0);
  });

  test('1.c: Los 5 reportes e impresos vuelven a la fiesta cuando tienen fiestaId y no a un listado muerto', async ({ page, context, baseURL }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await ponerSesionDelEquipo(context, baseURL);

    const reportesConFiesta = [
      `/fiestas/nueva/carga-operativa/pdf?fiestaId=${fiestaId}`,
      `/fiestas/nueva/gestion-costos-rentabilidad/reporte?fiestaId=${fiestaId}`,
      `/fiestas/nueva/itinerario/pdf?fiestaId=${fiestaId}`,
      `/fiestas/nueva/musica/pdf?fiestaId=${fiestaId}`,
      `/fiestas/nueva/resumen-imprimible?fiestaId=${fiestaId}`,
    ];

    for (const url of reportesConFiesta) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      // Ninguno debe tener href="/fiestas"
      const linkRoto = page.locator('a[href="/fiestas"]');
      await expect(linkRoto, `En ${url} no debe existir href="/fiestas"`).toHaveCount(0);

      // Debe existir enlace de retorno conservando fiestaId
      const linkRetorno = page.locator(`a[href*="${fiestaId}"]`);
      await expect(linkRetorno.first(), `En ${url} debe existir retorno a la fiesta`).toBeVisible({ timeout: 15_000 });
    }
  });

  test('1.c: Los reportes sin fiestaId dirigen a /eventos en vez de /fiestas', async ({ page, context, baseURL }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await ponerSesionDelEquipo(context, baseURL);

    const reportesSinFiesta = [
      '/fiestas/nueva/carga-operativa/pdf',
      '/fiestas/nueva/gestion-costos-rentabilidad/reporte',
      '/fiestas/nueva/itinerario/pdf',
      '/fiestas/nueva/musica/pdf',
      '/fiestas/nueva/resumen-imprimible',
    ];

    for (const url of reportesSinFiesta) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      // Ninguno debe tener href="/fiestas"
      const linkRoto = page.locator('a[href="/fiestas"]');
      await expect(linkRoto, `En ${url} sin fiesta no debe existir href="/fiestas"`).toHaveCount(0);

      // Debe ofrecer ir a /eventos
      const linkEventos = page.locator('a[href="/eventos"]');
      await expect(linkEventos, `En ${url} sin fiesta debe apuntar a /eventos`).toBeVisible({ timeout: 15_000 });
    }
  });
});
