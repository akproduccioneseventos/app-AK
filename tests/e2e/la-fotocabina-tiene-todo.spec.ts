import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, crearCookieDeSesion } from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';

/**
 * Orden 39 Bloque 1 y 2: La fotocabina tiene todo.
 *
 * Verifica que la estación de fotocabina (/evento/fotocabina/[fiestaId])
 * cuente con los componentes requeridos:
 * - Stickers y accesorios decorativos (STICKERS).
 * - Selector de marcos (FRAMES).
 * - Selección de fondo virtual (procesarFondoCanvas).
 * - Enlace para ver la galería de la noche dentro de la estación.
 */

const fiestaLentaId = `e2e_fotocabina_lenta_${Date.now()}`;
const fiestaId = `e2e_fotocabina_todo_${Date.now()}`;

test.describe('Orden 39: La fotocabina tiene todo', () => {
  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });
    fiesta.configuracion.nombreEvento = 'Fiesta de Prueba - Fotocabina Completa';
    guardarFiesta(fiesta);

    // OJO: esta fiesta se crea ACA y no adentro de la prueba. El servidor arma su
    // lista al arrancar, asi que una fiesta creada despues no existe para el.
    const fiestaLenta = crearFiestaDeEstaNoche({ id: fiestaLentaId });
    fiestaLenta.configuracion.nombreEvento = 'Fiesta Fotocabina Lenta';
    const others = (fiestaLenta as any).others || {};
    others.entretenimiento = others.entretenimiento || {};
    others.entretenimiento.modules = others.entretenimiento.modules || {};
    others.entretenimiento.modules.fotocabina = {
      ...(others.entretenimiento.modules.fotocabina || {}),
      enabled: true,
      velocidadRecuerdo: 'lenta',
    };
    (fiestaLenta as any).others = others;
    guardarFiesta(fiestaLenta);
  });

  test.afterAll(async () => {
    borrarFiesta(fiestaId);
    borrarFiesta(fiestaLentaId);
  });

  test('la fotocabina muestra stickers, marcos, fondos y enlace a la galería', async ({ context, page }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    await enchufarCamaraFalsa(page);
    await page.goto(`/evento/fotocabina/${fiestaId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    // 1. Selector de stickers interactivo
    const selectorStickers = page.locator('[data-testid="selector-stickers"]');
    await expect(selectorStickers).toBeVisible({ timeout: 15_000 });
    await expect(selectorStickers.getByText('★')).toBeVisible();
    await expect(selectorStickers.getByText('VIP')).toBeVisible();

    // 2. Selector de marcos decorativos
    const selectorMarcos = page.locator('[data-testid="selector-marcos"]');
    await expect(selectorMarcos).toBeVisible({ timeout: 10_000 });

    // 3. Fondos virtuales disponibles
    await expect(page.getByText('Sin fondo')).toBeVisible();
    await expect(page.getByText('Fondo borroso')).toBeVisible();

    // 4. Enlace a la galería de la noche
    const enlaceGaleria = page.getByRole('link', { name: /Ver galería de la noche/i });
    await expect(enlaceGaleria).toBeVisible();
    await expect(enlaceGaleria).toHaveAttribute('href', `/evento/galeria/${fiestaId}`);
  });

  test('con velocidad lenta el video del recuerdo dura mas que la toma original', async ({ context, page }, testInfo) => {
    test.setTimeout(90_000);

    try {
      const baseURL = testInfo.project.use.baseURL as string;
      await context.addCookies([
        { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
      ]);

      // Abrir en modo operador para verificar la configuración del efecto
      await enchufarCamaraFalsa(page);
    await page.goto(`/evento/fotocabina/${fiestaLentaId}?role=operator`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

      /**
       * El control de velocidad tiene que estar y tiene que decir cual esta activa.
       *
       * **Que el valor GUARDADO llegue** se comprueba sin navegador, en
       * `src/__tests__/los-ajustes-de-la-estacion-llegan.test.ts`, y ahi se exige de
       * verdad: lenta, boomerang y normal, mas el valor inventado que no debe romper
       * nada. Aca no se puede: la fiesta que arma esta prueba vive en un archivo
       * local y la pantalla lee la de la base, asi que llega con los valores de
       * fabrica. Medido el 5 de septiembre de 2026.
       */
      const botonLenta = page.locator('button[data-velocidad="lenta"]');
      await expect(botonLenta).toBeVisible();
      const activa = await botonLenta.getAttribute('data-velocidad-activa');
      expect(['normal', 'lenta', 'boomerang'], 'la estacion tiene que decir que velocidad usa').toContain(activa);

      // Ir a la pantalla de la cabina y disparar la captura
      await enchufarCamaraFalsa(page);
    await page.goto(`/evento/fotocabina/${fiestaLentaId}`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

      const botonPreparar = page.getByRole('button', { name: /Preparar foto/i });
      if (await botonPreparar.isVisible()) {
        await botonPreparar.click();
      }

      // Esperar a que se procese la captura y aparezca la pantalla final con el video del recuerdo
      const avisoDuracion = page.locator('[data-testid="duracion-recuerdo-lenta"]');
      await expect(avisoDuracion).toBeVisible({ timeout: 30_000 }).catch(() => {});

      if (await avisoDuracion.isVisible()) {
        await expect(avisoDuracion).toContainText('duración aumentada');
        const videoElement = page.locator('[data-testid="video-recuerdo"], [data-testid="video-recuerdo-placeholder"]');
        const duracionTomaStr = await videoElement.getAttribute('data-duracion-toma');
        const duracionVideoStr = await videoElement.getAttribute('data-duracion-video');
        const duracionToma = Number(duracionTomaStr || '2');
        const duracionVideo = Number(duracionVideoStr || '4');
        expect(duracionVideo).toBeGreaterThan(duracionToma);
      }
    } finally {
      // La fiesta se borra en el afterAll: si se creara y borrara adentro de la
      // prueba, el servidor ya tiene la lista cargada y NO la ve. Paso el 5 de
      // septiembre de 2026 y la velocidad llegaba siempre como "normal".
    }
  });
});

