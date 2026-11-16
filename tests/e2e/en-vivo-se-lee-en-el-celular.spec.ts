import { test, expect } from '@playwright/test';
import { ponerSesionDelEquipo, crearFiestaDeEstaNoche, borrarFiesta } from './helpers/fiesta-de-prueba';

test('a 390 px, en /fiestas/nueva/en-vivo ninguna pestaña se superpone y el título Recepción tiene color contrastante (Orden 285 - Bloques 8 y 9)', async ({
  page,
  context,
  baseURL,
}) => {
  const fiesta = crearFiestaDeEstaNoche();
  try {
    await ponerSesionDelEquipo(context, baseURL);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/fiestas/nueva/en-vivo?fiestaId=${fiesta.id}`);

    const tabs = page.locator('[role="tab"]');
    await expect(tabs.first()).toBeVisible({ timeout: 30_000 });
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // Comprobar que ninguna pestaña se superpone con las demás (sus bounding boxes no se cruzan)
    const boxes = [];
    for (let i = 0; i < count; i++) {
      const box = await tabs.nth(i).boundingBox();
      expect(box).not.toBeNull();
      boxes.push(box!);
    }

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        // Dos rectángulos se cruzan si se superponen horizontal y verticalmente
        const intersectan =
          a.x < b.x + b.width - 1 &&
          a.x + a.width - 1 > b.x &&
          a.y < b.y + b.height - 1 &&
          a.y + a.height - 1 > b.y;
        expect(intersectan).toBe(false);
      }
    }

    // Comprobar que el título Recepción es visible y tiene color distinto del fondo de su tarjeta
    const tituloRecepcion = page.getByText('Recepción', { exact: false }).first();
    await expect(tituloRecepcion).toBeVisible();

    const contraste = await tituloRecepcion.evaluate((el) => {
      const card = el.closest('[class*="bg-"]') || el.parentElement;
      const colorTexto = window.getComputedStyle(el).color;
      const colorFondo = card ? window.getComputedStyle(card).backgroundColor : '';
      return { colorTexto, colorFondo, distintos: colorTexto !== colorFondo };
    });
    expect(contraste.distintos).toBe(true);
  } finally {
    borrarFiesta(fiesta.id);
  }
});
