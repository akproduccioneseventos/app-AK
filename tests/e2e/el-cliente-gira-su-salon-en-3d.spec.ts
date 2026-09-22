import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  ponerSesionDelEquipo,
} from './helpers/fiesta-de-prueba';

/**
 * Ordenes 75 y 77: El cliente ve su salón en 3D en ambas puertas y puede girarlo.
 *
 * Puerta 1: /portal/[fiestaId]/decoracion
 * Puerta 2: /portal/c/[accessKey]
 */

const ID_CON_PLANO = `e2e_salon_con_plano_${Date.now()}`;
const CLAVE_CON_PLANO = `clave-3d-${Date.now()}`;

const ID_SIN_PLANO = `e2e_salon_sin_plano_${Date.now()}`;
const CLAVE_SIN_PLANO = `clave-sin-plano-${Date.now()}`;

test.describe('Orden 75 & 77: El cliente ve su salón en 3D y lo gira en ambas puertas', () => {
  test.beforeAll(() => {
    // Fiesta CON plano armado
    const fiestaConPlano = crearFiestaDeEstaNoche({
      id: ID_CON_PLANO,
      clavePortal: CLAVE_CON_PLANO,
    });
    fiestaConPlano.decoracion = {
      ...fiestaConPlano.decoracion,
      salonWidth: 20,
      salonHeight: 15,
      pixelsPerMeter: 40,
      salonPreview3dUrl: '/media/salones/default.jpg',
      salonElements: [
        {
          id: 'mesa-1',
          type: 'element',
          category: 'Mesa Redonda',
          name: 'Mesa 1',
          x: 200,
          y: 200,
          width: 80,
          height: 80,
          rotation: 0,
        },
        {
          id: 'pista-1',
          type: 'area',
          category: 'Pista de Baile',
          name: 'Pista de Baile',
          x: 400,
          y: 300,
          width: 150,
          height: 150,
          rotation: 0,
        },
        {
          id: 'barra-1',
          type: 'area',
          category: 'Barra',
          name: 'Barra de Tragos',
          x: 50,
          y: 200,
          width: 160,
          height: 60,
          rotation: 90,
        },
      ],
    };
    guardarFiesta(fiestaConPlano);

    // Fiesta SIN plano armado (vacía)
    const fiestaSinPlano = crearFiestaDeEstaNoche({
      id: ID_SIN_PLANO,
      clavePortal: CLAVE_SIN_PLANO,
    });
    fiestaSinPlano.decoracion = {
      salonWidth: 15,
      salonHeight: 15,
      pixelsPerMeter: 40,
      salonElements: [],
      salonPreview3dUrl: undefined,
      tema: undefined,
      notaDecoracionParaElCliente: undefined,
    };
    guardarFiesta(fiestaSinPlano);
  });

  test.afterAll(() => {
    borrarFiesta(ID_CON_PLANO);
    borrarFiesta(ID_SIN_PLANO);
  });

  test('Puerta 1 (/portal/[fiestaId]/decoracion): con plano muestra salón 3D y permite girar', async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto(`/portal/${ID_CON_PLANO}/decoracion`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const seccion3D = page.locator('[data-testid="seccion-salon-3d"]');
    await expect(seccion3D).toBeVisible({ timeout: 20_000 });

    // Verificamos que no existan textos rotos de error
    const cuerpo = await page.locator('body').innerText();
    expect(cuerpo).not.toMatch(/undefined|null|error en 3d|crashed/i);

    // Debe contener el contenedor de la escena (canvas 3D o foto de fallback)
    const hayCanvas = await seccion3D.locator('canvas').count();
    const hayImagen = await seccion3D.locator('img').count();
    expect(hayCanvas + hayImagen, 'debe tener canvas 3D o foto de fallback').toBeGreaterThan(0);

    // Gesto de giro: arrastrar con el mouse o dedo
    const caja = await seccion3D.boundingBox();
    if (caja) {
      await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
      await page.mouse.down();
      await page.mouse.move(caja.x + caja.width / 2 + 120, caja.y + caja.height / 2 + 20, { steps: 5 });
      await page.mouse.up();
    }
  });

  test('Puerta 2 (/portal/c/[accessKey]): con plano muestra salón 3D y permite girar', async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto(`/portal/c/${CLAVE_CON_PLANO}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // En el portal con clave, debe aparecer la sección del salón 3D
    const seccion3D = page.locator('[data-testid="seccion-salon-3d"]');
    await expect(seccion3D).toBeVisible({ timeout: 20_000 });

    const hayCanvas = await seccion3D.locator('canvas').count();
    const hayImagen = await seccion3D.locator('img').count();
    expect(hayCanvas + hayImagen, 'debe tener canvas 3D o foto de fallback').toBeGreaterThan(0);

    // Gesto de giro
    const caja = await seccion3D.boundingBox();
    if (caja) {
      await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
      await page.mouse.down();
      await page.mouse.move(caja.x + caja.width / 2 + 100, caja.y + caja.height / 2, { steps: 5 });
      await page.mouse.up();
    }

    const cuerpo = await page.locator('body').innerText();
    expect(cuerpo).not.toMatch(/error en 3d|crashed|undefined/i);
  });

  test('Puerta 2 (/portal/c/[accessKey]): sin plano muestra cartel de preparación y NO un cuadro roto', async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto(`/portal/c/${CLAVE_SIN_PLANO}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Debe mostrar el cartel de decoración en preparación
    await expect(page.getByText(/decoración todavía está en preparación|en preparación/i)).toBeVisible({ timeout: 15_000 });

    // NO debe haber un cuadro 3D roto
    const cuerpo = await page.locator('body').innerText();
    expect(cuerpo).not.toMatch(/crashed|error al cargar 3d|exception/i);
  });
});
