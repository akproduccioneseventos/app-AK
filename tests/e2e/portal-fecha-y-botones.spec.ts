import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';
import { createPortalSession } from '../../src/lib/security/portal-session';

/**
 * Orden 119 (Codex, auditoría 69): el portal del cliente el día de la fiesta.
 *
 * - PORTAL01: con el navegador en hora de Uruguay, la fiesta de HOY aparecía como "Evento
 *   Concluido", porque la fecha se leía como medianoche de Greenwich (el día anterior a las 21).
 * - PORTAL02: el botón del asistente quedaba debajo del de WhatsApp ("Necesito ayuda").
 *
 * Se probó rompiéndola: con el cálculo viejo de la fecha y el botón en su lugar viejo, las dos
 * dan rojo.
 */
const fiestaId = `e2e_portal_hoy_${Date.now()}`;
const clavePortal = 'clave-portal-orden-119';

test.use({ timezoneId: 'America/Montevideo' });

test.describe('Orden 119: el portal el día de la fiesta', () => {
  test.beforeAll(() => {
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId, clavePortal });
    fiesta.configuracion.nombreEvento = 'Fiesta E2E Portal Hoy';
    guardarFiesta(fiesta);
  });
  test.afterAll(() => borrarFiesta(fiestaId));

  async function entrar(page: import('@playwright/test').Page, context: import('@playwright/test').BrowserContext, baseURL: string) {
    await context.addCookies([
      { name: 'ak_portal_session', value: createPortalSession(fiestaId, clavePortal), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);
    await page.addInitScript(({ fid, key }) => {
      window.sessionStorage.setItem(`portal_auth_${fid}`, key);
    }, { fid: fiestaId, key: clavePortal });
    await page.goto(`/portal-cliente/${fiestaId}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('necesito-ayuda-btn')).toBeVisible({ timeout: 30_000 });
  }

  test('la fiesta de hoy no aparece como concluida', async ({ page, context }, testInfo) => {
    await entrar(page, context, testInfo.project.use.baseURL as string);
    await expect(page.getByText('Llegadas en Vivo')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Evento Concluido/i)).toHaveCount(0);
    await expect(page.getByText('Resumen de Asistencia')).toHaveCount(0);
  });

  for (const ancho of [360, 660, 1280]) {
    test(`a ${ancho}px el asistente y WhatsApp no se tapan`, async ({ page, context }, testInfo) => {
      await page.setViewportSize({ width: ancho, height: 800 });
      await entrar(page, context, testInfo.project.use.baseURL as string);
      const asistente = page.getByRole('button', { name: 'Abrir asistente de la fiesta' });
      await expect(asistente).toBeVisible({ timeout: 20_000 });
      const a = (await asistente.boundingBox())!;
      const w = (await page.getByTestId('necesito-ayuda-btn').boundingBox())!;
      const anchoComun = Math.min(a.x + a.width, w.x + w.width) - Math.max(a.x, w.x);
      const altoComun = Math.min(a.y + a.height, w.y + w.height) - Math.max(a.y, w.y);
      expect(anchoComun > 0 && altoComun > 0, `se superponen ${anchoComun}x${altoComun}px`).toBe(false);
      // Y los dos se pueden tocar: el asistente abre su ventana.
      await asistente.click();
      await expect(page.getByRole('button', { name: 'Abrir asistente de la fiesta' })).toHaveCount(0);
    });
  }
});
