import { test, expect } from '@playwright/test';
import { ponerSesionDeAuditor, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Orden 308 — Bloque 1: Lo que borra se esconde para quien no puede (auditor / sólo lectura).
 * Los botones que borran, reinician o restauran no se muestran si la sesión
 * es de sólo mirar (esSesionDeSoloLectura) o no tiene permisos de administración.
 */
test.describe('Orden 308: lo que borra no se ve para el auditor', () => {
  test('con sesión de auditor: botones destructivos en eventos y settings no están en pantalla', async ({ page, context }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDeAuditor(context, baseURL);

    // 1. En /eventos
    await page.goto('/eventos', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 30_000 });

    // Botones globales de reinicio/borrado no deben existir en el DOM
    await expect(page.getByRole('button', { name: /reiniciar planificador/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /eliminar todo permanentemente/i })).toHaveCount(0);

    // Acciones destructivas por tarjeta
    await expect(page.getByRole('button', { name: /^archivar$/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^eliminar$/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^duplicar$/i })).toHaveCount(0);

    // 2. En /settings/datos
    await page.goto('/settings/datos', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 30_000 });

    // Mensaje de solo lectura visible y botones destructivos ocultos
    await expect(page.getByText(/sesión de sólo lectura/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /eliminar todo permanentemente/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /restaurar datos/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /reiniciar crm/i })).toHaveCount(0);

    // 3. En /settings/backup
    await page.goto('/settings/backup', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: /restaurar desde archivo/i })).toHaveCount(0);
  });

  test('con sesión del equipo: botones destructivos se muestran para el administrador', async ({ page, context }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto('/eventos', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 30_000 });

    // El admin ve los botones de administración
    await expect(page.getByRole('button', { name: /reiniciar planificador/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /eliminar todo permanentemente/i })).toBeVisible({ timeout: 15_000 });
  });
});
