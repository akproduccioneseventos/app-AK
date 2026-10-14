import { test, expect } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Orden 135: el panel del Asistente AK, abierto, entra entero en la pantalla, en la
 * computadora y en el celular. Antes podía quedar cortado contra un borde según dónde
 * estuviera el botón flotante, y en el celular la página se corría de costado.
 */
test('el panel del asistente abierto entra entero en la pantalla', async ({ page, context, baseURL }) => {
  await ponerSesionDelEquipo(context, baseURL);
  await page.goto('/empresa/dashboard', { waitUntil: 'domcontentloaded' });

  const boton = page.getByRole('button', { name: 'Abrir Asistente IA AK' });
  await expect(boton).toBeVisible({ timeout: 45_000 });
  await boton.click();

  const panel = page.getByTestId('panel-asistente');
  await expect(panel).toBeVisible({ timeout: 15_000 });

  const caja = await panel.boundingBox();
  const pantalla = page.viewportSize()!;
  expect(caja, 'el panel tiene tamaño').not.toBeNull();
  expect(caja!.x, 'no se sale por la izquierda').toBeGreaterThanOrEqual(-1);
  expect(caja!.y, 'no se sale por arriba').toBeGreaterThanOrEqual(-1);
  expect(caja!.x + caja!.width, 'no se sale por la derecha').toBeLessThanOrEqual(pantalla.width + 1);
  expect(caja!.y + caja!.height, 'no se sale por abajo').toBeLessThanOrEqual(pantalla.height + 1);

  // Y la página no se corre de costado con el panel abierto.
  const desborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(desborde, 'la página no se corre de costado').toBeLessThanOrEqual(1);
});
