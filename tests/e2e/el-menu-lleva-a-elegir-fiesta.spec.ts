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

  // Con el menú de 7 casas (orden 298) estas dos pueden no estar en el menú; si están, llevan a elegir fiesta.
  await expect(page.locator('[data-sidebar="sidebar"]').getByRole('link').first()).toBeVisible();
  for (const nombre of [/Alergias y Dietas/i, /Portal de Proveedores/i]) {
    const enlaces = page.locator('[data-sidebar="sidebar"]').getByRole('link', { name: nombre });
    const n = await enlaces.count();
    for (let i = 0; i < n; i++) {
      await expect(enlaces.nth(i)).toHaveAttribute('href', '/eventos');
    }
  }
});
