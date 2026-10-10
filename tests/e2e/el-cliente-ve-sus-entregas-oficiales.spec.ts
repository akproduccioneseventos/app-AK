import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, leerFiesta } from './helpers/fiesta-de-prueba';
import { createPortalSession } from '../../src/lib/security/portal-session';

/**
 * Codex, auditoría 86 (orden 136): el cliente tenía su álbum "Entregado completo", con enlace, y
 * el portal le decía "aún no hay servicios de fotografía o filmación". Al portal le llegaban sólo
 * las notas generales.
 *
 * Probado rompiéndolo: sin los servicios en el armado del portal, el nombre de la entrega no aparece.
 */
const fiestaId = `e2e_entrega_oficial_${Date.now()}`;
const clavePortal = 'clave-portal-entrega-86';
const enlace = 'https://drive.example.com/album-oficial-86';

test.describe('El cliente ve sus entregas oficiales', () => {
  test.beforeAll(() => {
    const fiesta: any = crearFiestaDeEstaNoche({ id: fiestaId, clavePortal });
    fiesta.configuracion.nombreEvento = 'Fiesta E2E Entrega 86';
    fiesta.modulosContratados = { ...fiesta.modulosContratados, fotografia: true, filmacion: true };
    fiesta.fotografiaYFilmacion = {
      servicios: [{ id: 'entrega-86', nombre: 'Album oficial 86', estado: 'Entregado completo', linkEntrega: enlace }],
      notasGenerales: 'Entrega de prueba',
    };
    guardarFiesta(fiesta);
  });
  test.afterAll(() => borrarFiesta(fiestaId));

  test('la entrega aparece con su enlace, sigue al recargar y otra clave no la ve', async ({ page, context, browser }, testInfo) => {
    test.setTimeout(120_000);
    const baseURL = testInfo.project.use.baseURL as string;
    const antes = leerFiesta(fiestaId).fotografiaYFilmacion;
    await context.addCookies([
      { name: 'ak_portal_session', value: createPortalSession(fiestaId, clavePortal), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);
    await page.addInitScript(({ fid, key }) => window.sessionStorage.setItem(`portal_auth_${fid}`, key), { fid: fiestaId, key: clavePortal });

    await page.goto(`/portal-cliente/${fiestaId}/fotos-video`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Album oficial 86', { exact: true })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole('link', { name: /Descargar archivos oficiales/i })).toHaveAttribute('href', enlace);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Album oficial 86', { exact: true })).toBeVisible({ timeout: 30_000 });

    const ajeno = await browser.newContext();
    try {
      await ajeno.addCookies([
        { name: 'ak_portal_session', value: createPortalSession(`${fiestaId}_otra`, clavePortal), url: baseURL, httpOnly: true, sameSite: 'Lax' },
      ]);
      const mala = await ajeno.newPage();
      await mala.addInitScript(({ fid }) => window.sessionStorage.setItem(`portal_auth_${fid}`, 'clave-equivocada'), { fid: fiestaId });
      await mala.goto(`/portal-cliente/${fiestaId}/fotos-video`, { waitUntil: 'domcontentloaded' });
      await mala.waitForTimeout(3_000);
      await expect(mala.getByText('Album oficial 86', { exact: true })).toHaveCount(0);
      await expect(mala.getByRole('link', { name: /Descargar archivos oficiales/i })).toHaveCount(0);
    } finally {
      await ajeno.close();
    }
    expect(leerFiesta(fiestaId).fotografiaYFilmacion).toEqual(antes);
  });
});
