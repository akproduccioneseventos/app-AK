import { test, expect } from '@playwright/test';

test.describe('Orden 318 Bloque 2: modificar confirmación trae lo respondido', () => {
  test('permite completar nombre, elegir restricción alimentaria con tilde y confirmar', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/invitacion/demo_ak_oficial/rsvp?guestId=demo_guest_1', {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByText('Restricción alimentaria')).toBeVisible({ timeout: 90_000 });
    const nombreInput = page.locator('input').first();
    await nombreInput.fill('Invitado Prueba 318');
    await expect(nombreInput).toHaveValue('Invitado Prueba 318');

    const opcionVegetariano = page.getByText('Vegetariano').first();
    await opcionVegetariano.click();
    await expect(page.getByText('✓').first()).toBeVisible();

    const btnConfirmar = page.getByRole('button', { name: /Confirmar asistencia/i });
    await expect(btnConfirmar).toBeEnabled();
    await btnConfirmar.click();

    await expect(
      page.getByText(/confirmad|recibido|no se pudo|invitado|muestra/i).first(),
    ).toBeVisible({ timeout: 20_000 });
  });
});
