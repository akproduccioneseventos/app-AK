import { test, expect } from '@playwright/test';
import { crearCookieDeSesion } from './helpers/fiesta-de-prueba';

test.describe('Orden 263: pantalla /entrar (¿Quién sos?)', () => {
  const viewports = [
    { name: 'celular (390)', width: 390, height: 844 },
    { name: 'computadora (1280)', width: 1280, height: 800 },
  ];

  for (const vp of viewports) {
    test(`sin sesión, muestra los cinco botones en viewport ${vp.name}`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/entrar', { waitUntil: 'domcontentloaded' });

      const btnCliente = page.getByTestId('btn-soy-cliente').or(page.getByText('Soy cliente de AK', { exact: false })).first();
      const btnInvitado = page.getByTestId('btn-soy-invitado').or(page.getByText('Soy invitado a una fiesta', { exact: false })).first();
      const btnEquipo = page.getByTestId('btn-soy-del-equipo').or(page.getByText('Soy del equipo', { exact: false })).first();
      const btnProveedor = page.getByTestId('btn-soy-proveedor').or(page.getByText('Soy proveedor', { exact: false })).first();
      const btnOrganizar = page.getByTestId('btn-quiero-organizar').or(page.getByText('Quiero organizar mi fiesta', { exact: false })).first();

      await expect(btnCliente).toBeVisible({ timeout: 20_000 });
      await expect(btnInvitado).toBeVisible();
      await expect(btnEquipo).toBeVisible();
      await expect(btnProveedor).toBeVisible();
      await expect(btnOrganizar).toBeVisible();

      await expect(page.getByText('¿Sos del personal y te mandaron un enlace?', { exact: false })).toBeVisible();
    });
  }

  test('"Soy del equipo" lleva a /login', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/entrar', { waitUntil: 'domcontentloaded' });

    const btnEquipo = page.getByTestId('btn-soy-del-equipo').or(page.getByText('Soy del equipo', { exact: false })).first();
    await expect(btnEquipo).toBeVisible({ timeout: 20_000 });
    await btnEquipo.click();

    await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 20_000 });
    expect(page.url()).toContain('/login');
  });

  test('con cookie de sesión del equipo, /entrar va directo al panel (y el panel existe)', async ({ page, context }, testInfo) => {
    test.setTimeout(60_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    await page.goto('/entrar', { waitUntil: 'domcontentloaded' });

    // Antes esperaba /dashboard, que no existe: la prueba pasaba con la pantalla de "Esta página no existe" (auditor, 12/11/2026).
    await page.waitForURL((url) => url.pathname.startsWith('/admin'), { timeout: 20_000 });
    await expect(page.getByText(/esta p[aá]gina no existe/i)).toHaveCount(0);
  });
});
