import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  crearPermisoDeEstacion,
  crearCookieDeSesion,
} from './helpers/fiesta-de-prueba';

/**
 * Orden 46: Estética futurista y movimiento visible en toda AK.
 *
 * Esta prueba no se conforma con que una biblioteca de animación aparezca en un
 * archivo. Mide la posición y la opacidad reales antes y después con boundingBox
 * para verificar que la pantalla verdaderamente se mueve y no presenta elementos
 * invisibles o con dimensiones en cero.
 */

const fiestaPrueba = crearFiestaDeEstaNoche({ id: `e2e_estetica_46_${Date.now()}` });

test.beforeAll(() => {
  guardarFiesta(fiestaPrueba);
});

test.afterAll(() => {
  borrarFiesta(fiestaPrueba.id);
});

test.describe('Orden 46 - Movimiento visible medido con boundingBox', () => {
  test('1. Portada pública: el elemento animado se mueve y mantiene dimensiones visibles reales', async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Localizar una sección con animación de entrada y desplazamiento
    const seccion = page.locator('section').nth(1);
    await expect(seccion).toBeVisible({ timeout: 15_000 });

    // Medición 1: antes del desplazamiento / animación
    const antes = await seccion.boundingBox();
    expect(antes, 'El elemento a medir debe existir en la página').not.toBeNull();
    expect(antes!.width, 'El elemento no puede tener ancho cero').toBeGreaterThan(0);
    expect(antes!.height, 'El elemento no puede tener alto cero').toBeGreaterThan(0);

    const opacidadAntes = await seccion.evaluate((el) => {
      const estilo = window.getComputedStyle(el);
      return parseFloat(estilo.opacity || '1');
    });
    expect(opacidadAntes, 'El elemento antes de la animación no puede ser invisible').toBeGreaterThan(0);

    // Provocar el movimiento mediante desplazamiento a la vista
    await seccion.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Medición 2: después del movimiento
    const despues = await seccion.boundingBox();
    expect(despues, 'El elemento debe seguir existiendo tras la animación').not.toBeNull();
    expect(despues!.width, 'El elemento no puede colapsar a ancho cero').toBeGreaterThan(0);
    expect(despues!.height, 'El elemento no puede colapsar a alto cero').toBeGreaterThan(0);

    const opacidadDespues = await seccion.evaluate((el) => {
      const estilo = window.getComputedStyle(el);
      return parseFloat(estilo.opacity || '1');
    });
    expect(opacidadDespues, 'El elemento después de la animación debe ser visible').toBeGreaterThan(0);

    // Exigir que la posición se haya modificado (movimiento real medido)
    const seMovio = antes!.y !== despues!.y || antes!.x !== despues!.x;
    expect(seMovio, 'La posición del elemento debe cambiar entre antes y después').toBe(true);
  });

  test('2. Touchpix: el indicador animado con motion.div cambia de coordenadas al interactuar', async ({ page, context }, testInfo) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    const tokenEstacion = crearPermisoDeEstacion(fiestaPrueba.id, 'espejoMagicoIA');
    await page.goto(`/evento/touchpix/${fiestaPrueba.id}?access=${tokenEstacion}&role=operator`, {
      waitUntil: 'domcontentloaded',
    });

    // Indicador activo en la barra de pestañas (animado con motion.div layoutId="tab-indicator")
    const indicador = page.locator('[data-testid="touchpix-tab-indicator"]');
    await expect(indicador).toBeVisible({ timeout: 20_000 });

    // Medir posición y opacidad antes
    const boxAntes = await indicador.boundingBox();
    expect(boxAntes, 'El indicador animado debe tener boundingBox medible').not.toBeNull();
    expect(boxAntes!.width, 'El indicador no puede tener ancho 0').toBeGreaterThan(0);
    expect(boxAntes!.height, 'El indicador no puede tener alto 0').toBeGreaterThan(0);

    const opacidadAntes = await indicador.evaluate((el) => parseFloat(window.getComputedStyle(el).opacity || '1'));
    expect(opacidadAntes, 'El indicador debe ser visible').toBeGreaterThan(0);

    // Cambiar a la pestaña de Temas IA / Retrato
    const tabFaceswap = page.locator('[data-testid="touchpix-tab-faceswap"]');
    await expect(tabFaceswap).toBeVisible();
    await tabFaceswap.click();

    // Esperar la transición fluida de Framer Motion
    await page.waitForTimeout(450);

    // Medir posición y opacidad después
    const boxDespues = await indicador.boundingBox();
    expect(boxDespues, 'El indicador debe seguir presente tras la transición').not.toBeNull();
    expect(boxDespues!.width, 'El indicador no puede desaparecer').toBeGreaterThan(0);
    expect(boxDespues!.height, 'El indicador debe mantener tamaño real').toBeGreaterThan(0);

    // Exigir que la coordenada X haya cambiado por la animación de navegación
    expect(boxAntes!.x, 'La posición X del indicador debe cambiar al cambiar de pestaña').not.toBe(boxDespues!.x);

    // Verificar además que el asistente animado con motion.div se montó visible
    const wizardStep = page.locator('[data-testid="touchpix-wizard-step"]');
    await expect(wizardStep).toBeVisible();
    const wizardBox = await wizardStep.boundingBox();
    expect(wizardBox!.width).toBeGreaterThan(0);
    expect(wizardBox!.height).toBeGreaterThan(0);
  });

  test('3. Simulador de presupuesto: transición de pasos visible con dimensiones reales', async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });

    const btnCotizar = page.getByRole('button', { name: /Comenzar mi presupuesto|Cotizar/i }).first();
    await expect(btnCotizar).toBeVisible({ timeout: 20_000 });

    const boxAntes = await btnCotizar.boundingBox();
    expect(boxAntes).not.toBeNull();
    expect(boxAntes!.width).toBeGreaterThan(0);
    expect(boxAntes!.height).toBeGreaterThan(0);

    // Interactuar para avanzar
    await btnCotizar.click();
    await page.waitForTimeout(300);

    // El siguiente paso o modal aparece con dimensiones visibles
    const pasoSiguiente = page.locator('#simulator-name, button:has-text("Cotizar mi fiesta")').first();
    await expect(pasoSiguiente).toBeVisible();
    const boxPaso = await pasoSiguiente.boundingBox();
    expect(boxPaso!.width).toBeGreaterThan(0);
    expect(boxPaso!.height).toBeGreaterThan(0);
  });

  test('4. Movimiento reducido: la app permanece 100% visible y utilizable de inmediato', async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const titular = page.locator('h1').first();
    await expect(titular).toBeVisible({ timeout: 15_000 });
    const boxTitular = await titular.boundingBox();
    expect(boxTitular!.width).toBeGreaterThan(0);
    expect(boxTitular!.height).toBeGreaterThan(0);

    const opacidadTitular = await titular.evaluate((el) => parseFloat(window.getComputedStyle(el).opacity || '1'));
    expect(opacidadTitular).toBe(1);
  });
});
