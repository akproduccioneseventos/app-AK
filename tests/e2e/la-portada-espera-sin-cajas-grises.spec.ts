import { expect, test } from '@playwright/test';

/**
 * ORDEN 78 — LA PORTADA NO LE MUESTRA CAJAS GRISES AL VISITANTE.
 *
 * El dueño reportó: "la primera vez que entré a la web estaba lenta y aparecieron cosas imágenes raras".
 * Eran los recuadros de espera de la portada con `bg-slate-200 animate-pulse`.
 *
 * Esta prueba comprueba:
 * 1. Que en la entrega inicial del servidor ya viajan los títulos reales de las 5 secciones lentas.
 * 2. Que no aparezcan bloques gigantes con animate-pulse ocupando secciones enteras.
 * 3. Que en el navegador los títulos y secciones se muestren sin saltos.
 */

test.describe('Orden 78 - la portada espera sin cajas grises', () => {
  test('el servidor manda los titulos reales de las cinco secciones en la entrega inicial y sin cajas grises gigantes', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    const respuesta = await request.get('/');
    expect(respuesta.status(), 'la portada tiene que contestar bien').toBeLessThan(400);

    const html = await respuesta.text();

    // 1. Títulos reales ya presentes en la entrega inicial del servidor
    expect(html, 'El título del salón destacado tiene que venir en la primera entrega').toContain('Club Uruguay');
    expect(html, 'El título de la galería tiene que venir en la primera entrega').toContain('Galería de eventos');
    expect(html, 'El título de videos tiene que venir en la primera entrega').toContain('Historias en movimiento');
    expect(html, 'El título de testimonios tiene que venir en la primera entrega').toContain('Experiencias compartidas');
    expect(html, 'El título del blog tiene que venir en la primera entrega').toContain('Contenido para planificar tu evento sin estrés');

    // 2. No deben existir bloques gigantes con animate-pulse a pantalla completa
    expect(html, 'No debe haber cajas grises de salon a pantalla completa').not.toContain('bg-slate-200 animate-pulse rounded-2xl md:col-span-2');
    expect(html, 'No debe haber video gigante titilando en gris').not.toContain('aspect-video w-full max-w-4xl mx-auto bg-slate-200 animate-pulse');
  });

  test('en el navegador la portada muestra las secciones con sus titulos de forma limpia', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // `exact: true` en los cuatro titulos: sin eso, "Club Uruguay" tambien empareja con el
    // titulo de un video ("XV anos Belen en Club Uruguay") y la prueba falla por ambiguedad,
    // no porque la portada este mal. Corregido al verificar la entrega, 22/9/2026.
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Club Uruguay', exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Galería de eventos', exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Historias en movimiento', exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Experiencias compartidas', exact: true })).toBeVisible({ timeout: 20_000 });
  });
});
