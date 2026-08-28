import { expect, test } from '@playwright/test';
import { borrarFiesta, crearCookieDeSesion, crearFiestaDeEstaNoche } from './helpers/fiesta-de-prueba';

/**
 * La puerta de los entretenimientos, sin clave y con archivo para el empleado.
 *
 * **La pantalla que prueba este archivo es `/evento/inicio`.**
 *
 * Es lo que pidió el dueño con estas palabras: *"iconos de cada entretenimiento,
 * entrás, se pone a qué fiesta pertenece, se configura y se trabaja sin ningún
 * otro acceso"*, *"o mejor sacale el PIN y ta, así no complica"* y *"archivos
 * descargables o algo así"*.
 *
 * Por eso esto no comprueba que la pantalla "abra": comprueba las tres cosas que
 * él pidió, que son las que se pueden romper sin que nadie lo note.
 */

const fiesta = crearFiestaDeEstaNoche({ id: `e2e_inicio_${Date.now()}` });
const ID = fiesta.id;

test.afterAll(() => {
  borrarFiesta(ID);
});

test.describe('la puerta de los entretenimientos', () => {
  test.beforeEach(async ({ context }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);
  });

  test('están los once entretenimientos y NO se pide ninguna clave', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto('/evento/inicio', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    // Los iconos, uno por uno: si mañana alguien saca uno, esto lo canta.
    for (const estacion of [
      'Fotocabina',
      'Plataforma 360',
      'Espejo Mágico',
      'Touchpix AI',
      'Buzón Saludos',
      'Tótem LED',
      'Muro Social',
      'Barra de Tragos',
      'Video de Vida',
      'Estación Impresión',
      'Pedidos al DJ',
    ]) {
      await expect(page.getByText(estacion, { exact: false }).first(), `falta ${estacion}`).toBeVisible();
    }

    // Lo que el dueño mandó sacar: nada de PIN, ni el campo ni el texto.
    const texto = ((await page.locator('body').innerText().catch(() => '')) || '').toLowerCase();
    expect(texto, 'no debe pedir PIN').not.toContain('pin');
    expect(await page.locator('input[type="password"]').count(), 'no debe haber campo de clave').toBe(0);
  });

  test('el acceso directo se baja de verdad y apunta a la estación elegida', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto('/evento/inicio', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    // Elegir la fiesta de prueba, que es la que se acaba de crear.
    const selector = page.locator('select').first();
    if (await selector.count()) {
      await selector.selectOption(ID).catch(() => {});
    }

    const esperandoArchivo = page.waitForEvent('download', { timeout: 20_000 });
    await page.getByRole('button', { name: /bajar acceso directo/i }).click();
    const archivo = await esperandoArchivo;

    // El nombre tiene que decirle al dueño qué es, sin abrirlo.
    expect(archivo.suggestedFilename(), 'el archivo se llama por la estacion').toMatch(/Fotocabina.*\.url$/i);

    // Y adentro tiene que estar la direccion de ESA estacion, no una generica.
    const ruta = await archivo.path();
    const contenido = ruta ? (await import('node:fs')).readFileSync(ruta, 'utf8') : '';
    expect(contenido, 'el archivo lleva a la fotocabina').toContain('/evento/fotocabina/');
  });
});
