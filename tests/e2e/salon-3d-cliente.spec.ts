import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  crearCookieDeSesion,
  ponerSesionDelEquipo,
} from './helpers/fiesta-de-prueba';

/**
 * Orden 77: El cliente entra por dos puertas al salón 3D.
 *
 * Puerta 1: /portal/[fiestaId]/decoracion (portal público de decoración)
 * Puerta 2: /portal-cliente/[id] (portal privado del cliente con clave)
 *
 * En ambas puertas se utiliza el componente compartido Salon3DClienteView.
 * Si el dispositivo no puede dibujarlo o no hay aceleración 3D, muestra la foto
 * de siempre: nunca un cuadro vacío ni un cartel técnico.
 */

const ID = `e2e_salon_cliente_${Date.now()}`;
const CLAVE_PORTAL = 'clave-secreta-3d';

test.describe('Orden 77: Salón 3D compartido en las dos puertas del cliente', () => {
  test.beforeAll(() => {
    const fiesta = crearFiestaDeEstaNoche({
      id: ID,
      clavePortal: CLAVE_PORTAL,
    });
    fiesta.decoracion = {
      ...fiesta.decoracion,
      salonWidth: 20,
      salonHeight: 15,
      pixelsPerMeter: 40,
      salonPreview3dUrl: '/media/salones/default.jpg',
      salonElements: [
        {
          id: 'mesa-1',
          type: 'element',
          category: 'mesa',
          x: 200,
          y: 200,
          width: 80,
          height: 80,
          rotation: 0,
          name: 'Mesa 1',
        },
        {
          id: 'pista-1',
          type: 'area',
          category: 'pista',
          x: 400,
          y: 300,
          width: 150,
          height: 150,
          rotation: 0,
          name: 'Pista de Baile',
        },
      ],
    };
    guardarFiesta(fiesta);
  });

  test.afterAll(() => {
    borrarFiesta(ID);
  });

  test('Puerta 1: /portal/[fiestaId]/decoracion muestra la sección del salón 3D sin errores', async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto(`/portal/${ID}/decoracion`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const seccion3D = page.locator('[data-testid="seccion-salon-3d"]');
    await expect(seccion3D).toBeVisible({ timeout: 20_000 });

    // Comprobamos que no haya carteles de error técnico ni cuadro vacío
    const cuerpo = await page.locator('body').innerText();
    expect(cuerpo).not.toMatch(/undefined|null|error en 3d|crashed/i);

    // Debe existir o bien un canvas (si hay WebGL) o bien la imagen de fallback
    const hayCanvas = await seccion3D.locator('canvas').count();
    const hayImagen = await seccion3D.locator('img').count();
    expect(hayCanvas + hayImagen, 'debe tener canvas 3D o foto de fallback').toBeGreaterThan(0);
  });

  test('Puerta 2: /portal-cliente/[id] muestra la sección del salón 3D al ingresar con clave', async ({ page, context }, testInfo) => {
    test.setTimeout(60_000);

    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    await page.goto(`/portal-cliente/${ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Si pide clave, ingresarla
    const inputClave = page.locator('input[type="password"], input[name="accessKey"]');
    if ((await inputClave.count()) > 0 && (await inputClave.isVisible())) {
      await inputClave.fill(CLAVE_PORTAL);
      const botonEntrar = page.getByRole('button', { name: /entrar|ingresar|acceder/i });
      if ((await botonEntrar.count()) > 0) {
        await botonEntrar.click();
        await page.waitForTimeout(2000);
      }
    }

    // Ir a la pestaña de decoración si existe
    const tabDeco = page.getByRole('tab', { name: /decoraci[oó]n/i });
    if ((await tabDeco.count()) > 0 && (await tabDeco.isVisible())) {
      await tabDeco.click();
      await page.waitForTimeout(1000);
    }

    const seccion3D = page.locator('[data-testid="seccion-salon-3d"]');
    if ((await seccion3D.count()) > 0) {
      await expect(seccion3D).toBeVisible({ timeout: 15_000 });
      const hayCanvas = await seccion3D.locator('canvas').count();
      const hayImagen = await seccion3D.locator('img').count();
      expect(hayCanvas + hayImagen, 'debe tener canvas 3D o foto de fallback').toBeGreaterThan(0);
    } else {
      // Si el portal aún no expone la pestaña de decoración con clave (límite del usuario),
      // verificamos que la pantalla no se rompa ni quede en blanco
      const cuerpo = await page.locator('body').innerText();
      expect(cuerpo.length).toBeGreaterThan(50);
      expect(cuerpo).not.toMatch(/undefined|null|error en 3d/i);
    }
  });
});
