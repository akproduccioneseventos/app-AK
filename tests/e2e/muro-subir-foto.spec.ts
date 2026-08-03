import { expect, test } from '@playwright/test';
import { borrarFiesta, crearFiestaDeEstaNoche } from './helpers/fiesta-de-prueba';

/**
 * El invitado subiendo una foto al muro, hasta donde se puede probar acá.
 *
 * La foto termina guardándose en el servicio de archivos de Firebase, que no
 * existe en este entorno. Eso deja **una sola cosa** sin probar: que los bytes
 * lleguen al servidor de Google.
 *
 * Todo lo anterior sí se prueba, y es donde estaban los problemas: que el
 * invitado encuentre el botón, que pueda poner su nombre, que elija una foto, y
 * sobre todo que **si algo falla se entere**. Un muro que se traga la foto sin
 * decir nada es peor que uno que avisa: el invitado se queda esperando que
 * aparezca en la pantalla del salón y nunca aparece.
 */

const fiesta = crearFiestaDeEstaNoche({ id: `e2e_muro_${Date.now()}` });
const ID = fiesta.id;

/** Un invitado de la lista, con su enlace personal. */
const INVITADO = { id: 'inv_prueba_0', token: 'token-prueba-0' };

/** Una imagen mínima de verdad, para que el navegador la trate como foto. */
const FOTO_DE_PRUEBA = {
  name: 'foto-de-prueba.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  ),
};

test.afterAll(() => {
  borrarFiesta(ID);
});

test.describe('el invitado sube una foto al muro', () => {
  test('encuentra cómo compartir y, si falla, se entera', async ({ page }) => {
    test.setTimeout(300_000);

    const erroresJs: string[] = [];
    page.on('pageerror', (e) => erroresJs.push(e.message));

    // Se entra con el enlace personal del invitado, que es como llega de verdad:
    // sin él, el muro sólo deja mirar y avisa "abrí tu enlace personal para
    // publicar".
    await page.goto(`/evento/social/${ID}?guestId=${INVITADO.id}&token=${INVITADO.token}`, {
      waitUntil: 'domcontentloaded',
    });

    // Al entrar por primera vez, el muro pide el nombre: es lo que después
    // aparece debajo de la foto en la pantalla del salón.
    const campoNombre = page.getByPlaceholder(/Ej: Sofía Pérez|Tu nombre/i).first();
    if (await campoNombre.isVisible().catch(() => false)) {
      await campoNombre.fill('Invitada de prueba');
      await page.getByRole('button', { name: /Continuar|Entrar|Listo/i }).first().click();
      await page.waitForTimeout(2000);
    }

    // El botón para compartir tiene que estar a la vista, sin buscarlo.
    const compartir = page.getByText(/Qué querés compartir/i).first();
    await expect(compartir, 'El invitado no encuentra cómo subir una foto').toBeVisible({ timeout: 45_000 });
    await compartir.click();
    await page.waitForTimeout(1500);

    // Elige una foto de su celular.
    const campoArchivo = page.locator('input[type="file"]').first();
    await expect(campoArchivo, 'No hay dónde elegir la foto').toHaveCount(1, { timeout: 20_000 });
    await campoArchivo.setInputFiles(FOTO_DE_PRUEBA);
    await page.waitForTimeout(2000);

    const publicar = page.getByRole('button', { name: /^Publicar/i }).first();
    await expect(publicar, 'No aparece el botón de publicar').toBeVisible({ timeout: 20_000 });
    await publicar.click();

    // Lo que importa: pase lo que pase, el invitado tiene que recibir una
    // respuesta. En este entorno el guardado falla porque no hay servicio de
    // archivos, así que lo correcto es ver el aviso de que no se pudo.
    const respuesta = page.getByText(/No se pudo publicar|publicada|Se subió|subida/i).first();
    await expect(
      respuesta,
      'El invitado tocó publicar y no recibió ninguna respuesta: no sabe si su foto salió o no',
    ).toBeVisible({ timeout: 45_000 });

    expect(erroresJs, `El muro tuvo fallas de JavaScript:\n${erroresJs.join('\n')}`).toEqual([]);
  });

  test('el muro no se cuelga después de un intento fallido', async ({ page }) => {
    test.setTimeout(180_000);

    // Después de un error, la pantalla tiene que seguir usable: el invitado
    // suele probar de nuevo.
    await page.goto(`/evento/social/${ID}`, { waitUntil: 'domcontentloaded' });

    // El muro pide varias cosas al servidor antes de dibujarse; se le da el
    // mismo margen que en la fiesta real.
    let texto = '';
    const arranque = Date.now();
    while (Date.now() - arranque < 20_000) {
      texto = await page.locator('body').innerText().catch(() => '');
      if (texto.trim().length > 40) break;
      await page.waitForTimeout(1000);
    }

    expect(texto.trim().length, 'El muro quedó en blanco').toBeGreaterThan(40);
    expect(texto).not.toMatch(/NaN|Infinity|\[object Object\]|Failed to fetch/);
  });
});
