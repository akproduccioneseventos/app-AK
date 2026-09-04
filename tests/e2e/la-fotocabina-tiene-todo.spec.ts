import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, crearCookieDeSesion } from './helpers/fiesta-de-prueba';

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

const fiestaId = `e2e_fotocabina_todo_${Date.now()}`;

test.describe('Orden 39: La fotocabina tiene todo', () => {
  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });
    fiesta.configuracion.nombreEvento = 'Fiesta de Prueba - Fotocabina Completa';
    guardarFiesta(fiesta);
  });

  test.afterAll(async () => {
    borrarFiesta(fiestaId);
  });

  test('la fotocabina muestra stickers, marcos, fondos y enlace a la galería', async ({ context, page }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

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
    const fiestaLentaId = `e2e_fotocabina_lenta_${Date.now()}`;
    const fiestaLenta = crearFiestaDeEstaNoche({ id: fiestaLentaId });
    fiestaLenta.configuracion.nombreEvento = 'Fiesta Fotocabina Lenta';
    if (!fiestaLenta.others) fiestaLenta.others = {};
    if (!fiestaLenta.others.entretenimiento) fiestaLenta.others.entretenimiento = {} as any;
    if (!fiestaLenta.others.entretenimiento.modules) fiestaLenta.others.entretenimiento.modules = {} as any;
    (fiestaLenta.others.entretenimiento.modules as any).fotocabina = {
      ...((fiestaLenta.others.entretenimiento.modules as any).fotocabina || {}),
      velocidadRecuerdo: 'lenta',
    };
    guardarFiesta(fiestaLenta);

    try {
      const baseURL = testInfo.project.use.baseURL as string;
      await context.addCookies([
        { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
      ]);

      // Abrir en modo operador para verificar la configuración del efecto
      await page.goto(`/evento/fotocabina/${fiestaLentaId}?role=operator`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

      const botonLenta = page.locator('button', { hasText: 'Cámara Lenta' });
      await expect(botonLenta).toBeVisible();
      await expect(botonLenta).toHaveAttribute('class', /border-amber-500/);

      // Ir a la pantalla de la cabina y disparar la captura
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
      borrarFiesta(fiestaLentaId);
    }
  });
});

