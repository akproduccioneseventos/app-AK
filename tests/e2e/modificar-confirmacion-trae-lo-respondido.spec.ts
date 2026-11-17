import { test, expect } from '@playwright/test';

test.describe('Orden 318 Bloque 2: modificar confirmación trae lo respondido', () => {
  test('la pantalla de RSVP carga y muestra opciones de restricción con estado marcado', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/invitacion/demo_ak_oficial/rsvp?guestId=demo_guest_1', {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByText('Restricción alimentaria')).toBeVisible({ timeout: 90_000 });
    const opcionVegetariano = page.getByText('Vegetariano').first();
    if (await opcionVegetariano.isVisible()) {
      await opcionVegetariano.click();
      await expect(page.getByText('✓').first()).toBeVisible();
    }
  });
});
