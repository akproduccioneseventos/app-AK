import { test, expect } from '@playwright/test';

test.describe('Orden 177: La portada nueva (Plan Argon)', () => {
  test('la portada en escritorio y móvil cumple con todos los requisitos del plan Argon', async ({ page }) => {
    // 1. Cargar la portada
    await page.goto('/');

    // 2. Verificar que las anclas siguen existiendo
    await expect(page.locator('#landing-gallery')).toBeAttached();
    await expect(page.locator('#landing-blog')).toBeAttached();
    await expect(page.locator('#videos').first()).toBeAttached();

    // 3. Un solo bloque de consejos y uno solo de tecnología (no aparece 'Tecnología útil' ni 'Guías útiles y consejos')
    const bodyText = await page.innerText('body');
    expect(bodyText).not.toContain('Tecnología útil');
    expect(bodyText).not.toContain('Guías útiles y consejos');

    // 4. Ningún botón de la portada dice 'Cotizá', 'Cotizar', 'Proyectar' ni 'Hablar con AK'
    expect(bodyText).not.toMatch(/\bCotiz[aá]/i);
    expect(bodyText).not.toMatch(/\bCotizar\b/i);
    expect(bodyText).not.toMatch(/\bProyectar mi fiesta\b/i);
    expect(bodyText).not.toMatch(/\bHablar con AK\b/i);

    // 5. La página no dice cifras inventadas ni congelar
    expect(bodyText).not.toMatch(/\+250/);
    expect(bodyText).not.toMatch(/\+10\s*años/i);
    expect(bodyText).not.toMatch(/100%/);
    expect(bodyText).not.toMatch(/congel/i);

    // 6. Verificar las pestañas de la galería
    await expect(page.getByRole('button', { name: /Fotos de montajes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Videos de fiestas reales/i })).toBeVisible();

    // 7. Estaciones: 3 grupos de filtros y Tótem Touch IA con Exclusivo con IA
    await expect(page.getByText('Impacto visual y viral')).toBeVisible();
    await expect(page.getByText('Emoción y recuerdos')).toBeVisible();
    await expect(page.getByText('Interacción en pista')).toBeVisible();

    await expect(page.getByRole('button', { name: /Tótem Touch IA/i })).toBeVisible();
    await expect(page.getByText('Exclusivo con IA')).toBeVisible();

    // 8. Ficha técnica del Salón Club Uruguay
    await expect(page.getByText('Ficha técnica del salón')).toBeVisible();
    await expect(page.getByText('Pleno centro de Salto')).toBeVisible();
    await expect(page.getByText('Climatización')).toBeVisible();

    // 9. Esquema en 3 pasos en testimonios
    await expect(page.getByText(/1\.\s*Reservás tu fecha con una seña/i)).toBeVisible();
    await expect(page.getByText(/2\.\s*Plan de pagos mensuales a tu medida/i)).toBeVisible();
    await expect(page.getByText(/3\.\s*Ajuste final de invitados 15 a 30 días antes/i)).toBeVisible();

    // 10. Barra verificadora del hero: redirige al simulador con parámetros
    const heroBtn = page.getByRole('link', { name: /Consultar disponibilidad de fecha/i });
    await expect(heroBtn).toBeVisible();
    const href = await heroBtn.getAttribute('href');
    expect(href).toContain('/simulador-de-presupuesto?');
    expect(href).toContain('tipo=');
    expect(href).toContain('guests=');
    expect(href).toContain('mes=');
    expect(href).toContain('entry=hero-fecha');

    // 11. Botón "Incluir en mi simulación" de Tótem Touch IA
    const incluirBtn = page.getByRole('link', { name: /Incluir en mi simulación/i });
    await expect(incluirBtn).toBeVisible();
    const extraHref = await incluirBtn.getAttribute('href');
    expect(extraHref).toContain('/simulador-de-presupuesto?extra=serv_espejo_magico_ia');
  });

  test('en resolución móvil (390px) se ve limpio y sin desbordes horizontales', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const heroBtn = page.getByRole('link', { name: /Consultar disponibilidad de fecha/i });
    await expect(heroBtn).toBeVisible();

    // No debe haber desborde horizontal excesivo
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });
});
