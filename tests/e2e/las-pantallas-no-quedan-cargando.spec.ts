import { test, expect } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Orden 226: Las pantallas no quedan cargando.
 * Verifica que 5 pantallas no queden con rueditas infinitas ni vacías:
 * - carta-tragos con fiesta inexistente
 * - modulo-invitado con fiesta inexistente
 * - settings/contratos/clausulas
 * - settings/whatsapp-templates
 * - settings/whatsapp
 */

test.describe('Las pantallas no quedan cargando (Orden 226)', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await ponerSesionDelEquipo(context, baseURL);
  });

  test('carta-tragos con fiesta inexistente muestra aviso y no queda cargando', async ({ page }) => {
    await page.goto('/fiestas/nueva/carta-tragos?fiestaId=fiesta-que-no-existe', { waitUntil: 'domcontentloaded' });
    const heading = page.getByRole('heading', { level: 2 });
    await expect(heading).toContainText(/fiesta no encontrada|no se pudo cargar/i, { timeout: 15000 });
    await expect(page.locator('.animate-spin')).toHaveCount(0);
  });

  test('modulo-invitado con fiesta inexistente muestra Fiesta no encontrada y no queda cargando', async ({ page }) => {
    await page.goto('/fiestas/nueva/modulo-invitado?fiestaId=fiesta-que-no-existe', { waitUntil: 'domcontentloaded' });
    const heading = page.getByRole('heading', { name: /fiesta no encontrada/i });
    await expect(heading).toContainText(/fiesta no encontrada/i, { timeout: 15000 });
    await expect(page.locator('.animate-spin')).toHaveCount(0);
  });

  test('settings contratos clausulas carga y no queda cargando', async ({ page }) => {
    await page.goto('/settings/contratos/clausulas', { waitUntil: 'domcontentloaded' });
    const heading = page.getByRole('heading', { name: /cláusulas del contrato/i });
    await expect(heading).toContainText(/cláusulas del contrato/i, { timeout: 15000 });
    await expect(page.locator('.animate-spin')).toHaveCount(0);
  });

  test('settings whatsapp templates carga y no queda cargando', async ({ page }) => {
    await page.goto('/settings/whatsapp-templates', { waitUntil: 'domcontentloaded' });
    const heading = page.getByRole('heading', { name: /plantillas de mensajes whatsapp/i });
    await expect(heading).toContainText(/plantillas de mensajes whatsapp/i, { timeout: 15000 });
    await expect(page.locator('.animate-spin')).toHaveCount(0);
  });

  test('settings whatsapp carga y no queda cargando', async ({ page }) => {
    await page.goto('/settings/whatsapp', { waitUntil: 'domcontentloaded' });
    const heading = page.getByRole('heading', { name: /integración whatsapp/i });
    await expect(heading).toContainText(/integración whatsapp/i, { timeout: 15000 });
    await expect(page.locator('.animate-spin')).toHaveCount(0);
  });
});
