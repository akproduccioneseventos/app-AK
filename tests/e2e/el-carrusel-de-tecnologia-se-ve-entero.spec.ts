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
      const seccion = page.locator('text=Experiencias que hacen tu fiesta inolvidable').first();
      await seccion.scrollIntoViewIfNeeded();
      await expect(seccion).toBeVisible({ timeout: 15_000 });

      // Botón de Plataforma 360 y Espejo Mágico
      const boton360 = page.locator('button', { hasText: 'Plataforma 360' }).first();
      await boton360.scrollIntoViewIfNeeded();
      await expect(boton360).toBeVisible({ timeout: 10_000 });

      // Verificamos que el botón no quede cortado y se pueda hacer clic
      await boton360.click();

      // La ficha cambia al nombre de la estación seleccionada
      const tituloFicha = page.locator('h3', { hasText: 'Plataforma 360' }).first();
      await expect(tituloFicha).toBeVisible({ timeout: 10_000 });

      // Probamos también con Espejo Mágico
      const botonEspejo = page.locator('button', { hasText: 'Espejo Mágico' }).first();
      await botonEspejo.scrollIntoViewIfNeeded();
      await expect(botonEspejo).toBeVisible({ timeout: 10_000 });
      await botonEspejo.click();

      const tituloEspejo = page.locator('h3', { hasText: 'Espejo Mágico' }).first();
      await expect(tituloEspejo).toBeVisible({ timeout: 10_000 });
    });
  }
});
