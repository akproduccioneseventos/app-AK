import { expect, test } from '@playwright/test';

/**
 * Orden 277 — Bloque 7:
 * En el resumen del simulador manual, los botones de guardar y de WhatsApp
 * no se superponen ni a 320, 390 ni 1280 de ancho (se comparan con boundingBox()).
 */

function boxesIntersect(
  b1: { x: number; y: number; width: number; height: number },
  b2: { x: number; y: number; width: number; height: number },
) {
  return !(
    b1.x + b1.width <= b2.x ||
    b2.x + b2.width <= b1.x ||
    b1.y + b1.height <= b2.y ||
    b2.y + b2.height <= b1.y
  );
}

test.describe('Orden 277 — Bloque 7: Las acciones del resumen no se pisan', () => {
  test('a 320, 390 y 1280, las cajas de los botones del resumen no se cruzan', async ({ page }) => {
    test.setTimeout(180_000);

    const anioFuturo = new Date().getFullYear() + 1;
    await page.goto(
      `/simulador-de-presupuesto?mes=${anioFuturo}-11&tipo=Cumplea%C3%B1os&name=Prospecto+Resumen&guests=50`,
      { waitUntil: 'domcontentloaded' },
    );

    const btnPortada = page.getByTestId('simulator-cover-start');
    if (await btnPortada.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btnPortada.click();
    }

    // Paso 1: Introducción
    const ctaPaso1 = page.getByTestId('simulator-first-step-cta');
    if (await ctaPaso1.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await ctaPaso1.click();
    } else {
      await page.getByRole('button', { name: /^Siguiente$|Continuar/i }).first().click();
    }

    // Paso 2: Datos del evento
    await expect(page.getByText(/Paso 2 de 5/i)).toBeVisible({ timeout: 20_000 });
    const phoneInput = page.locator('#simulator-whatsapp').or(page.locator('#simulator-phone')).first();
    await phoneInput.fill('099123456');

    const btnLocacion = page.getByRole('button', { name: /Locación propia|Locacion propia/i }).first();
    if (await btnLocacion.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btnLocacion.click();
    }

    await page.getByRole('button', { name: /^Siguiente$|Continuar/i }).first().click();

    // Paso 3: Catering
    await expect(page.locator('h2', { hasText: 'Elegí lo que querés para tu fiesta' }).first()).toBeVisible({ timeout: 20_000 });
    const mantenerPaso3 = page.getByRole('button', { name: /Mantener mi selección actual/i });
    if (await mantenerPaso3.isVisible().catch(() => false)) {
      await mantenerPaso3.click();
    }
    await page.getByRole('button', { name: /^Siguiente$|Continuar/i }).first().click();

    // Paso 4: Paquetes
    await expect(page.locator('h2', { hasText: 'Elegí lo que querés para tu fiesta' }).first()).toBeVisible({ timeout: 20_000 });
    const mantenerPaso4 = page.getByRole('button', { name: /Mantener mi selección actual/i });
    if (await mantenerPaso4.isVisible().catch(() => false)) {
      await mantenerPaso4.click();
    }
    await page.getByRole('button', { name: /^Siguiente$|Continuar/i }).first().click();

    // Paso 5: Personalización y generación
    await expect(page.getByText(/Paso 5 de 5/i)).toBeVisible({ timeout: 20_000 });
    const keepSelection = page.getByRole('button', { name: /Mantener mi selecci[oó]n actual/i });
    await keepSelection.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => undefined);
    if (await keepSelection.isVisible().catch(() => false)) {
      await keepSelection.click();
      await keepSelection.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
    }
    const verPropuesta = page.getByRole('button', { name: /Ver Resumen y Propuesta|^Generar$/i }).first();
    await expect(verPropuesta).toBeVisible({ timeout: 30_000 });
    await verPropuesta.click();

    // Paso 6: Resumen con botones de acción
    await expect(page.getByText(/Presupuesto registrado con éxito/i).first()).toBeVisible({ timeout: 45_000 });

    const viewports = [320, 390, 1280];
    for (const width of viewports) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(300);

      const btnGuardarPdf = page.getByRole('button', { name: /Guardar PDF/i });
      const btnWhatsapp = page.getByRole('button', { name: /WhatsApp AK/i });

      await expect(btnGuardarPdf).toBeVisible();
      await expect(btnWhatsapp).toBeVisible();

      const boxPdf = await btnGuardarPdf.boundingBox();
      const boxWa = await btnWhatsapp.boundingBox();

      expect(boxPdf, `Guardar PDF debe tener boundingBox visible a ancho ${width}`).not.toBeNull();
      expect(boxWa, `WhatsApp AK debe tener boundingBox visible a ancho ${width}`).not.toBeNull();

      const seSuperponen = boxesIntersect(boxPdf!, boxWa!);
      expect(seSuperponen, `Los botones Guardar PDF y WhatsApp AK se cruzan a ancho ${width}`).toBe(false);
    }
  });
});
