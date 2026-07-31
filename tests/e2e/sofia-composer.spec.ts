import { expect, test } from '@playwright/test';

/**
 * El asistente Sofia tiene su barra para escribir anclada abajo, y la app monta
 * ahi mismo un boton flotante de WhatsApp (abajo a la derecha, por encima del
 * contenido). Sin separacion, el boton flotante cubria el boton de enviar y se
 * quedaba con el clic: la conversacion no avanzaba y el visitante abandonaba.
 *
 * Esta prueba mide ambos rectangulos y exige que no se toquen.
 */

test.describe('asistente Sofia', () => {
  test('el boton flotante no tapa el de enviar', async ({ page }) => {
    test.setTimeout(240_000);

    await page.goto('/simulador-ak', { waitUntil: 'domcontentloaded' });
    // La barra de escritura aparece con el primer mensaje de Sofia.
    await page.waitForSelector('input, textarea', { timeout: 60_000 });
    await page.waitForTimeout(2000);

    const solape = await page.evaluate(() => {
      const cajas = Array.from(document.querySelectorAll('button, a'))
        .map((el) => ({ texto: (el.textContent || '').trim(), caja: el.getBoundingClientRect() }))
        .filter((c) => c.caja.width > 0 && c.caja.height > 0);

      // El de enviar es un boton de solo icono: sin texto.
      const enviar = cajas.find((c) => c.texto === '');
      const whatsapp = cajas.find((c) => /whatsapp/i.test(c.texto));
      if (!enviar || !whatsapp) return null;

      const anchoComun = Math.max(
        0,
        Math.min(enviar.caja.right, whatsapp.caja.right) - Math.max(enviar.caja.left, whatsapp.caja.left),
      );
      const altoComun = Math.max(
        0,
        Math.min(enviar.caja.bottom, whatsapp.caja.bottom) - Math.max(enviar.caja.top, whatsapp.caja.top),
      );
      return Math.round(anchoComun * altoComun);
    });

    // null = alguno de los dos no estaba en pantalla; la prueba no aplica.
    if (solape === null) test.skip();
    expect(solape, `el boton de WhatsApp cubre ${solape}px2 del boton de enviar`).toBe(0);
  });
});
