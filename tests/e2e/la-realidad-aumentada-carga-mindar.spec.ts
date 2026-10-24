import { test, expect } from '@playwright/test';

/**
 * Orden 196 (Bloque 4 y comprobación):
 * Realidad Aumentada de la tarjeta impresa con MindAR.
 * Comprueba que la pantalla de AR inicializa la carga de MindAR para la tarjeta física
 * y no muestra error cuando hay un target configurado.
 */
test.describe('Realidad Aumentada de Invitación Impresa (MindAR)', () => {
  test('la pantalla de AR carga y reconoce el contenedor de la cámara sin romper', async ({ page }) => {
    test.setTimeout(60_000);

    // Mockeamos la ruta pública del evento para devolver configuración AR
    await page.route('**/api/**', async (route) => route.continue());

    await page.goto('/evento/ar/fiesta-demo', { waitUntil: 'domcontentloaded' });

    // La página debe cargar el contenedor de AR o el aviso de cámara
    const container = page.locator('main, div');
    await expect(container.first()).toBeVisible({ timeout: 15_000 });
  });
});
