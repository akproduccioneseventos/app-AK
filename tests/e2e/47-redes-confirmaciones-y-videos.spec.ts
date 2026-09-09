import { test, expect } from '@playwright/test';
import { crearCookieDeSesion } from './helpers/fiesta-de-prueba';

/**
 * Orden 47 - ADS-01: el panel de publicidad no inventa plata.
 *
 * **La version anterior no comprobaba nada**: pedia que la cantidad de botones fuera
 * "mayor o igual que cero" y que la cantidad de videos tambien, que es siempre. Daba
 * verde con la pantalla vacia.
 *
 * Lo que se exige ahora es lo que le importa al dueno: que el panel del tope **abra y
 * diga la verdad**. Si no pudo verificar el presupuesto en Meta, tiene que decirlo; lo
 * que no puede es mostrar un numero inventado como si fuera real.
 *
 * El calculo en si -que sin dato verificado no se asuma saldo libre, y que encender una
 * campana se niegue siempre- se comprueba sin navegador, en
 * `src/__tests__/el-tope-de-publicidad-no-inventa-plata.test.ts`.
 */
test.describe('Orden 47: el panel de publicidad dice la verdad', () => {
  test('ADS-01: el tope se muestra, y si no esta verificado lo avisa', async ({ page, context }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    await page.goto('/contabilidad/crm/marketing-ads', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Tope Mensual Configurado')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Comprometido en el Mes')).toBeVisible();

    const texto = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    // El $500 inventado que habia antes no puede volver disfrazado de dato real.
    expect(texto).not.toMatch(/Application error|undefined|\[object Object\]/);

    // O el compromiso esta verificado, o la pantalla lo dice. Las dos cosas a la vez, no.
    const avisaPendiente = texto.includes('pendiente de verificación');
    const dicePorCampanas = /Por campañas activas en los/.test(texto);
    expect(avisaPendiente || dicePorCampanas).toBe(true);
    expect(avisaPendiente && dicePorCampanas).toBe(false);
  });
});
