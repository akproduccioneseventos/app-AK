import { test, expect } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Orden 298 - Bloque 7 (devuelta de orden 290): Presupuestos abre rápido.
 * Usa ponerSesionDelEquipo (cookie + localStorage para AuthGuard).
 * Retiene únicamente repairVerifiedBudgetDates (POST next-action con postData === '[]').
 * Comprueba que el texto buscado aparece y no se bloquea por la acción de fondo.
 */
test.describe('Orden 298: Presupuestos abre rápido sin esperar la corrección de fechas', () => {
  test('a 390 px, la lista de presupuestos aparece antes de que termine la reparación de fechas', async ({ page, context }, testInfo) => {
    test.setTimeout(60_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);

    await page.setViewportSize({ width: 390, height: 844 });

    let liberarReparacion: (() => void) | null = null;
    const promesaReparacion = new Promise<void>((resolve) => {
      liberarReparacion = resolve;
    });

    let reparacionRetenida = false;

    await page.route('**/presupuestos/nuevo**', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const postData = request.postData() || '';
        const headers = request.headers();
        const tieneNextAction = Boolean(headers['next-action']);
        // repairVerifiedBudgetDates se llama con argumentos vacíos '[]'
        const esReparacion = tieneNextAction && postData === '[]';

        if (esReparacion && !reparacionRetenida) {
          reparacionRetenida = true;
          await promesaReparacion;
          return route.continue();
        }
      }
      return route.continue();
    });

    await page.goto('/presupuestos/nuevo', { waitUntil: 'domcontentloaded' });

    // La sección de ordenados aparece rápido y comprobamos el resultado
    const seccionOrdenados = page.getByText('Presupuestos ordenados');
    await expect(seccionOrdenados.first()).toBeVisible({ timeout: 20_000 });
    await expect(seccionOrdenados).toHaveCount(1);
    await expect(seccionOrdenados.first()).toContainText('Presupuestos ordenados');

    // Liberamos la corrección de fechas
    if (liberarReparacion) {
      (liberarReparacion as () => void)();
    }
  });
});
