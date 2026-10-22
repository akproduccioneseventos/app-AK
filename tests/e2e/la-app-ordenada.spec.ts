import { test, expect } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Orden 182: La app ordenada.
 * - En escritorio y en celular, la ficha de una fiesta muestra las cinco pestañas.
 * - Tocar 'La noche' muestra 'QR / Check-in' y la dirección guarda la pestaña (?pestana=noche).
 * - /marketing muestra las cuatro puertas y cada una abre su pantalla.
 */

const PESTANAS = [
  'Contrato y pagos',
  'Cliente e invitados',
  'Comida, barra e impresos',
  'Equipo y logística',
  'La noche',
];

const CUATRO_PUERTAS_MARKETING = [
  { titulo: 'Calendario y publicaciones con IA', destino: '/empresa/redes-sociales' },
  { titulo: 'Campañas y anuncios', destino: '/contabilidad/crm/marketing-ads' },
  { titulo: 'Reseñas y Google', destino: '/empresa/presencia-digital' },
  { titulo: 'Web pública y portada', destino: '/empresa/marketing' },
];

test.describe('La app ordenada (Orden 182)', () => {
  test('en escritorio, la ficha de fiesta muestra 5 pestañas y recuerda ?pestana=noche', async ({ page, context, baseURL }) => {
    await ponerSesionDelEquipo(context, baseURL);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/fiestas/nueva');

    for (const pestana of PESTANAS) {
      await expect(page.getByRole('tab', { name: pestana })).toBeVisible({ timeout: 15_000 });
    }

    // Tocar 'La noche'
    await page.getByRole('tab', { name: 'La noche' }).click();
    await expect(page).toHaveURL(/pestana=noche/);
    await expect(page.getByText('QR / Check-in')).toBeVisible({ timeout: 10_000 });
  });

  test('en celular, la ficha de fiesta muestra pestañas navegables y QR / Check-in en La noche', async ({ page, context, baseURL }) => {
    await ponerSesionDelEquipo(context, baseURL);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/fiestas/nueva');

    for (const pestana of PESTANAS) {
      await expect(page.getByRole('tab', { name: pestana })).toBeAttached();
    }

    await page.getByRole('tab', { name: 'La noche' }).click();
    await expect(page).toHaveURL(/pestana=noche/);
    await expect(page.getByText('QR / Check-in')).toBeVisible({ timeout: 10_000 });
  });

  test('/marketing muestra las cuatro puertas y cada una apunta a una pantalla que existe', async ({ page, context, baseURL }) => {
    await ponerSesionDelEquipo(context, baseURL);
    await page.goto('/marketing');

    for (const puerta of CUATRO_PUERTAS_MARKETING) {
      const enlace = page.locator(`a[href="${puerta.destino}"]`).first();
      await expect(enlace, `Enlace a ${puerta.destino} debe existir`).toBeAttached({ timeout: 15_000 });
      await expect(page.getByText(puerta.titulo)).toBeVisible();

      const res = await page.request.get(puerta.destino);
      expect(res.status(), `Pantalla ${puerta.destino} debe responder con éxito`).toBeLessThan(400);
    }
  });
});
