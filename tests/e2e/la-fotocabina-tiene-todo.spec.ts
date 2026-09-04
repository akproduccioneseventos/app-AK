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
});

