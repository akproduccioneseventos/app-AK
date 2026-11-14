/**
 * Orden 305 Bloque 4: "Alergias y Dietas" y "Portal de Proveedores" desde el menú
 * llevan a elegir la fiesta (`/eventos`), nunca a una rueda sin fin.
 */
import { expect, test } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test('Orden 305: Alergias y Dietas y Portal de Proveedores en el menú llevan a elegir fiesta', async ({ page, context, baseURL, isMobile }) => {
  test.setTimeout(240000);
  await ponerSesionDelEquipo(context, baseURL);
  await page.goto('/eventos', { waitUntil: 'domcontentloaded' });

  if (isMobile) {
    const trigger = page.locator('[data-sidebar="trigger"]');
    await trigger.waitFor({ state: 'visible' });
    await trigger.click();
  }
  await page.locator('[data-sidebar="sidebar"]').waitFor({ state: 'visible' });

  const alergiasLink = page.getByRole('link', { name: /Alergias y Dietas/i }).first();
  await expect(alergiasLink).toHaveAttribute('href', '/eventos');

  const proveedoresLink = page.getByRole('link', { name: /Portal de Proveedores/i }).first();
  await expect(proveedoresLink).toHaveAttribute('href', '/eventos');
});
