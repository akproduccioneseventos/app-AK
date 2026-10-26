import { expect, test } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Orden 192 - Centro de Presencia Digital y Redes
 * - Cinco solapas visibles en este orden: Hoy, Mensajes, Publicaciones, Resultados y Conexiones.
 * - /empresa/redes-sociales redirige / lleva a Publicaciones.
 */

test.describe('El centro de redes tiene cinco solapas', () => {
  test('se ven Hoy, Mensajes, Publicaciones, Resultados y Conexiones', async ({ page, context, baseURL }) => {
    await ponerSesionDelEquipo(context, baseURL);
    await page.goto('/empresa/presencia-digital');

    // Verificar las 5 solapas principales
    const tabHoy = page.locator('button:has-text("Hoy"), [data-testid="tab-hoy"]').first();
    const tabMensajes = page.locator('button:has-text("Mensajes"), [data-testid="tab-mensajes"]').first();
    const tabPublicaciones = page.locator('button:has-text("Publicaciones"), [data-testid="tab-publicaciones"]').first();
    const tabResultados = page.locator('button:has-text("Resultados"), [data-testid="tab-resultados"]').first();
    const tabConexiones = page.locator('button:has-text("Conexiones"), [data-testid="tab-conexiones"]').first();

    await expect(tabHoy).toBeVisible();
    await expect(tabMensajes).toBeVisible();
    await expect(tabPublicaciones).toBeVisible();
    await expect(tabResultados).toBeVisible();
    await expect(tabConexiones).toBeVisible();
  });

  test('/empresa/redes-sociales lleva a Publicaciones', async ({ page, context, baseURL }) => {
    await ponerSesionDelEquipo(context, baseURL);
    // Al navegar a la ruta de redes-sociales, debe redirigir a presencia-digital con tab=publicaciones
    await page.goto('/empresa/redes-sociales');

    await expect(page).toHaveURL(/presencia-digital\?tab=publicaciones/);
  });
});
