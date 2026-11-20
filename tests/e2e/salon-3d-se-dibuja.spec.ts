import fs from 'node:fs';
import { expect, test } from '@playwright/test';
import { borrarFiesta, crearFiestaDeEstaNoche, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * ¿EL SALÓN 3D SE DIBUJA? Eso, y nada más.
 *
 * En Orden 321, `/empresa/configurador-reunion` se consolidó hacia
 * `/settings?seccion=contratos&sub=templates--reuniones` y la vista 3D del salón
 * vive en `/fiestas/nueva/invitados?tab=layout` (y en `/fiestas/nueva/decoracion`).
 * Esta prueba verifica que la vista 3D en el layout del salón no rompa la pantalla
 * y que, si el dibujo 3D falla, muestre el aviso en criollo de SalonSceneAislada.
 */

test('el salón 3D se dibuja y no se lleva puesta la pantalla', async ({ context, page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
  fs.mkdirSync('test-results/salon-3d', { recursive: true });

  const fiesta = crearFiestaDeEstaNoche({ id: `e2e_salon3d_${Date.now()}` });

  try {
    await ponerSesionDelEquipo(context, baseURL);

    const erroresJs: string[] = [];
    page.on('pageerror', (e) => erroresJs.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') erroresJs.push(`[consola] ${m.text()}`);
    });

    const respuesta = await page.goto(`/fiestas/nueva/invitados?tab=layout&fiestaId=${encodeURIComponent(fiesta.id)}`, {
      waitUntil: 'domcontentloaded',
    });
    expect(respuesta?.status(), 'la pantalla abre').toBeLessThan(400);

    const boton3d = page.getByRole('button', { name: '3D', exact: true });
    await expect(boton3d).toBeVisible({ timeout: 30_000 });
    await boton3d.click();

    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(5_000);

    const texto = ((await page.locator('body').innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
    fs.writeFileSync('test-results/salon-3d/lo-que-dice.txt', `${texto}\n\nERRORES:\n${erroresJs.join('\n')}\n`);
    await page.screenshot({ path: 'test-results/salon-3d/pantalla.png', fullPage: true });

    // 1. La pantalla no se muere.
    expect(texto, 'la pantalla no muestra el cartel de error general').not.toMatch(/Algo sali[oó] mal/i);

    // 2. La pantalla de layout del salón sigue activa.
    expect(texto, 'la vista de salón/invitados está visible').toMatch(/sal[oó]n|mesa|layout|invitado/i);

    // 3. Y si el dibujo falla, se dice en criollo. Nunca un cartel técnico.
    const hayDibujo = await page.locator('canvas').count();
    if (hayDibujo === 0) {
      expect(
        texto,
        'si el dibujo falla, la pantalla lo explica en criollo',
      ).toMatch(/El sal[oó]n en 3D no se pudo dibujar/i);
    }
  } finally {
    borrarFiesta(fiesta.id);
  }
});
