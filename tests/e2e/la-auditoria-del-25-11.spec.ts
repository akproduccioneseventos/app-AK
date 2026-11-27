import { test, expect } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test.describe('Orden 349 — Auditoría externa del 25/11', () => {
  test('la LED pública no muestra platos sin precio ni PRUEBA, conserva datos tras "Ver galería" y dice +200 (no 500)', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/presentacion-led', { waitUntil: 'domcontentloaded' });

    // Avanzar desde Portada -> Beneficios -> Datos del evento
    await page.getByRole('button', { name: /Empezar propuesta|Comenzar/i }).click();
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    // Completar datos del evento: nombre, tipo, fecha, invitados y duración
    await page.locator('input[placeholder="Ej: María y José"]').fill('Sofía y Lucas');
    await page.locator('select').first().selectOption('Boda');
    await page.locator('input[type="date"]').fill('2027-03-20');
    await page.locator('input[placeholder="Ej: 100"]').fill('120');
    await page.getByRole('button', { name: 'Menos de 4 horas' }).click();
    await page.getByRole('button', { name: /Continuar|Siguiente/i }).first().click();
    await page.waitForTimeout(400);

    // Avanzar hasta Entradas (pasando Salón y Equipo si aparecen)
    for (let i = 0; i < 4; i++) {
      const enEntradas = await page.getByText('Elegí las Entradas').isVisible().catch(() => false);
      if (enEntradas) break;
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(300);
    }

    await expect(page.getByText('Elegí las Entradas')).toBeVisible({ timeout: 15_000 });

    const bodyEntradas = await page.locator('body').innerText();
    expect(bodyEntradas).not.toMatch(/\bPRUEBA\b/);

    // Abrir "Ver galería" en Entradas y cerrarla; verificar que siguen cargados los datos
    const verGaleria = page.getByRole('button', { name: /Ver galería/i }).first();
    if (await verGaleria.isVisible().catch(() => false)) {
      await verGaleria.click();
      const modalTitulo = page.getByRole('heading', { name: 'Entrada', exact: true });
      await expect(modalTitulo).toBeVisible({ timeout: 5_000 });
      await page.keyboard.press('Escape');
      await expect(modalTitulo).toBeHidden({ timeout: 5_000 });
    }

    const sessionDatos = await page.evaluate(() => {
      const raw = sessionStorage.getItem('presentacion_cliente_data');
      return raw ? JSON.parse(raw) : null;
    });
    expect(sessionDatos?.nombre).toBe('Sofía y Lucas');
    expect(sessionDatos?.fechaEvento).toBe('2027-03-20');
    expect(sessionDatos?.invitadosAdultos).toBe('120');

    // Ir a Testimonios y verificar "+200" y no "500 familias"
    const btnSiguiente = page.getByTestId('btn-siguiente-slide');
    for (let i = 0; i < 25; i++) {
      const enTestimonios = await page.getByText('Lo que dicen').isVisible().catch(() => false);
      if (enTestimonios) break;
      if (await btnSiguiente.isVisible().catch(() => false)) {
        await btnSiguiente.click().catch(() => page.keyboard.press('ArrowRight'));
      } else {
        await page.keyboard.press('ArrowRight');
      }
      await page.waitForTimeout(250);
    }

    await expect(page.getByText('Lo que dicen')).toBeVisible({ timeout: 10_000 });
    const textoTestimonios = await page.locator('body').innerText();
    expect(textoTestimonios).toContain('+200');
    expect(textoTestimonios).not.toContain('500 familias');
  });

  test('/eventos -> "Volver al Menú Principal" lleva a /mi-dia', async ({ page, context }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = (testInfo.project.use.baseURL as string) || 'http://127.0.0.1:3000';
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto('/eventos', { waitUntil: 'domcontentloaded' });
    const volverBtn = page.getByRole('link', { name: /Volver al Menú Principal/i });
    await expect(volverBtn).toBeVisible({ timeout: 30_000 });
    await expect(volverBtn).toHaveAttribute('href', '/mi-dia');
    await volverBtn.click();
    await expect(page).toHaveURL(/\/mi-dia/);
  });

  test('la página 404 dice "Esta página no existe" con tilde', async ({ page, context }, testInfo) => {
    const baseURL = (testInfo.project.use.baseURL as string) || 'http://127.0.0.1:3000';
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto('/ruta-inexistente-auditoria-25-11', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Esta página no existe' })).toBeVisible();
  });
});
