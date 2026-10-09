import { expect, test } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Pedido del dueño, 9/10/2026: "que todos los botones lleven a donde dicen". En Marketing, tres
 * tarjetas ("Moderación y Comentarios", "Editor Web y Portada", "Galería y Catálogo") llevaban a
 * pantallas que no existían. Esta prueba abre Marketing con sesión del equipo y, para cada
 * tarjeta, mira a dónde apunta y que esa pantalla conteste sin "página no encontrada".
 */
const TARJETAS: Array<{ titulo: string; destino: string }> = [
  { titulo: 'Moderación y Comentarios', destino: '/empresa/presencia-digital?tab=comentarios' },
  { titulo: 'Editor Web y Portada', destino: '/empresa/landing-editor' },
  { titulo: 'Galería y Catálogo', destino: '/empresa/galeria' },
];

test('las tarjetas de Marketing llevan a pantallas que existen', async ({ page, context, baseURL }) => {
  await ponerSesionDelEquipo(context, baseURL);
  await page.goto('/empresa/marketing');
  for (const { titulo, destino } of TARJETAS) {
    const tarjeta = page.locator('div', { has: page.getByText(titulo, { exact: true }) }).locator(`a[href="${destino}"]`).first();
    await expect(tarjeta, `${titulo} apunta a ${destino}`).toHaveAttribute('href', destino, { timeout: 30_000 });
    const respuesta = await page.request.get(destino);
    expect(respuesta.status(), `${destino} contesta`).toBeLessThan(400);
  }
});
