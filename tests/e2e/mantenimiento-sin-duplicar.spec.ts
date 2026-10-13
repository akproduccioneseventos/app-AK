import { expect, test } from '@playwright/test';
import { borrarActivoDePrueba, ponerSesionDelEquipo, sembrarActivoDePrueba } from './helpers/fiesta-de-prueba';

/**
 * Anotar un mantenimiento cuando se pierde la confirmacion (orden 159, 12/10/2026).
 *
 * La accion real se ejecuta en el servidor y se lee su respuesta; despues se corta SOLO la
 * respuesta al navegador, como si se hubiera caido la senal. La persona vuelve a tocar
 * "Anotar mantenimiento" con el mismo borrador. Tiene que quedar UNA sola fila en el historial
 * del equipo (y por lo tanto un solo gasto). Un trabajo distinto con el mismo texto, escrito
 * despues de confirmar, tiene que quedar como segunda fila.
 *
 * Esto NO esta corrido todavia: lo corre la puerta.
 *
 * Las pantallas que prueba este archivo son:
 *   /empresa/activos-fijos/e2e_mant_equipo/editar
 */

const ID = 'e2e_mant_equipo';
const RUTA = `/empresa/activos-fijos/${ID}/editar`;

test.beforeAll(() => sembrarActivoDePrueba({ id: ID, nombre: 'Parlante de prueba mantenimiento', cantidadDisponible: 1 }));
test.afterAll(() => borrarActivoDePrueba(ID));

test('perder la respuesta y reintentar deja una sola fila; otro trabajo igual deja dos', async ({ context, page }, testInfo) => {
  test.setTimeout(180_000);
  await ponerSesionDelEquipo(context, testInfo.project.use.baseURL as string | undefined);

  let respuestasCortadas = 0;
  await page.route('**/empresa/activos-fijos/**', async (route) => {
    const req = route.request();
    if (req.method() === 'POST' && respuestasCortadas === 0 && req.headers()['next-action']) {
      await route.fetch(); // el servidor ejecuta de verdad y termina
      respuestasCortadas += 1;
      await route.abort('failed'); // pero la respuesta nunca llega a la pantalla
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

  // Mismo borrador, otro toque.
  await page.getByRole('button', { name: /^Anotar mantenimiento$/i }).click();
  await expect(page.getByText('Mantenimiento registrado').first()).toBeVisible({ timeout: 20_000 });

  await page.reload();
  await expect(page.getByText('Cambio de lampara')).toHaveCount(1);

  // Otro trabajo deliberado con el mismo texto: dos filas.
  await page.getByRole('button', { name: /Anotar un mantenimiento/i }).click();
  await page.locator('#maint-nota').fill('Cambio de lampara');
  await page.locator('#maint-costo').fill('123.45');
  await page.getByRole('button', { name: /^Anotar mantenimiento$/i }).click();
  await expect(page.getByText('Mantenimiento registrado').first()).toBeVisible({ timeout: 20_000 });
  await page.reload();
  await expect(page.getByText('Cambio de lampara')).toHaveCount(2);
});
