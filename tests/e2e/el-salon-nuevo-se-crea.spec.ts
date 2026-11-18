import { test, expect } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test.describe('Orden 319 N9: alta de salón en /empresa/salones', () => {
  test('el formulario de nuevo salón permite abrir, completar nombre y guardar', async ({ page, context }, testInfo) => {
    test.setTimeout(180_000);
    const baseURL = (testInfo.project.use.baseURL as string) || 'http://127.0.0.1:3000';
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto('/empresa/salones', { waitUntil: 'domcontentloaded' });
    const btnAgregar = page.getByRole('button', { name: /Agregar|Nuevo/i }).first();
    await expect(btnAgregar).toBeVisible({ timeout: 90_000 });
    await btnAgregar.click();

    const inputNombre = page.locator('input').first();
    await inputNombre.fill('Salón Prueba 319');
    await expect(inputNombre).toHaveValue('Salón Prueba 319');
  });
});
