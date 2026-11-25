import { test, expect } from '@playwright/test';
import { crearCookieDeSesion } from './helpers/fiesta-de-prueba';

test.describe('Asistente AK junta toda la IA', () => {
  test('abre /asistente y verifica las cuatro solapas y tareas automáticas', async ({ page, context }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    // Navegar a /asistente
    await page.goto('/asistente', { waitUntil: 'domcontentloaded' });

    // Verificar las cuatro solapas principales
    const tablist = page.getByRole('tablist');
    await expect(tablist).toContainText('Hoy');
    await expect(tablist).toContainText('Lo automático');
    await expect(tablist).toContainText('Gasto');
    await expect(tablist).toContainText('Hablale');

    // Entrar a "Lo automático"
    const tabAutomatico = page.getByRole('tab', { name: /^Lo automático$/i });
    await tabAutomatico.click();
    await expect(tabAutomatico).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(/tab=automatico/);
    const solapaAutomatico = page.locator('main, [data-testid="solapa-automatico"]').first();
    await expect(solapaAutomatico).toContainText('Asistente proactivo 24/7');
    await expect(solapaAutomatico).toContainText('Escribir las notas del blog');

    // Entrar a "Gasto"
    const tabGasto = page.getByRole('tab', { name: /^Gasto$/i });
    await tabGasto.click();
    await expect(page).toHaveURL(/tab=gasto/);
    await expect(page.locator('main, [data-testid="solapa-gasto"]').first()).toContainText('Gasto de IA');

    // Entrar a "Hablale"
    const tabHablale = page.getByRole('tab', { name: /^Hablale$/i });
    await tabHablale.click();
    await expect(page).toHaveURL(/tab=hablale/);
    await expect(page.locator('main, [data-testid="solapa-hablale"]').first()).toContainText('Hablale al Asistente AK');
  });
});
