import { test, expect } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Orden 104, bloque 6: el control de que el personal esté en el salón al marcar la llegada
 * se prende desde /settings/accesos-personal y queda prendido al recargar.
 * Antes el ajuste existía y no había ninguna pantalla para prenderlo.
 */
test('el control de llegada con ubicación se prende y queda guardado', async ({ page, context }, testInfo) => {
  await ponerSesionDelEquipo(context, testInfo.project.use.baseURL as string);
  await page.goto('/settings/accesos-personal', { waitUntil: 'domcontentloaded' });

  const interruptor = page.locator('#controlar-llegada-switch');
  await expect(interruptor).toBeVisible({ timeout: 30_000 });
  await expect(interruptor).toBeEnabled({ timeout: 15_000 });

  const antes = await interruptor.getAttribute('aria-checked');
  await interruptor.click();
  const despues = antes === 'true' ? 'false' : 'true';
  await expect(interruptor).toHaveAttribute('aria-checked', despues);
  await expect(interruptor).toBeEnabled({ timeout: 15_000 });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#controlar-llegada-switch')).toHaveAttribute('aria-checked', despues, { timeout: 30_000 });

  // Se deja como estaba, para no ensuciar la próxima corrida.
  await page.locator('#controlar-llegada-switch').click();
  await expect(page.locator('#controlar-llegada-switch')).toHaveAttribute('aria-checked', antes ?? 'false');
});
