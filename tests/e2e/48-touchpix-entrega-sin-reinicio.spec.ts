import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, crearPermisoDeEstacion } from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';

/**
 * Orden 48 - ENT-03 y ENT-04: Touchpix no se reinicia antes de terminar.
 *
 * **La version anterior no comprobaba nada**: abria la pantalla con una fiesta que no
 * existe y pedia que el primer texto que encontrara no estuviera vacio.
 *
 * Lo de fondo -que el temporizador no borre el recuerdo mientras se esta subiendo- se
 * comprueba en el codigo, no abriendo la pantalla: hace falta cortarle la red en el
 * medio. Aca se exige lo que si se ve: **que la estacion levante con su barra de
 * pestanas**, que es lo que desaparecia cuando la camara fallaba.
 */
const fiesta = crearFiestaDeEstaNoche({ id: `e2e_touchpix_48_${Date.now()}` });

test.beforeAll(() => guardarFiesta(fiesta));
test.afterAll(() => borrarFiesta(fiesta.id));

test.describe('Orden 48: Touchpix levanta entero', () => {
  test('ENT-03: la estacion abre con sus pestanas y su camara', async ({ page }) => {
    test.setTimeout(90_000);
    await enchufarCamaraFalsa(page);

    const permiso = crearPermisoDeEstacion(fiesta.id, 'espejoMagicoIA');
    await page.goto(`/evento/touchpix/${fiesta.id}?access=${permiso}`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('[data-testid="touchpix-tab-foto"]')).toBeVisible({ timeout: 30_000 });

    // No alcanza con que se vea: se comprueba que la estacion RESPONDE. Se cambia de
    // pestana y se mide que el indicador se haya movido de lugar de verdad.
    const indicador = page.locator('[data-testid="touchpix-tab-indicator"]');
    await expect(indicador).toBeVisible({ timeout: 20_000 });
    const antes = await indicador.boundingBox();
    expect(antes?.width ?? 0).toBeGreaterThan(0);

    await page.locator('[data-testid="touchpix-tab-faceswap"]').click();
    await page.waitForTimeout(500);

    const despues = await indicador.boundingBox();
    expect(despues?.width ?? 0).toBeGreaterThan(0);
    expect(Math.abs((antes?.x ?? 0) - (despues?.x ?? 0))).toBeGreaterThan(1);

    // Y el asistente del paso siguiente tiene que haberse montado con tamano real.
    const paso = page.locator('[data-testid="touchpix-wizard-step"]');
    await expect(paso).toBeVisible({ timeout: 20_000 });
    const cajaPaso = await paso.boundingBox();
    expect(cajaPaso?.height ?? 0).toBeGreaterThan(0);
  });
});
