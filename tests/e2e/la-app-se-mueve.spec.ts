import { test, expect } from '@playwright/test';

test.describe('Orden 30: Que la app se mueva sin esconder lo importante', () => {
  test('La portada carga inmediatamente con título, botones de acción y secciones visibles', async ({ page }) => {
    await page.goto('/');

    // 1. Título principal visible de entrada
    const headline = page.locator('h1');
    await expect(headline).toBeVisible();

    // 2. Botón de acción principal visible
    const cta = page.getByRole('link', { name: /Proyectar mi fiesta|WhatsApp|Presupuesto/i }).first();
    await expect(cta).toBeVisible();

    // 3. Vidriera tecnológica presente y visible
    const vidriera = page.locator('#vidriera-tecnologica');
    await expect(vidriera).toBeVisible();
  });

  test('Las páginas públicas de venta muestran contenido, paquetes y contacto sin demoras', async ({ page }) => {
    await page.goto('/public/xv-anos');

    // 1. Título de la fiesta visible
    await expect(page.locator('h1')).toBeVisible();

    // 2. Menú de servicios y paquetes visible
    const servicios = page.locator('#servicios');
    await expect(servicios).toBeVisible();

    // 3. Botones de WhatsApp listos para interactuar
    const botonesWa = page.locator('a[href*="wa.me"]');
    expect(await botonesWa.count()).toBeGreaterThan(0);
  });
});
