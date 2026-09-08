import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  crearPermisoDeEstacion,
  crearCookieDeSesion,
} from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';

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
  test('1. Portada publica: el resplandor animado cambia de tamano solo con el paso del tiempo', async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    /**
     * OJO: la version anterior de esta prueba desplazaba la pagina y exigia que
     * el elemento cambiara de posicion. Eso NO mide la animacion: mide el
     * desplazamiento, y daba rojo cuando el elemento ya estaba a la vista y no
     * habia nada que desplazar.
     *
     * Lo que se mide ahora es el resultado de verdad: el resplandor de la
     * portada late en bucle, asi que su tamano medido cambia **sin tocar nada**.
     * Con las animaciones apagadas este elemento ni siquiera se dibuja, o sea
     * que la prueba se pone en rojo si alguien apaga el movimiento.
     */
    const resplandor = page.locator('[data-testid="hero-resplandor"]');
    await expect(resplandor).toBeVisible({ timeout: 20_000 });

    const antes = await resplandor.boundingBox();
    expect(antes, 'El elemento animado debe existir en la pagina').not.toBeNull();
    expect(antes!.width, 'El elemento no puede tener ancho cero').toBeGreaterThan(0);
    expect(antes!.height, 'El elemento no puede tener alto cero').toBeGreaterThan(0);

    const opacidadAntes = await resplandor.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).opacity || '1')
    );
    expect(opacidadAntes, 'El elemento animado no puede ser invisible').toBeGreaterThan(0);

    // El latido dura 7 segundos: a los 1,8 segundos ya tiene otro tamano.
    await page.waitForTimeout(1_800);

    const despues = await resplandor.boundingBox();
    expect(despues, 'El elemento debe seguir existiendo mientras se anima').not.toBeNull();
    expect(despues!.width, 'El elemento no puede colapsar a ancho cero').toBeGreaterThan(0);
    expect(despues!.height, 'El elemento no puede colapsar a alto cero').toBeGreaterThan(0);

    const seMovio =
      Math.abs(antes!.width - despues!.width) > 1 ||
      Math.abs(antes!.height - despues!.height) > 1 ||
      Math.abs(antes!.y - despues!.y) > 1 ||
      Math.abs(antes!.x - despues!.x) > 1;
    expect(seMovio, 'La portada tiene que moverse sola: el resplandor no cambio nada').toBe(true);
  });

  test('2. Touchpix: el indicador animado con motion.div cambia de coordenadas al interactuar', async ({ page, context }, testInfo) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    /**
     * SIN `role=operator` A PROPOSITO. Con ese parametro la pantalla muestra el
     * panel del operador, que NO tiene la barra de pestanas: la prueba buscaba
     * un indicador que en esa vista no existe y siempre daba rojo.
     *
     * Y sin la camara de mentira la estacion muestra el cartel de "no se puede
     * usar la camara" y desaparece todo el panel.
     */
    await enchufarCamaraFalsa(page);
    const tokenEstacion = crearPermisoDeEstacion(fiestaPrueba.id, 'espejoMagicoIA');
    await page.goto(`/evento/touchpix/${fiestaPrueba.id}?access=${tokenEstacion}`, {
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

    /**
     * OJO: antes esto buscaba `h1` a secas y el primero de la pagina puede ser el
     * de otra seccion, que la portada monta y desmonta al armarse. Medido justo
     * en el medio, el elemento ya no estaba y la prueba se caia con la portada
     * perfecta. Se apunta al titular de la portada y se espera a que tenga
     * tamano de verdad en vez de medirlo una sola vez.
     */
    const titular = page.locator('[data-testid="hero-section"] h1').first();
    await expect(titular).toBeVisible({ timeout: 20_000 });

    await expect
      .poll(async () => (await titular.boundingBox())?.width ?? 0, { timeout: 15_000 })
      .toBeGreaterThan(0);
    await expect
      .poll(async () => (await titular.boundingBox())?.height ?? 0, { timeout: 15_000 })
      .toBeGreaterThan(0);

    // Con el movimiento apagado el titular tiene que estar entero a la vista, no
    // a medio aparecer.
    await expect
      .poll(
        async () => titular.evaluate((el) => parseFloat(window.getComputedStyle(el).opacity || '1')),
        { timeout: 15_000 }
      )
      .toBe(1);
  });
});
