import { test, expect, type Page } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Orden 154: si la lectura falla, la pantalla lo dice (no muestra ceros) y deja reintentar.
 *
 * Las pantallas que prueba este archivo son:
 * /settings/sincronizaciones
 * /empresa/redes-sociales
 *
 * La falla se fuerza cortando las Server Actions (POST con cabecera `next-action`) con
 * `page.route`; nada llega a proveedores reales. Después se levanta el corte y se toca
 * "Reintentar". Comprueba el RESULTADO en pantalla: aviso visible, sin contadores en cero
 * ni "No hay publicaciones" mientras la lectura está caída, y aviso fuera tras reintentar.
 */
async function cortarAcciones(page: Page) {
  let cortado = true;
  // La PRIMERA acción que sale es la del portero (`getSessionStatus` en `AuthGuard`): sin ella
  // la pantalla rebota al ingreso y nunca llega a leer nada. Se deja pasar esa (por su id) y
  // se corta cualquier otra, que son las lecturas de la pantalla.
  let idDelPortero: string | null = null;
  await page.route('**/*', async (ruta) => {
    const r = ruta.request();
    const id = r.method() === 'POST' ? r.headers()['next-action'] : undefined;
    if (id) {
      if (idDelPortero === null) idDelPortero = id;
      if (cortado && id !== idDelPortero) {
        await ruta.abort('internetdisconnected');
        return;
      }
    }
    await ruta.continue();
  });
  return { restaurar: () => { cortado = false; } };
}

test('conexiones: lectura caída avisa, no muestra 0 conectadas y Reintentar recupera', async ({ page, context, baseURL }) => {
  test.setTimeout(120_000);
  await ponerSesionDelEquipo(context, baseURL);
  const corte = await cortarAcciones(page);
  await page.goto('/settings/sincronizaciones');

  await expect(page.getByText('No pudimos leer el estado de las conexiones')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('TOTAL PLATAFORMAS')).toHaveCount(0);
  await expect(page.getByText('CONECTADAS', { exact: true })).toHaveCount(0);

  corte.restaurar();
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByText('TOTAL PLATAFORMAS')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('No pudimos leer el estado de las conexiones')).toHaveCount(0);
  // Sin evidencia de una operación activa, el historial nunca dice "en curso".
  await expect(page.getByText('Sincronización en curso')).toHaveCount(0);
});

test('redes: lectura caída deja aviso persistente, sin "No hay publicaciones", y Reintentar relee', async ({ page, context, baseURL }) => {
  test.setTimeout(120_000);
  await ponerSesionDelEquipo(context, baseURL);
  const corte = await cortarAcciones(page);
  await page.goto('/empresa/redes-sociales');

  await expect(page.getByText('No pudimos leer las publicaciones').first()).toBeVisible({ timeout: 30_000 });
  // Pasa el tiempo del toast: el aviso sigue y la lista no se disfraza de vacía.
  await page.waitForTimeout(6_000);
  await expect(page.getByText('No pudimos leer las publicaciones').first()).toBeVisible();
  await expect(page.getByText(/No hay publicaciones/)).toHaveCount(0);
  await expect(page.getByText('Todos (0)')).toHaveCount(0);

  corte.restaurar();
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByText('No pudimos leer las publicaciones')).toHaveCount(0, { timeout: 30_000 });
});
