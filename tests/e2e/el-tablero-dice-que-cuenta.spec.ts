import { test, expect } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test.describe('Orden 317 Bloque 2: el tablero dice qué cuenta', () => {
  test('/analytics muestra la aclaración de últimos 12 meses y no muestra 100% de margen sin costos', async ({ page, context }, testInfo) => {
    test.setTimeout(180_000);
    const baseURL = (testInfo.project.use.baseURL as string) || 'http://127.0.0.1:3000';
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto('/analytics', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('últimos 12 meses').first()).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText('Fiestas con fecha pasada')).toBeVisible();

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('100%');
  });
});
