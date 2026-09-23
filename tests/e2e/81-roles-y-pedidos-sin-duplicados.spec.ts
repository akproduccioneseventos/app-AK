import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
} from './helpers/fiesta-de-prueba';

/**
 * Orden 81 — Sección D: Barra tecnológica, roles y pedidos sin duplicados en el navegador.
 *
 * Verifica que:
 * 1. La pantalla de invitación del invitado abre correctamente.
 * 2. El invitado no tiene acceso a botones de administración, barman ni control de stock.
 * 3. La interfaz del invitado permite explorar la fiesta y los servicios asignados sin privilegios indebidos.
 */

const fiesta = crearFiestaDeEstaNoche({ id: `e2e_barra_81_${Date.now()}` });
const invitado = fiesta.invitados?.[0] || {
  id: 'inv_test_81',
  nombre: 'Invitado Prueba',
  tableNumber: '1',
  guestAccessToken: 'tok_test_81',
};

test.beforeAll(() => guardarFiesta(fiesta));
test.afterAll(() => borrarFiesta(fiesta.id));

test.describe('Orden 81 — Barra tecnológica: roles e interfaz de invitado', () => {
  test('la pantalla del invitado no muestra controles administrativos de barman ni botones de gestión', async ({ page }) => {
    test.setTimeout(90_000);

    // 1. Abrir la pantalla del invitado
    await page.goto(`/invitacion/${fiesta.id}/invitado/${invitado.id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 25_000 }).catch(() => {});

    // 2. Verificar que no se muestran botones administrativos de operador ni barman
    await expect(page.getByRole('button', { name: /pausar barra|entregar pedido|cerrar caja|gestionar stock/i })).toHaveCount(0);
    await expect(page.getByText(/Panel de control barman|Modo Bartender|Administración de barra/i)).toHaveCount(0);

    // 3. Verificar que los elementos propios del invitado están presentes
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(invitado.nombre, { exact: false })).toBeVisible({ timeout: 20_000 });
  });
});
