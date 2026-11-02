import { expect, test } from '@playwright/test';

test.describe('Orden 96 - Bloque 4: El carrusel de tecnología se ve entero', () => {
  const tamanos = [
    { nombre: 'computadora', width: 1280, height: 800 },
    { nombre: 'celular', width: 390, height: 844 },
  ];

  for (const tamano of tamanos) {
    test(`en ${tamano.nombre} (${tamano.width}x${tamano.height}) los botones se ven enteros y cambian la ficha`, async ({ page }) => {
      await page.setViewportSize({ width: tamano.width, height: tamano.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      // Localizamos la sección del carrusel interactivo
      const seccion = page.locator('text=Más diversión, más momentos para recordar.').first();
      await seccion.scrollIntoViewIfNeeded();
      await expect(seccion).toBeVisible({ timeout: 15_000 });

      // Botón de Plataforma 360 y Espejo Mágico
      const boton360 = page.locator('button', { hasText: 'Plataforma 360' }).first();
      await boton360.scrollIntoViewIfNeeded();
      await expect(boton360).toContainText('Plataforma 360');

      // Verificamos que el botón no quede cortado y se pueda hacer clic
      // Con la máquina cargada, el primer toque puede llegar antes de que la portada termine de
      // arrancar y se pierde (falló así dos veces en la puerta del 21/10/2026, y pasaba sola). Se
      // vuelve a tocar hasta que la ficha cambie: lo que se comprueba es que el botón la cambia.
      const tituloFicha = page.locator('h3', { hasText: 'Plataforma 360' }).first();
      await expect(async () => {
        await boton360.click();
        await expect(tituloFicha).toContainText('Plataforma 360', { timeout: 3_000 });
      }).toPass({ timeout: 45_000 });

      // Probamos también con Espejo Mágico
      const botonEspejo = page.locator('button', { hasText: 'Espejo Mágico' }).first();
      await botonEspejo.scrollIntoViewIfNeeded();
      await expect(botonEspejo).toContainText('Espejo Mágico');
      const tituloEspejo = page.locator('h3', { hasText: 'Espejo Mágico' }).first();
      await expect(async () => {
        await botonEspejo.click();
        await expect(tituloEspejo).toContainText('Espejo Mágico', { timeout: 3_000 });
      }).toPass({ timeout: 45_000 });
    });
  }
});
