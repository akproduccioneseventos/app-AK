import { test, expect } from '@playwright/test';

/**
 * Orden 50 - TEC-01:
 * Demostración de "La app de tu fiesta" con los 5 momentos y fiesta demo aislada.
 */

test.describe('Orden 50: Tecnología de la app en la portada comercial', () => {
  test('TEC-01: Carga la sección comercial "La app de tu fiesta" con sus 5 momentos y demo aislada', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Sección visible en la portada
    const techSection = page.locator('#tecnologia');
    await expect(techSection).toBeVisible({ timeout: 20_000 });

    // Título y promesa
    await expect(techSection.getByRole('heading', { level: 2, name: /La app de tu fiesta/i })).toBeVisible();

    // Tabs de los 5 momentos
    await expect(techSection.locator('text=1. Antes')).toBeVisible();
    await expect(techSection.locator('text=2. Invitación')).toBeVisible();
    await expect(techSection.locator('text=3. Durante')).toBeVisible();
    await expect(techSection.locator('text=4. Barra y Tótem')).toBeVisible();
    await expect(techSection.locator('text=5. Después')).toBeVisible();

    // Verificación de la fiesta demo identificada y segura
    await expect(techSection.locator('text=DEMO EN VIVO')).toBeVisible();
    await expect(techSection.locator('text=Modo seguro')).toBeVisible();

    // Interacción con momento Invitación
    await techSection.locator('button:has-text("2. Invitación")').click();
    await expect(techSection.locator('text=Mis 15 - Camila')).toBeVisible();

    // Interacción con momento Barra y Cócteles
    await techSection.locator('button:has-text("4. Barra")').click();
    await expect(techSection.locator('text=Mojito de Maracuyá')).toBeVisible();
    await expect(techSection.locator('text=Cola independiente del DJ')).toBeVisible();

    // Botón de consulta a WhatsApp con mensaje contextual
    const ctaWa = techSection.getByRole('link', { name: /Consultar para mi fiesta/i });
    await expect(ctaWa).toBeVisible();
    const href = await ctaWa.getAttribute('href');
    expect(href).toContain('wa.me');
  });
});
