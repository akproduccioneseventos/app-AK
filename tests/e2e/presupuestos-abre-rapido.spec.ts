import { test, expect } from '@playwright/test';
import { crearCookieDeSesion } from './helpers/fiesta-de-prueba';

/**
 * Orden 290 - Bloque 1: Presupuestos abre rÃ¡pido en celular.
 * A 390 px, la lista de presupuestos aparece antes de que termine
 * la correcciÃ³n de fechas en segundo plano (reteniendo su respuesta).
 */
test.describe('Orden 290: Central de presupuestos abre rÃ¡pido en mobile', () => {
  test('a 390 px, la lista de presupuestos aparece antes de que termine la reparaciÃ³n de fechas', async ({ page, context }, testInfo) => {
    test.setTimeout(60_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

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
        // repairVerifiedBudgetDates se llama sin argumentos (envÃ­a '[]') o si es la llamada sin params con total
        const esReparacion = postData === '[]' || (!postData.includes('withTotalCount') && !reparacionRetenida && request.headers()['next-action']);

        if (esReparacion && !reparacionRetenida) {
          reparacionRetenida = true;
          // Retenemos la respuesta de la correcciÃ³n de fechas
          await promesaReparacion;
          return route.continue();
        }
      }
      return route.continue();
    });

    await page.goto('/presupuestos/nuevo', { waitUntil: 'domcontentloaded' });

    // El tÃ­tulo y la secciÃ³n principal de presupuestos deben estar visibles rÃ¡pidamente
    await expect(page.getByText('Central de Presupuestos')).toBeVisible({ timeout: 15_000 });

    // La lista de presupuestos o el contenedor ordenado se renderiza ANTES de que termine la reparaciÃ³n
    const seccionOrdenados = page.getByText('Presupuestos ordenados');
    await expect(seccionOrdenados).toBeVisible({ timeout: 20_000 });

    // El tab de "Todos (" debe mostrarse ya con la lista cargada
    const tabTodos = page.getByRole('tab', { name: /Todos \(\d+\)/i });
    await expect(tabTodos).toBeVisible({ timeout: 15_000 });

    // Liberamos la correcciÃ³n de fechas retenida para terminar limpiamente
    if (liberarReparacion) {
      (liberarReparacion as () => void)();
    }
  });
});
