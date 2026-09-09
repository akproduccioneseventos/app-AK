import { test, expect } from '@playwright/test';
import { crearCookieDeSesion } from './helpers/fiesta-de-prueba';

/**
 * Orden 49 - CON-04: el flujo de caja no muestra ceros falsos.
 *
 * **Lo que se comprueba es el resultado, no que la pantalla abra.** La falla que
 * hubo era esta: cuando no se podian leer los datos, la pantalla mostraba seis meses
 * en cero, que se ve **igual** que "no entro plata". Asi que lo que se exige es que
 * nunca convivan un aviso de error y una tabla de numeros: o hay numeros, o hay aviso.
 *
 * CON-05 -que las facturas pidan el permiso de contabilidad- **no se puede comprobar
 * honestamente en el navegador**: la cookie de prueba entra como dueno, que tiene
 * todos los permisos. Se comprueba sin navegador, en
 * `src/__tests__/la-contabilidad-no-miente.test.ts`. Escribir aca una version de
 * mentira seria peor que no tenerla.
 */
test.describe('Orden 49: el flujo de caja no miente', () => {
  test('CON-04: o muestra numeros, o avisa; nunca ceros con un error', async ({ page, context }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    await page.goto('/empresa/contabilidad/flujo-caja', { waitUntil: 'domcontentloaded' });

    const avisoDeError = page.getByText('No se pudo calcular el flujo de caja');
    const titulo = page.getByRole('heading', { level: 1 }).first();
    await expect(titulo).toBeVisible({ timeout: 30_000 });

    if (await avisoDeError.isVisible()) {
      // Si avisa que no pudo, NO puede haber numeros de plata en pantalla.
      const texto = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
      expect(texto).not.toMatch(/\$\s?0\b/);
      return;
    }

    // Si no avisa, tiene que haber traido la proyeccion de verdad.
    await expect(page.getByText(/Ingresos|Egresos|Balance/i).first()).toBeVisible({ timeout: 20_000 });
  });
});
