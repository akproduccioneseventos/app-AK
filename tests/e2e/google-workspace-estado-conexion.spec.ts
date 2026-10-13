import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Orden 153: la pantalla de Google dice el estado REAL de las cuentas.
 *
 * Las pantallas que prueba este archivo son:
 * /settings/google-workspace
 *
 * Datos ficticios en el almacenamiento local que lee la acción
 * (`_google-workspace-accounts.json`, en data/ y src/data/); se restauran en `finally`.
 * Comprueba: empresa a reconectar no dice "Conectada" y "Sincronizar fiestas" queda
 * deshabilitado; un empleado con error no suma al contador y sigue visible con su aviso.
 */
const ARCHIVO = '_google-workspace-accounts.json';
const ahora = '2026-10-01T00:00:00.000Z';

test('la empresa a reconectar no figura conectada y el empleado con error no cuenta', async ({ page, context, baseURL }) => {
  const copias = new Map<string, string | null>();
  const cuentas = [
    { id: 'company', kind: 'company', email: 'ak-ficticia@example.com', accessToken: 'ficticio', status: 'needs_reconnect', connectedAt: ahora, updatedAt: ahora },
    { id: 'emp-error', kind: 'employee', employeeId: 'emp-ficticio', email: 'empleado-ficticio@example.com', accessToken: 'ficticio', status: 'error', lastError: 'token vencido', connectedAt: ahora, updatedAt: ahora },
  ];
  try {
    for (const carpeta of ['data', path.join('src', 'data')]) {
      const archivo = path.join(process.cwd(), carpeta, ARCHIVO);
      copias.set(archivo, fs.existsSync(archivo) ? fs.readFileSync(archivo, 'utf8') : null);
      fs.mkdirSync(path.dirname(archivo), { recursive: true });
      fs.writeFileSync(archivo, JSON.stringify(cuentas, null, 2));
    }
    await ponerSesionDelEquipo(context, baseURL);
    await page.goto('/settings/google-workspace');

    await expect(page.getByText('Hay que volver a conectar', { exact: true })).toBeVisible();
    await expect(page.getByText('Conectada', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Sincronizar fiestas/ })).toBeDisabled();
    await expect(page.getByRole('link', { name: /Conectar AK/ })).toBeVisible();

    // El empleado con error sigue visible con su aviso y no suma al contador.
    await expect(page.getByText('empleado-ficticio@example.com')).toBeVisible();
    await expect(page.getByText(/token vencido/)).toBeVisible();
    await expect(page.getByText(/^0\/\d+$/)).toBeVisible();
    await expect(page.getByText(/^0% del equipo/)).toBeVisible();
  } finally {
    for (const [archivo, contenido] of copias) {
      if (contenido === null) fs.rmSync(archivo, { force: true });
      else fs.writeFileSync(archivo, contenido);
    }
  }
});
