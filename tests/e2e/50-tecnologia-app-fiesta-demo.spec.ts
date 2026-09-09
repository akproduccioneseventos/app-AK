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

    // Título y promesa con matchers de resultado
    await expect(techSection.getByRole('heading', { level: 2, name: /La app de tu fiesta/i })).toHaveText(/La app de tu fiesta/);

    // Tabs de los 5 momentos
    await expect(techSection.locator('[data-testid="momento-de-la-app"]')).toHaveCount(5);

    // Verificación de la fiesta demo identificada y segura
    await expect(techSection.locator('text=DEMO EN VIVO')).toHaveText(/DEMO EN VIVO/);
    await expect(techSection.locator('text=Modo seguro')).toHaveText(/Modo seguro/);

    /**
     * SE TOCA EL MOMENTO POR SU LUGAR, NO POR SU TEXTO, Y SE MIRA LA SECCION ENTERA.
     *
     * Esta prueba fallo tres veces en la tanda completa y pasaba sola. Buscaba el
     * texto del panel con un localizador que **tiene que resolver a un elemento**, y
     * cuando la maquina esta cargada eso se cae con "no se encontro". Mirando la
     * seccion entera con `toContainText` se comprueba lo mismo -que al cambiar de
     * momento cambia lo que se muestra- y se reintenta solo hasta que aparece.
     */
    const momentos = techSection.locator('[data-testid="momento-de-la-app"]');

    // 2. Invitación
    await momentos.nth(1).click();
    await expect(techSection).toContainText(/Mis 15 - Camila/, { timeout: 30_000 });

    // 4. Barra y Tótem
    await momentos.nth(3).click();
    await expect(techSection).toContainText(/Mojito de Maracuyá/, { timeout: 30_000 });

    // Botón de consulta a WhatsApp con mensaje contextual
    const ctaWa = techSection.getByRole('link', { name: /Consultar para mi fiesta/i });
    await expect(ctaWa).toHaveAttribute('href', /wa\.me/);
  });
});
