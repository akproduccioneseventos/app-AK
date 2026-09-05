import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';
import { createPortalSession } from '../../src/lib/security/portal-session';

/**
 * Orden 43 Bloque 3: Que el cliente pueda escribirle al equipo desde su portal.
 *
 * El cliente escribe un mensaje y lo ve en el hilo al recargar la pantalla.
 */

const fiestaId = `e2e_msg_${Date.now()}`;
const clavePortal = 'clave-secreta-cliente-43';

test.describe('Orden 43: El cliente le escribe al equipo', () => {
  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId, clavePortal });
    fiesta.configuracion.nombreEvento = 'Fiesta E2E Mensajes Cliente';
    guardarFiesta(fiesta);
  });

  test.afterAll(async () => {
    borrarFiesta(fiestaId);
  });

  test('el cliente escribe un mensaje y lo ve en el hilo al recargar la pantalla', async ({ page, context }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL as string;

    // Cookie de sesión de portal válida
    const sessionCookie = createPortalSession(fiestaId, clavePortal);
    await context.addCookies([
      { name: 'ak_portal_session', value: sessionCookie, url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    // También guardamos la clave en sessionStorage para que coincida con la navegación del portal
    await page.addInitScript(({ fid, key }) => {
      window.sessionStorage.setItem(`portal_auth_${fid}`, key);
    }, { fid: fiestaId, key: clavePortal });

    // Ingresar directamente a la pantalla de mensajes
    await page.goto(`/portal-cliente/${fiestaId}/mensajes`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Mensajes con el Equipo/i })).toBeVisible({ timeout: 20_000 });

    const textoMensaje = `Hola equipo de AK, queremos consultar si podemos adelantar el vals 15 minutos (prueba ${Date.now()})`;

    // Escribir y enviar el mensaje
    const input = page.locator('[data-testid="mensaje-input"]');
    await input.fill(textoMensaje);

    const btnEnviar = page.locator('[data-testid="enviar-mensaje-btn"]');
    await expect(btnEnviar).toBeEnabled();
    await btnEnviar.click();

    // Comprobación 1: Se visualiza en el hilo tras enviarlo
    await expect(page.getByText(textoMensaje)).toBeVisible({ timeout: 10_000 });

    // Comprobación 2: Al recargar la pantalla, el mensaje sigue visible en el hilo
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Mensajes con el Equipo/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(textoMensaje)).toBeVisible({ timeout: 10_000 });
  });
});
