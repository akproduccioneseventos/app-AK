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
 * Se entregó un arreglo. Lo que no sirve para saber si anda es la prueba que vino
 * con él: **creaba ella misma el valor que después comprobaba**, así que pasaba
 * con la app rota o sana. Esta mira otra cosa: abre la pantalla y comprueba que
 * **haya un dibujo**, y que **no** esté el cartel de "no se pudo dibujar".
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

  // 2. Y lo que faltaba: que el dibujo aparezca de verdad.
  const hayDibujo = await page.locator('canvas').count();
  expect(hayDibujo, 'hay un dibujo del salon en pantalla').toBeGreaterThan(0);

  expect(texto, 'no aparece el aviso de que el dibujo fallo').not.toMatch(
    /El sal[oó]n en 3D no se pudo dibujar/i,
  );

  // 3. Y que no se rompa por dentro con el error que lo tiraba abajo.
  expect(
    erroresJs.join('\n'),
    'la pantalla no se rompe por dentro',
  ).not.toMatch(/ReactCurrentBatchConfig/);
});
