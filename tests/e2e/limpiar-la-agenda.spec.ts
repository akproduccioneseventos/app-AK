import { expect, test } from '@playwright/test';
import { crearCookieDeSesion } from './helpers/fiesta-de-prueba';

/**
 * El boton para dejar la agenda limpia esta y hace algo.
 *
 * Paso de verdad: al sincronizar, la app duplico eventos y dejo fechas viejas en
 * el calendario personal del dueno. Las causas se arreglaron, y esta pantalla es
 * la que limpia lo que quedo sucio.
 *
 * Esto comprueba el RESULTADO en pantalla: que la tarjeta este, que diga lo que
 * hace, y que al tocarla **conteste algo** —o la revision, o el aviso en criollo
 * de que la cuenta de Google no esta conectada—. Lo que no puede pasar es que se
 * toque y no pase nada, que es como estuvieron los ajustes de las estaciones.
 *
 * La pantalla que prueba este archivo es `/settings/sincronizaciones`.
 */

test('la pantalla de sincronizaciones ofrece limpiar la agenda y contesta al tocarla', async ({ context, page }, testInfo) => {
  test.setTimeout(180_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

  const baseURL = testInfo.project.use.baseURL as string;
  await context.addCookies([
    { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
  ]);

  const erroresJs: string[] = [];
  page.on('pageerror', (e) => erroresJs.push(e.message));

  const respuesta = await page.goto('/settings/sincronizaciones', { waitUntil: 'domcontentloaded' });
  expect(respuesta?.status(), 'la pantalla abre').toBeLessThan(400);
  await page.waitForTimeout(5_000);

  // 1. La tarjeta esta y se entiende de que se trata.
  const tarjeta = page.locator('[data-testid="limpiar-agenda"]');
  await expect(tarjeta, 'la tarjeta para revisar la agenda esta').toBeVisible({ timeout: 20_000 });
  await expect(tarjeta, 'avisa que no toca los eventos personales').toContainText(/personales no se tocan/i);

  // 2. Al tocarla contesta ALGO. Que se toque y no pase nada es la falla que se
  //    quiere evitar; sin cuenta de Google conectada, lo correcto es el aviso.
  const boton = tarjeta.getByRole('button', { name: /revisar mi agenda/i });
  await expect(boton, 'esta el boton para revisar').toBeVisible();
  await boton.click();

  const contesto = page.locator('body');
  await expect(contesto, 'la app contesta con el resultado o con el motivo').toContainText(
    /agenda est[aá] limpia|sobran \d+|no se pudo mirar la agenda|no est[aá] conectada/i,
    { timeout: 45_000 },
  );

  // 3. Nada de basura tecnica delante de quien la usa.
  const texto = ((await page.locator('body').innerText().catch(() => '')) || '').replace(/\s+/g, ' ');
  expect(texto, 'no muestra texto tecnico').not.toMatch(/undefined|\[object Object\]|is not a valid/i);
  expect(erroresJs.join('\n'), 'la pantalla no se rompe por dentro').toBe('');
});
