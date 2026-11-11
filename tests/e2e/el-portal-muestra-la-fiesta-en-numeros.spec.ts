import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';
import { createPortalSession } from '../../src/lib/security/portal-session';

/**
 * Orden 270 (Bloque 5): Tu fiesta en números en el portal del cliente.
 *
 * La tarjeta solo debe renderizarse cuando el evento ya pasó (isEventPast === true).
 * En eventos futuros, no debe aparecer.
 */
const fiestaPasadaId = `e2e_fiesta_pasada_${Date.now()}`;
const fiestaFuturaId = `e2e_fiesta_futura_${Date.now()}`;
const clavePortal = 'clave-portal-orden-270';

test.use({ timezoneId: 'America/Montevideo' });

test.describe('Orden 270: Tu fiesta en números en el portal del cliente', () => {
  test.beforeAll(() => {
    const pasada = crearFiestaDeEstaNoche({ id: fiestaPasadaId, clavePortal, fechaEvento: '2025-01-10' });
    pasada.configuracion.nombreEvento = 'Fiesta E2E Pasada';
    guardarFiesta(pasada);

    const futura = crearFiestaDeEstaNoche({ id: fiestaFuturaId, clavePortal, fechaEvento: '2028-11-20' });
    futura.configuracion.nombreEvento = 'Fiesta E2E Futura';
    guardarFiesta(futura);
  });

  test.afterAll(() => {
    borrarFiesta(fiestaPasadaId);
    borrarFiesta(fiestaFuturaId);
  });

  async function entrar(
    page: import('@playwright/test').Page,
    context: import('@playwright/test').BrowserContext,
    baseURL: string,
    fiestaId: string,
  ) {
    await context.addCookies([
      {
        name: 'ak_portal_session',
        value: createPortalSession(fiestaId, clavePortal),
        url: baseURL,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    await page.addInitScript(
      ({ fid, key }) => {
        window.sessionStorage.setItem(`portal_auth_${fid}`, key);
      },
      { fid: fiestaId, key: clavePortal },
    );
    await page.goto(`/portal-cliente/${fiestaId}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('necesito-ayuda-btn')).toBeVisible({ timeout: 30_000 });
  }

  test('en fiesta pasada muestra la tarjeta Tu fiesta en números', async ({ page, context }, testInfo) => {
    await entrar(page, context, testInfo.project.use.baseURL as string, fiestaPasadaId);
    const tarjeta = page.getByTestId('tarjeta-fiesta-en-numeros');
    await expect(tarjeta).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Tu fiesta en números')).toBeVisible();
  });

  test('en fiesta futura no muestra la tarjeta Tu fiesta en números', async ({ page, context }, testInfo) => {
    await entrar(page, context, testInfo.project.use.baseURL as string, fiestaFuturaId);
    const tarjeta = page.getByTestId('tarjeta-fiesta-en-numeros');
    await expect(tarjeta).toHaveCount(0);
    await expect(page.getByText('Tu fiesta en números')).toHaveCount(0);
  });
});
