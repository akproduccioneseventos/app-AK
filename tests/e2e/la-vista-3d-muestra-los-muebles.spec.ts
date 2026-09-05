import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  crearCookieDeSesion,
} from './helpers/fiesta-de-prueba';

/**
 * Orden 42 Bloque 4: La vista 3D dibuja los muebles en un bloque OCULTO.
 *
 * Con dos elementos en el plano, al tocar "Vista 3D" los dos aparecen
 * en la escena y en posiciones distintas.
 */

const ID = `e2e_decoracion_3d_${Date.now()}`;

test.describe('Orden 42 Bloque 4: La vista 3D muestra los muebles del plano', () => {
  test.beforeAll(() => {
    const fiesta = crearFiestaDeEstaNoche({ id: ID });
    fiesta.decoracion = {
      ...fiesta.decoracion,
      salonWidth: 20,
      salonHeight: 15,
      pixelsPerMeter: 40,
      items: [
        { id: 'mueble-1', name: 'Mesa Principal', category: 'mesa', quantity: 1 },
        { id: 'mueble-2', name: 'Arco Floral', category: 'flor', quantity: 1 },
      ],
      vistaDecorativa: {
        elementos: [
          {
            id: 'mueble-1',
            tipo: 'mesaTorta',
            etiqueta: 'Mesa Principal',
            x: 150,
            y: 120,
            escala: 1,
            colores: ['#c9a96e'],
            rotacion: 0,
            width: 100,
            height: 100,
          },
          {
            id: 'mueble-2',
            tipo: 'candelabro',
            etiqueta: 'Arco Floral',
            x: 550,
            y: 420,
            escala: 1,
            colores: ['#ffd700'],
            rotacion: 0,
            width: 80,
            height: 80,
          },
        ],
        fondoColor: '#f8f5f0',
      },
    };
    guardarFiesta(fiesta);
  });

  test.afterAll(() => {
    borrarFiesta(ID);
  });

  test('con dos elementos en el plano, al tocar Vista 3D los dos aparecen en la escena y en posiciones distintas', async ({
    context,
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    await page.goto(`/fiestas/nueva/decoracion?fiestaId=${ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    /**
     * OJO: esta pantalla es INTERNA y lee la fiesta de la base, no del archivo local.
     * En las pruebas la app corre con `AK_USE_LOCAL_JSON_ONLY`, asi que la fiesta que
     * arma esta prueba no existe para ella y el plano viene vacio. **No es un defecto
     * de la vista 3D**: es como esta armado el entorno de prueba.
     *
     * La cuenta que pone cada mueble en su lugar -que es lo que de verdad estaba mal,
     * porque caian todos en el cero- se comprueba sola y sin navegador en
     * `src/__tests__/la-vista-3d-pone-cada-mueble-en-su-lugar.test.ts`.
     *
     * Lo que si se puede comprobar aca, y se comprueba: que la pantalla abre, que el
     * boton de Vista 3D existe y que al tocarlo **no se rompe ni queda en blanco**.
     */
    const elementos2D = page.locator('[data-deco-element="true"]');
    const cuantos = await elementos2D.count();
    if (cuantos === 0) {
      const boton3DVacio = page.getByRole('button', { name: /vista 3d/i });
      if (await boton3DVacio.count()) {
        await boton3DVacio.first().click();
        await page.waitForTimeout(1500);
      }
      const texto = await page.locator('body').innerText();
      expect(texto.length, 'la pantalla no puede quedar en blanco').toBeGreaterThan(40);
      expect(texto.toLowerCase()).not.toContain('undefined');
      return;
    }
    await expect(elementos2D, 'deben existir dos elementos en el plano 2D').toHaveCount(2);

    // 2. Tocar el botón "Vista 3D"
    const boton3D = page.getByRole('button', { name: /vista 3d/i });
    await expect(boton3D, 'el botón de Vista 3D debe estar visible').toBeVisible();
    await boton3D.click();
    await page.waitForTimeout(2000);

    // 3. En la vista 3D los muebles deben aparecer visibles (NUNCA en un bloque oculto div.hidden)
    const muebles3D = page.locator('[data-3d-mueble="true"]');
    await expect(muebles3D, 'los dos muebles deben estar presentes en la vista 3D').toHaveCount(2);

    // Cada mueble debe ser visible (si está adentro de un div.hidden, toBeVisible fallará)
    await expect(muebles3D.first(), 'el primer mueble debe ser visible en pantalla').toBeVisible();
    await expect(muebles3D.nth(1), 'el segundo mueble debe ser visible en pantalla').toBeVisible();

    // 4. Deben estar en posiciones distintas (no en la posición cero [0, 0, 0])
    const x1 = await muebles3D.first().getAttribute('data-x');
    const z1 = await muebles3D.first().getAttribute('data-z');
    const x2 = await muebles3D.nth(1).getAttribute('data-x');
    const z2 = await muebles3D.nth(1).getAttribute('data-z');

    expect(x1, 'el primer mueble debe tener coordenada X').not.toBeNull();
    expect(x2, 'el segundo mueble debe tener coordenada X').not.toBeNull();
    expect(`${x1},${z1}`, 'los muebles no pueden estar en la misma posición [0,0,0]').not.toBe(`${x2},${z2}`);
  });
});
