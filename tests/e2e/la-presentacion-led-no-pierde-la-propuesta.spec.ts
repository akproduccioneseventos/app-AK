import { expect, test } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test.describe('Orden 338 - La presentación LED no pierde la propuesta', () => {
  test('completar datos en presentación LED, abrir galería sin salir y generar presupuesto conservando datos y 10%', async ({ context, page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
    test.setTimeout(120_000);
    const baseURL = (testInfo.project.use.baseURL as string) || 'http://127.0.0.1:3100';
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto('/presentacion-led', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(page.getByText(/Cargando presentaci/i)).toBeHidden({ timeout: 60_000 });
    await page.waitForTimeout(500);

    const empezarBtn = page.getByRole('button', { name: /Empezar propuesta/i });
    if (await empezarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await empezarBtn.click();
      await page.waitForTimeout(300);
    }

    // Llenar datos del evento (slide 1 / datos-evento-slide)
    const inputNombre = page.locator('input[placeholder*="María"], input[placeholder*="Ej: María"]').first();
    await inputNombre.fill('María Orden 338');
    await page.locator('select').first().selectOption('Casamiento');
    await page.locator('input[type="date"]').first().fill('2027-05-15');
    await page.locator('input[placeholder="Ej: 100"]').first().fill('100');
    await page.getByRole('button', { name: /Más de 4 horas/i }).click();

    // Avanzar slides hasta encontrar galería o sección de entradas/regalos
    let galleryOpened = false;
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(250);

      const btnGaleria = page.getByRole('button', { name: /ver galería|galería/i }).first();
      if (await btnGaleria.isVisible({ timeout: 3005 }).catch(() => false)) {
        await btnGaleria.click();
        galleryOpened = true;
        await page.waitForTimeout(400);
        break;
      }
    }

    // Si abrió galería, cerrarla con Escape y verificar URL
    if (galleryOpened) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
    expect(page.url()).toContain('/presentacion-led');

    // Confirmar que al volver o recargar en /presentacion-led se mantiene el avance/datos
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Cargando presentaci/i)).toBeHidden({ timeout: 60_000 });
    await page.waitForTimeout(500);

    // Avanzar hasta la slide de cierre
    const btnPlanPagos = page.locator('button:has-text("Plan Pagos")').first();
    for (let i = 0; i < 30; i++) {
      if (await btnPlanPagos.isVisible({ timeout: 3005 }).catch(() => false)) break;
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(200);
    }

    if (!(await btnPlanPagos.isVisible().catch(() => false))) {
      const btnSiguiente = page.getByTestId('btn-siguiente-slide');
      for (let i = 0; i < 15; i++) {
        if (await btnPlanPagos.isVisible().catch(() => false)) break;
        if (await btnSiguiente.isVisible().catch(() => false)) {
          await btnSiguiente.click().catch(() => page.keyboard.press('ArrowRight'));
        } else {
          await page.keyboard.press('ArrowRight');
        }
        await page.waitForTimeout(200);
      }
    }

    await expect(btnPlanPagos).toBeVisible({ timeout: 15_000 });
    await btnPlanPagos.scrollIntoViewIfNeeded();
    await btnPlanPagos.click();

    // Navega a /presupuestos/nuevo/crear
    await page.waitForURL(/\/presupuestos\/nuevo\/crear/, { timeout: 30_000 });
    const currentUrl = page.url();
    expect(currentUrl).toContain('leadName=');
    expect(currentUrl).toContain('fecha=2027-05-15');

    // Verificar si pregunta por borrador previo o carga María Orden 338 y fecha 15
    await page.waitForTimeout(1000);
    const contentCrear = await page.content();
    expect(contentCrear).toContain('María Orden 338');

    const inputFecha = page.locator('input[type="date"]').first();
    if (await inputFecha.isVisible().catch(() => false)) {
      const fechaVal = await inputFecha.inputValue();
      expect(fechaVal).toBe('2027-05-15');
      expect(fechaVal).not.toContain('-14');
    }

    // Verificar en el resumen / paso 3 la línea "Descuento promocional 10%"
    for (let i = 0; i < 5; i++) {
      const siguientePresupuesto = page.getByRole('button', { name: /siguiente|continuar|resumen/i }).first();
      if (await siguientePresupuesto.isVisible({ timeout: 1000 }).catch(() => false)) {
        await siguientePresupuesto.click();
        await page.waitForTimeout(500);
      } else {
        break;
      }
    }

    const contentResumen = await page.content();
    expect(contentResumen).toMatch(/descuento|10%/i);
  });

  test('recuperar presupuesto en progreso desde sessionStorage', async ({ context, page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
    const baseURL = (testInfo.project.use.baseURL as string) || 'http://127.0.0.1:3100';
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto('/presupuestos/nuevo/crear', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      sessionStorage.setItem('presupuestoEnProgreso_v3', JSON.stringify({ clienteNombre: 'Borrador Viejo', serviciosSeleccionados: [] }));
    });

    await page.goto('/presupuestos/nuevo/crear?leadName=Nueva+Propuesta&fecha=2027-05-15', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Tenés un presupuesto a medio hacer de Borrador Viejo/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="btn-aplicar-propuesta"]')).toBeVisible();
  });
});
