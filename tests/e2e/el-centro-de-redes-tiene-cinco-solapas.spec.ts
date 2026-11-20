import { expect, test } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Orden 326 - El centro de redes ahora tiene seis solapas: Hoy, Mensajes, Publicaciones, Comentarios, Resultados y Conexiones.
 */

test.describe('El centro de redes tiene seis solapas', () => {
  test('se ven Hoy, Mensajes, Publicaciones, Comentarios, Resultados y Conexiones', async ({ page, context, baseURL }) => {
    await ponerSesionDelEquipo(context, baseURL);
    await page.goto('/empresa/presencia-digital');

    // Verificar las 6 solapas principales incluyendo Comentarios
    const tabHoy = page.locator('button:has-text("Hoy"), [data-testid="tab-hoy"]').first();
    const tabMensajes = page.locator('button:has-text("Mensajes"), [data-testid="tab-mensajes"]').first();
    const tabPublicaciones = page.locator('button:has-text("Publicaciones"), [data-testid="tab-publicaciones"]').first();
    const tabComentarios = page.locator('button:has-text("Comentarios"), [data-testid="tab-comentarios"]').first();
    const tabResultados = page.locator('button:has-text("Resultados"), [data-testid="tab-resultados"]').first();
    const tabConexiones = page.locator('button:has-text("Conexiones"), [data-testid="tab-conexiones"]').first();

    await expect(tabHoy).toBeVisible();
    await expect(tabMensajes).toBeVisible();
    await expect(tabPublicaciones).toBeVisible();
    await expect(tabComentarios).toBeVisible();
    await expect(tabResultados).toBeVisible();
    await expect(tabConexiones).toBeVisible();
  });

  test('/empresa/redes-sociales abre el planificador', async ({ page, context, baseURL }) => {
    await ponerSesionDelEquipo(context, baseURL);
    await page.goto('/empresa/redes-sociales');

    await expect(page).toHaveURL(/\/empresa\/redes-sociales/);
    await expect(page.getByRole('heading', { name: 'Planificador de Contenido' }).last()).toBeVisible();
  });
});
