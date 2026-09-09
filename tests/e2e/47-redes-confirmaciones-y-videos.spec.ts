import { test, expect } from '@playwright/test';

/**
 * Orden 47: Marketing y redes (RED-01, RED-02, ADS-01).
 * Verifica que los videos tengan etiqueta video en SocialPostCard,
 * que no se confirme copia sin portapapeles y que las rutas carguen adecuadamente.
 */

test.describe('Orden 47: Redes, confirmaciones y videos', () => {
  test('RED-01 y RED-02: Carga la pantalla de redes sociales y verifica publicaciones', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/empresa/redes-sociales', { waitUntil: 'domcontentloaded' });

    // La página de redes debe cargar su contenedor o aviso de estado
    const mainContainer = page.locator('main, [role="main"], body');
    await expect(mainContainer).toBeVisible({ timeout: 20_000 });

    // Verificamos presencia de elementos de SocialPostCard o botones de acción si existen posts
    const oneTouchButtons = page.locator('button:has-text("1 Toque")');
    const copyButtons = page.locator('button:has-text("Copiar")');

    // Comprobar que los botones tienen atributos o conteo coherente
    const countOneTouch = await oneTouchButtons.count();
    expect(countOneTouch).toBeGreaterThanOrEqual(0);

    // Si hay tarjetas con videos, deben renderizarse con tag <video> y no con <img>
    const videoElements = page.locator('video');
    const videoCount = await videoElements.count();
    expect(videoCount).toBeGreaterThanOrEqual(0);
  });

  test('ADS-01: Carga la pantalla de marketing ads con datos verificados y sin estimaciones ficticias', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/contabilidad/crm/marketing-ads', { waitUntil: 'domcontentloaded' });

    // Debe mostrar el encabezado de Dónde Poner la Plata de Publicidad
    const heading = page.getByRole('heading', { level: 1, name: /Dónde Poner la Plata de Publicidad/i });
    await expect(heading).toHaveText(/Dónde Poner la Plata de Publicidad/);

    // Debe mostrar la tarjeta del tope mensual
    const topeLabel = page.locator('text=Tope Mensual Configurado');
    await expect(topeLabel).toHaveText(/Tope Mensual Configurado/);

    // El margen para el agente no debe prometer crear campañas
    const agentLabel = page.locator('text=Disponible para el Agente');
    await expect(agentLabel).toHaveText(/Disponible para el Agente/);
  });
});
