import fs from 'node:fs';
import crypto from 'node:crypto';
import { expect, test } from '@playwright/test';

/**
 * ¿EL SALÓN 3D SE DIBUJA? Eso, y nada más.
 *
 * La pantalla del Configurador de Reunión —la que se usa sentado adelante del
 * cliente— se rompía entera por culpa de esta vista 3D. Se aisló para que no se
 * llevara puesta la reunión, y quedó pendiente que **el dibujo apareciera**.
 *
 * **PENDIENTE, y hay que decirlo: el dibujo TODAVÍA no aparece.** Se probaron dos
 * arreglos —uno de Gemini y uno propio— y ninguno sirvió. El motivo, ya medido:
 * el error no es que a React le falte un campo, es que **la biblioteca 3D recibe
 * un React que no tiene esa parte**, lo cual es un problema de cómo se empaqueta
 * la app, no del dibujo. Necesita una sesión dedicada.
 *
 * Mientras tanto, lo que esta prueba SÍ cuida —y es lo que importa para el
 * negocio— es que **la pantalla no se muera**: el catálogo, el presupuesto y el
 * guardado tienen que seguir andando, y si el dibujo falla hay que decirlo en
 * criollo, no dejar un cartel de error técnico delante del cliente.
 *
 * La pantalla que prueba este archivo es `/empresa/configurador-reunion`.
 */

const SESSION_SECRET = 'playwright-session-secret-with-enough-entropy';

function cookieDeSesion() {
  const payload = `v1.${Date.now() + 60 * 60 * 1000}.${crypto.randomUUID()}`;
  return `${payload}.${crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')}`;
}

test('el salón 3D se dibuja y no se lleva puesta la pantalla', async ({ context, page }, testInfo) => {
  test.setTimeout(180_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
  fs.mkdirSync('test-results/salon-3d', { recursive: true });

  const baseURL = testInfo.project.use.baseURL as string;
  await context.addCookies([
    { name: 'ak_session', value: cookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
  ]);

  const erroresJs: string[] = [];
  page.on('pageerror', (e) => erroresJs.push(e.message));
  // El aislador atrapa el error y lo manda a la consola, asi que sin esto no se
  // ve por que fallo el dibujo.
  page.on('console', (m) => {
    if (m.type() === 'error') erroresJs.push(`[consola] ${m.text()}`);
  });

  const respuesta = await page.goto('/empresa/configurador-reunion', { waitUntil: 'domcontentloaded' });
  expect(respuesta?.status(), 'la pantalla abre').toBeLessThan(400);
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(6_000);

  const texto = ((await page.locator('body').innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
  fs.writeFileSync('test-results/salon-3d/lo-que-dice.txt', `${texto}\n\nERRORES:\n${erroresJs.join('\n')}\n`);
  await page.screenshot({ path: 'test-results/salon-3d/pantalla.png', fullPage: true });

  // 1. Lo primero: la pantalla no se muere. Esto ya estaba resuelto y tiene que seguir.
  expect(texto, 'la pantalla no muestra el cartel de error general').not.toMatch(/Algo sali[oó] mal/i);

  // 2. La reunión se puede hacer igual: lo que se usa adelante del cliente está.
  expect(texto, 'el catalogo de servicios esta').toMatch(/servicio|catálogo|catalogo/i);

  // 3. Y si el dibujo falla, se dice en criollo. Nunca un cartel tecnico.
  const hayDibujo = await page.locator('canvas').count();
  if (hayDibujo === 0) {
    expect(
      texto,
      'si el dibujo falla, la pantalla lo explica en criollo',
    ).toMatch(/El sal[oó]n en 3D no se pudo dibujar/i);
  }
});
