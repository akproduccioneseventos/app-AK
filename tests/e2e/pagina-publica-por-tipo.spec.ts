import { expect, test } from '@playwright/test';

/**
 * Las páginas públicas por tipo de evento, que son las que vende.
 *
 * Son las que ve el que llega desde Google buscando "fiesta de 15 en Salto".
 * El control "Lo que se dijo es lo que es" las marcó: **nadie había comprobado
 * nunca que funcionaran**. Si se rompían, se enteraba el cliente.
 *
 * La pantalla que prueba este archivo es `/public/[eventType]`.
 *
 * Lo que se mira es el resultado, no que la página abra: que tenga contenido de
 * verdad, que no muestre basura técnica ni precios rotos, que se pueda llegar a
 * hablar con AK, y que un tipo de evento inventado **no invente una página**.
 */

/** Los seis tipos que la app publica hoy. Si se agrega uno, va acá. */
const TIPOS = ['bodas', 'xv-anos', 'fiestas', 'cumpleanos', 'corporativos', 'aniversarios'];

test('cada página de tipo de evento muestra su propuesta y deja hablar con AK', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

  const problemas: string[] = [];

  for (const tipo of TIPOS) {
    const respuesta = await page.goto(`/public/${tipo}`, { waitUntil: 'domcontentloaded' });
    if ((respuesta?.status() ?? 0) >= 400) {
      problemas.push(`${tipo}: la página contesta con error ${respuesta?.status()}`);
      continue;
    }
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const texto = ((await page.locator('body').innerText().catch(() => '')) || '')
      .replace(/\s+/g, ' ')
      .trim();

    // 1. Tiene que decir algo. Una página de venta vacía es peor que no tenerla.
    if (texto.length < 400) {
      problemas.push(`${tipo}: la página está casi vacía (${texto.length} caracteres)`);
    }

    // 2. Nada de basura técnica ni plata rota delante de un prospecto.
    if (/undefined|NaN|\[object Object\]/.test(texto)) {
      problemas.push(`${tipo}: muestra texto técnico o un precio roto`);
    }

    // 3. Y tiene que haber por dónde contactarse: si no, no vende.
    const contacto = await page.locator('a[href*="wa.me"], a[href^="tel:"], a[href*="simulador"]').count();
    if (contacto === 0) {
      problemas.push(`${tipo}: no hay ninguna forma de contactarse ni de pedir presupuesto`);
    }
  }

  expect(problemas.join('\n'), problemas.join('\n')).toBe('');
});

test('un tipo de evento que no existe no inventa una página', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

  const respuesta = await page.goto('/public/fiesta-que-no-existe', { waitUntil: 'domcontentloaded' });
  expect(respuesta?.status(), 'un tipo inventado no devuelve una página como si existiera').toBe(404);
});
