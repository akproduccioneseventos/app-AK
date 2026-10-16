import { test, expect, type Locator } from '@playwright/test';

// Las secciones aparecen al bajar: se lleva cada elemento a la vista antes de mirarlo, y se toma el
// primero cuando el mismo texto está en la pestaña y en la tarjeta.
async function seVe(locator: Locator) {
  const primero = locator.first();
  await primero.scrollIntoViewIfNeeded();
  await expect(primero).toBeVisible();
}

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
    // Se miran los BOTONES y ENLACES, no el texto corrido (una respuesta frecuente puede decir "cotización").
    const textosDeBotones = (await page.locator('a, button').allInnerTexts()).join(' | ');
    expect(textosDeBotones).not.toMatch(/\bCotiz[aá]/i);
    expect(textosDeBotones).not.toMatch(/\bCotizar\b/i);
    expect(textosDeBotones).not.toMatch(/\bProyectar mi fiesta\b/i);
    expect(textosDeBotones).not.toMatch(/\bHablar con AK\b/i);

    // 5. La página no dice cifras inventadas ni congelar
    expect(bodyText).not.toMatch(/\+250/);
    expect(bodyText).not.toMatch(/\+10\s*años/i);
    expect(bodyText).not.toMatch(/100%/);
    expect(bodyText).not.toMatch(/congel/i);

    // 6. Verificar las pestañas de la galería
    await seVe(page.getByRole('button', { name: /Fotos de montajes/i }));
    await seVe(page.getByRole('button', { name: /Videos de fiestas reales/i }));

    // 7. Estaciones: 3 grupos de filtros y Tótem Touch IA con Exclusivo con IA
    // En el celular el botón muestra el nombre corto ("Visual y viral"); en escritorio, el largo.
    await seVe(page.getByRole('button', { name: /visual y viral/i }));
    await seVe(page.getByRole('button', { name: /Emoción y recuerdos/i }));
    await seVe(page.getByRole('button', { name: /Interacción en pista/i }));

    await seVe(page.getByRole('button', { name: /Tótem Touch IA/i }));
    await seVe(page.getByText('Exclusivo con IA'));

    // 8. Ficha técnica del Salón Club Uruguay
    await seVe(page.getByText('Ficha técnica del salón'));
    await seVe(page.getByText('Pleno centro de Salto'));
    await seVe(page.getByText('Climatización'));

    // 9. Esquema en 3 pasos en testimonios
    await seVe(page.getByText(/1\.\s*Reservás tu fecha con una seña/i));
    await seVe(page.getByText(/2\.\s*Plan de pagos mensuales a tu medida/i));
    await seVe(page.getByText(/3\.\s*Ajuste final de invitados 15 a 30 días antes/i));

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
