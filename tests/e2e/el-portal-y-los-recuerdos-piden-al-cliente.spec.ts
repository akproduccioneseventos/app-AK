/**
 * Orden 303 (Bloques 1, 2 y 4):
 * - Bloque 1: Sin sesión, /portal/<id>/decoracion y /portal/<id>/moodboard no muestran la propuesta y redirigen a /portal?fiestaId=...
 * - Bloque 2: Con sesión del portal, el cliente abre /post-fiesta/<id> sin ver el texto interno de Google Drive / Wfolio.
 * - Bloque 4: El catálogo no dice "Cliente 1" y llega hasta la última diapositiva de cierre.
 */
import { expect, test } from '@playwright/test';
import { crearFiestaDeEstaNoche, borrarFiesta } from './helpers/fiesta-de-prueba';

test.describe('Orden 303: Portal, recuerdos del cliente y catálogo', () => {
  const createdIds: string[] = [];

  test.afterAll(() => {
    for (const id of createdIds) {
      borrarFiesta(id);
    }
  });

  test('Bloque 1: sin sesión el portal de decoración y moodboard redirigen al acceso del portal', async ({ page }) => {
    const fiesta = crearFiestaDeEstaNoche({ id: `e2e_303_b1_${Date.now()}` });
    createdIds.push(fiesta.id);

    await page.goto(`/portal/${encodeURIComponent(fiesta.id)}/decoracion`);
    await expect(page).toHaveURL(new RegExp(`/portal\\?fiestaId=${fiesta.id}`));
    await expect(page.getByText('Tu Salón en 3D')).toHaveCount(0);

    await page.goto(`/portal/${encodeURIComponent(fiesta.id)}/moodboard`);
    await expect(page).toHaveURL(new RegExp(`/portal\\?fiestaId=${fiesta.id}`));
  });

  test('Bloque 2: con sesión del portal el cliente abre los recuerdos sin ver texto interno', async ({ page }) => {
    const clavePortal = `clave-303-${Date.now()}`;
    const fiesta = crearFiestaDeEstaNoche({
      id: `e2e_303_b2_${Date.now()}`,
      clavePortal,
    });
    createdIds.push(fiesta.id);

    // Sin sesión redirige al portal
    await page.goto(`/post-fiesta/${encodeURIComponent(fiesta.id)}`);
    await expect(page).toHaveURL(new RegExp(`/portal\\?fiestaId=${fiesta.id}`));

    // Inicia sesión del portal por el enlace con accessKey
    await page.goto(`/portal/c/${encodeURIComponent(clavePortal)}`);
    await expect(page).toHaveURL(new RegExp(`/portal-cliente/${fiesta.id}`));

    // Ahora sí abre /post-fiesta/[fiestaId] como cliente
    await page.goto(`/post-fiesta/${encodeURIComponent(fiesta.id)}`);
    await expect(page.getByText(fiesta.configuracion.nombreEvento)).toBeVisible();
    await expect(page.getByText(/Google Drive \/ Wfolio/i)).toHaveCount(0);
    await expect(page.getByText(/consumo de datos de Firebase/i)).toHaveCount(0);
  });

  test('Bloque 4: el catálogo no muestra Cliente 1 y llega a la última diapositiva', async ({ page }) => {
    await page.goto('/catalogo/bodas');
    await expect(page.getByText('Cliente 1')).toHaveCount(0);

    // Avanzar hasta llegar al cierre
    for (let i = 0; i < 12; i++) {
      const nextBtn = page.getByRole('button', { name: /Siguiente/i });
      if ((await nextBtn.count()) === 0) break;
      await nextBtn.first().click();
    }

    await expect(page.getByRole('button', { name: /Crear Presupuesto/i })).toBeVisible();
  });
});
