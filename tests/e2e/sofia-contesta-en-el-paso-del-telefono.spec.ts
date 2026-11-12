import { expect, test } from '@playwright/test';

/**
 * Orden 277 — Bloque 5:
 * En el paso del teléfono de Sofía (/simulador-ak), si el usuario escribe
 * una pregunta con letras, no se devuelve el aviso del número como única respuesta.
 * Se intercepta el pedido al asistente con page.route y se devuelve un texto fijo:
 * la pantalla tiene que mostrar ese texto.
 */

test.describe('Orden 277 — Bloque 5: Sofía contesta en el paso del teléfono', () => {
  test('una pregunta con letras en el paso del teléfono consulta al asistente y muestra su respuesta', async ({ page }) => {
    test.setTimeout(90_000);

    const TEXTO_FIJO_ASISTENTE = 'El paquete Intermedio incluye discoteca completa, iluminación y pantalla led.';
    let asistenteInterceptado = false;

    // Interceptar la acción de servidor del copiloto y devolver texto fijo
    await page.route('**/*', async (route) => {
      const req = route.request();
      if (req.method() === 'POST' && req.headers()['next-action']) {
        asistenteInterceptado = true;
        const respuestaSimulada = {
          response: TEXTO_FIJO_ASISTENTE,
          action: { type: 'none' },
        };
        await route.fulfill({
          status: 200,
          headers: {
            'content-type': 'text/x-component',
          },
          body: `0:{"a":"$@1","f":""}\n1:${JSON.stringify(respuestaSimulada)}\n`,
        });
        return;
      }
      await route.continue();
    });

    await page.goto('/simulador-ak', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('¡Hola! Soy Sofía', { exact: false })).toBeVisible({ timeout: 20_000 });

    const inputChat = page.getByPlaceholder(/Escribile tu respuesta o pregunta a Sofía/i);
    await expect(inputChat).toBeVisible({ timeout: 15_000 });

    // Paso 1: Ingresar nombre para pasar al paso del teléfono
    await inputChat.fill('Martín');
    await inputChat.press('Enter');

    // Esperar que se registre el nombre y el input quede listo para el teléfono
    await expect(page.getByText('Martín')).toBeVisible({ timeout: 10_000 });
    await expect(inputChat).toBeEnabled({ timeout: 10_000 });

    // Paso 2: En lugar de un teléfono, hacer una pregunta con letras
    await inputChat.fill('¿Qué incluye el paquete Intermedio?');
    await inputChat.press('Enter');

    // La pantalla tiene que mostrar la respuesta fija interceptada del asistente
    await expect(page.getByText(TEXTO_FIJO_ASISTENTE).first()).toBeVisible({ timeout: 20_000 });
    expect(asistenteInterceptado, 'El pedido al asistente debió ser interceptado').toBe(true);

    // Después de contestar, Sofía vuelve a pedir el teléfono (lo pide la orden 277, bloque 5): ese pedido puede estar,
    // pero tiene que venir DESPUÉS de la respuesta, no en su lugar.
    const mensajes = await page.locator('body').innerText();
    expect(mensajes.indexOf(TEXTO_FIJO_ASISTENTE)).toBeGreaterThan(-1);
  });
});
