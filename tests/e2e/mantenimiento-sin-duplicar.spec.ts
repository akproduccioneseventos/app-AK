import { expect, test } from '@playwright/test';
import { borrarActivoDePrueba, ponerSesionDelEquipo, sembrarActivoDePrueba } from './helpers/fiesta-de-prueba';

/**
 * Anotar un mantenimiento cuando se pierde la confirmacion (orden 159, 12/10/2026).
 *
 * El servidor reconoce "es el mismo trabajo" por el `registroId` que manda la pantalla
 * (eso lo prueba `src/__tests__/mantenimiento-sin-duplicar-ni-perder.test.ts` contra la
 * accion real: un reintento deja una sola fila y un solo gasto). Aca se prueba la otra mitad,
 * la que solo se ve en el navegador: que la pantalla REPITA el mismo id al reintentar el mismo
 * borrador, y mande uno NUEVO cuando la persona cambia el trabajo.
 *
 * En el entorno de pruebas la escritura esta apagada (`AK_USE_LOCAL_JSON_ONLY`), asi que la
 * accion se corta antes de llegar al servidor: se mira lo que la pantalla mando y el aviso de
 * error que muestra, sin guardar nada.
 *
 * Las pantallas que prueba este archivo son:
 *   /empresa/activos-fijos/e2e_mant_equipo/editar
 */

const ID = 'e2e_mant_equipo';
const RUTA = `/empresa/activos-fijos/${ID}/editar`;

test.beforeAll(() => sembrarActivoDePrueba({ id: ID, nombre: 'Parlante de prueba mantenimiento', cantidadDisponible: 1 }));
test.afterAll(() => borrarActivoDePrueba(ID));

test('reintentar el mismo borrador manda el mismo trabajo; otro trabajo manda otro', async ({ context, page }, testInfo) => {
  test.setTimeout(120_000);
  await ponerSesionDelEquipo(context, testInfo.project.use.baseURL as string | undefined);

  const enviados: string[] = [];
  await page.route('**/empresa/activos-fijos/**', async (route) => {
    const req = route.request();
    const cuerpo = req.method() === 'POST' ? req.postData() || '' : '';
    if (req.headers()['next-action'] && cuerpo.includes('registroId')) {
      const id = cuerpo.match(/mant_[0-9a-f-]{36}/)?.[0];
      enviados.push(id || 'sin-id');
      await route.abort('failed'); // se cae la senal: la respuesta nunca llega
      return;
    }
    await route.continue();
  });

  await page.goto(RUTA);
  await page.getByRole('button', { name: /Anotar un mantenimiento/i }).click();
  await page.locator('#maint-nota').fill('Cambio de lampara');
  await page.locator('#maint-costo').fill('123.45');
  await page.getByRole('button', { name: /^Anotar mantenimiento$/i }).click();
  await expect(page.getByText(/Error al registrar mantenimiento/i).first()).toBeVisible({ timeout: 20_000 });

  // Mismo borrador, otro toque: el mismo trabajo.
  await page.getByRole('button', { name: /^Anotar mantenimiento$/i }).click();
  await expect.poll(() => enviados.length, { timeout: 20_000 }).toBe(2);
  expect(enviados[0]).toMatch(/^mant_/);
  expect(enviados[1]).toBe(enviados[0]);
  // El borrador sigue ahi para reintentar: no se lo da por anotado.
  await expect(page.locator('#maint-nota')).toHaveValue('Cambio de lampara');

  // La persona cambia el trabajo: es otro, con otro id.
  await page.locator('#maint-nota').fill('Cambio de lampara y fusible');
  await page.getByRole('button', { name: /^Anotar mantenimiento$/i }).click();
  await expect.poll(() => enviados.length, { timeout: 20_000 }).toBe(3);
  expect(enviados[2]).toMatch(/^mant_/);
  expect(enviados[2]).not.toBe(enviados[0]);
});
