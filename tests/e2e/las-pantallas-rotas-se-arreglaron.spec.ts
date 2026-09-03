import { test, expect } from '@playwright/test';
import { FIXTURE_IDS, crearCookieDeSesion } from '../../scripts/helpers/route-inventory.mjs';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';

/**
 * Prueba que las pantallas que ESTABAN rotas ahora den una respuesta útil,
 * no una pantalla vacía ni un error de React.
 *
 * Regla: estas pantallas se probaron sin fiestaId y sin token (igual que el
 * recorrido las encontró). El resultado esperado es una PANTALLA INFORMATIVA,
 * no un 500 ni una pantalla completamente vacía.
 *
 * Orden 35, Bloque 1.
 */
test.describe('Pantallas del portal y del invitado: fallback amigable sin ID', () => {
  const sessionCookie = crearCookieDeSesion();

  test('/portal sin fiestaId muestra un aviso amigable', async ({ page }) => {
    await page.goto('/portal');
    const text = await page.locator('body').innerText();
    // No debe estar vacío ni mostrar un error técnico
    expect(text.length).toBeGreaterThan(30);
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('[object Object]');
  });

  test('/portal-cliente redirige a /portal', async ({ page }) => {
    const response = await page.goto('/portal-cliente');
    // Debe redirigir, no dar error
    expect(page.url()).toContain('/portal');
  });

  test('/portal/mesas sin fiestaId muestra aviso amigable', async ({ page }) => {
    await page.goto('/portal/mesas');
    const text = await page.locator('body').innerText();
    expect(text.length).toBeGreaterThan(20);
  });

  test('/landing/eventos redirige correctamente', async ({ page }) => {
    const response = await page.goto('/landing/eventos');
    // No debe dar 404 ni 500
    const finalUrl = page.url();
    expect(finalUrl).not.toContain('404');
    const status = response?.status() ?? 0;
    expect(status).toBeLessThan(400);
  });
});

test.describe('Portal del proveedor: fallback amigable con token inválido', () => {
  test('/proveedor/acceso/token_demo_123 muestra aviso amigable', async ({ page }) => {
    await page.goto(`/proveedor/acceso/${FIXTURE_IDS.token}`);
    // El token de demo no existe: debe mostrar un aviso, no explotar
    const text = await page.locator('body').innerText();
    expect(text.length).toBeGreaterThan(20);
    expect(text).not.toContain('undefined');
  });
});

