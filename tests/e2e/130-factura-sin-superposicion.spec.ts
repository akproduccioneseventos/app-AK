import { test, expect } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Orden 130, HIT80: en /invoices a 1280x720 el indicador del asistente
 * (antes `fixed right-5 top-20`) quedaba encima de "Nueva Factura" y el clic
 * abria el chat. Aca se mira el RESULTADO: que el elemento que recibe el clic
 * en el centro del boton sea el boton mismo, y que el asistente siga a la vista.
 */
const tamanos = [
  { nombre: 'escritorio 1280x720', width: 1280, height: 720, asistenteVisible: true },
  { nombre: 'movil 390x844', width: 390, height: 844, asistenteVisible: false },
];

for (const t of tamanos) {
  test(`Nueva Factura recibe el clic en ${t.nombre}`, async ({ page, context, baseURL }) => {
    await ponerSesionDelEquipo(context, baseURL);
    await page.setViewportSize({ width: t.width, height: t.height });
    await page.goto('/invoices');

    const boton = page.getByRole('link', { name: /Nueva Factura/i }).first();
    await expect(boton).toBeVisible({ timeout: 30_000 });
    const caja = await boton.boundingBox();
    expect(caja).not.toBeNull();
    const x = caja!.x + caja!.width / 2;
    const y = caja!.y + caja!.height / 2;

    const loQueRecibeElClic = await page.evaluate(
      ([px, py]) => {
        const el = document.elementFromPoint(px as number, py as number);
        const objetivo = Array.from(document.querySelectorAll('a')).find((a) =>
          /Nueva Factura/i.test(a.textContent || ''),
        );
        return {
          existe: !!el,
          dentro: !!el && !!objetivo && objetivo.contains(el),
          texto: el ? (el.textContent || '').slice(0, 60) : '',
        };
      },
      [x, y],
    );
    expect(loQueRecibeElClic.existe).toBe(true);
    expect(loQueRecibeElClic.dentro, `el clic caeria en: ${loQueRecibeElClic.texto}`).toBe(true);

    if (t.asistenteVisible) {
      const asistente = page.getByTitle('Abrir asistente activo');
      await expect(asistente).toBeVisible();
      const caja2 = await asistente.boundingBox();
      expect(caja2).not.toBeNull();
      // Dentro de la pantalla y sin cubrir el centro del boton de la cabecera.
      expect(caja2!.y + caja2!.height).toBeLessThanOrEqual(t.height);
      expect(caja2!.x + caja2!.width).toBeLessThanOrEqual(t.width);
    }

    // El resultado de verdad: un clic real en el centro abre la factura nueva, no el chat.
    await page.mouse.click(x, y);
    await expect(page).toHaveURL(/\/invoices\/new/, { timeout: 30_000 });
  });
}
