import { expect, test } from '@playwright/test';

function parseMonto(texto: string): number {
  const soloDigitos = texto.replace(/[^0-9]/g, '');
  return parseInt(soloDigitos, 10);
}

test.describe('Orden 243: Los textos nuevos del simulador', () => {
  test('Paso 1 tiene los textos nuevos, cuatro tarjetas y el boton es visible en 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });

    // Iniciar el simulador si está en la portada general
    const coverStart = page.getByTestId('simulator-cover-start');
    if (await coverStart.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await coverStart.click();
    }

    // Verificar h1 nuevo
    const h1 = page.locator('h1', { hasText: 'Tu fiesta, como la imaginás. Nosotros te ayudamos a hacerla realidad.' });
    await expect(h1).toBeVisible({ timeout: 15_000 });

    // Verificar las cuatro tarjetas
    await expect(page.getByText('Una organización más sencilla', { exact: false })).toBeVisible();
    await expect(page.getByText('Una fiesta a tu manera', { exact: false })).toBeVisible();
    await expect(page.getByText('Disfrutá junto a tus invitados', { exact: false })).toBeVisible();
    await expect(page.getByText('Presupuesto claro', { exact: false })).toBeVisible();

    // En 390x844 el botón "Armar mi presupuesto" está dentro de la pantalla sin hacer scroll
    const ctaButton = page.getByTestId('simulator-first-step-cta');
    await expect(ctaButton).toBeVisible();
    const box = await ctaButton.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(844);
    }
  });

  test('Paso 6 con Club Uruguay muestra desglose de 3 renglones, suma correcta, botones nuevos y sin congel', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });

    // Entrar a paso 1
    const coverStart = page.getByTestId('simulator-cover-start');
    if (await coverStart.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await coverStart.click();
    }

    // Ir al paso 2
    const ctaPaso1 = page.getByTestId('simulator-first-step-cta');
    await expect(ctaPaso1).toBeVisible({ timeout: 15_000 });
    await ctaPaso1.click();

    const continuar = page.getByRole('button', { name: /Continuar/i });

    // Paso 2: Datos
    await page.locator('#simulator-name').fill('Cliente Textos Nuevos');
    await page.locator('#simulator-phone').fill('099888777');

    // Elegir Club Uruguay
    const btnClub = page.getByRole('button', { name: /Quiero Club Uruguay/i }).first();
    await expect(btnClub).toBeVisible({ timeout: 10_000 });
    await btnClub.click();

    // Fecha
    await page.getByRole('button', { name: /fecha|Elegí|Seleccion/i }).first().click();
    await page.getByRole('button', { name: /next|siguiente|Go to next month/i }).first().click().catch(() => undefined);
    await page.locator('[role="gridcell"] button:not([disabled])').nth(10).click();

    await continuar.click();

    // Paso 3: Encabezado nuevo y continuar
    await expect(page.locator('h2', { hasText: 'Elegí lo que querés para tu fiesta' }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Cada celebración es diferente. Seleccioná las opciones que más te gusten y mirá cómo se actualiza tu presupuesto.').first()).toBeVisible();

    const mantenerSeleccion = page.getByRole('button', { name: /Mantener mi selección actual/i });
    if (await mantenerSeleccion.isVisible().catch(() => false)) {
      await mantenerSeleccion.click();
    }
    await expect(continuar).toBeEnabled({ timeout: 30_000 });
    await continuar.click();

    // Paso 4: Paquetes - Encabezado nuevo y continuar
    await expect(page.locator('h2', { hasText: 'Elegí lo que querés para tu fiesta' }).first()).toBeVisible({ timeout: 20_000 });
    if (await mantenerSeleccion.isVisible().catch(() => false)) {
      await mantenerSeleccion.click();
    }
    await expect(continuar).toBeEnabled({ timeout: 30_000 });
    await continuar.click();

    // Paso 5: Resumen y desglose
    if (await mantenerSeleccion.isVisible().catch(() => false)) {
      await mantenerSeleccion.click();
    }
    const verPropuesta = page.getByRole('button', { name: /Ver Resumen y Propuesta/i });
    await expect(verPropuesta).toBeVisible({ timeout: 30_000 });
    await verPropuesta.click();

    // Paso 6: Verificación de textos y totales
    await expect(page.locator('h2', { hasText: 'Esta es tu fiesta, y este es tu presupuesto estimado.' })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText('Ya tenés una primera propuesta. Ahora podemos ayudarte a ajustar el menú, los servicios y los detalles para que todo se adapte a lo que estás buscando.')).toBeVisible();

    // Los 3 renglones
    const labelClub = page.getByText('Alquiler del salón Club Uruguay (se paga directo al Club)').first();
    const labelServicios = page.getByText('Servicios AK').first();
    const labelTotalRef = page.getByText('Total de referencia (salón + servicios)').first();

    await expect(labelClub).toBeVisible();
    await expect(labelServicios).toBeVisible();
    await expect(labelTotalRef).toBeVisible();

    // Verificar que el total de referencia sea la suma de alquiler + servicios
    const contenedorFilaClub = labelClub.locator('..');
    const contenedorFilaServicios = labelServicios.locator('..');
    const contenedorFilaTotalRef = labelTotalRef.locator('..');

    const textoClub = (await contenedorFilaClub.textContent()) || '';
    const textoServicios = (await contenedorFilaServicios.textContent()) || '';
    const textoTotalRef = (await contenedorFilaTotalRef.textContent()) || '';

    const montoClub = parseMonto(textoClub);
    const montoServicios = parseMonto(textoServicios);
    const montoTotalRef = parseMonto(textoTotalRef);

    expect(montoClub).toBeGreaterThan(0);
    expect(montoServicios).toBeGreaterThan(0);
    expect(montoTotalRef).toBe(montoClub + montoServicios);

    // Botones "Coordinar mi entrevista gratuita" y "Consultar por WhatsApp"
    await expect(page.getByRole('button', { name: /Coordinar mi entrevista gratuita/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Consultar por WhatsApp/i }).first()).toBeVisible();

    // Prohibido "congel"
    const contenidoCompleto = (await page.textContent('body')) || '';
    expect(contenidoCompleto.toLowerCase()).not.toContain('congel');
  });
});
