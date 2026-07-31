import { expect, test } from '@playwright/test';

/**
 * El catalogo digital por tipo de fiesta es material de venta: se le comparte
 * el enlace a un prospecto. Vive fuera del grupo (app) y no consulta la sesion,
 * pero no figuraba en `PUBLIC_PATH_PREFIXES`, asi que el visitante chocaba con
 * la pantalla de ingreso y el catalogo no servia para vender.
 *
 * Esta prueba entra sin sesion y exige ver el contenido, no el login.
 */

const CATALOGOS = [
  { ruta: '/catalogo', titulo: /presentaciones por tipo/i },
  { ruta: '/catalogo/bodas', titulo: /boda/i },
  { ruta: '/catalogo/xv-anos', titulo: /xv a/i },
  { ruta: '/catalogo/fiestas', titulo: /fiesta/i },
];

/**
 * La presentacion LED enlaza la galeria desde tres de sus laminas para que el
 * prospecto vea fotos; si la galeria pide sesion, ese recorrido se corta.
 */
const GALERIA = '/galeria-led';

test.describe('catalogo digital publico', () => {
  for (const { ruta, titulo } of CATALOGOS) {
    test(`${ruta} se ve sin iniciar sesion`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.goto(ruta, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);

      expect(page.url(), `${ruta} no debe mandar al login`).not.toContain('/login');
      await expect(page.locator('h1').first(), `${ruta} debe mostrar su titulo`).toHaveText(titulo);
    });
  }

  test(`${GALERIA} se ve sin iniciar sesion`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto(`${GALERIA}?categoria=Entrada`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    expect(page.url(), 'la galeria enlazada desde la presentacion no debe mandar al login').not.toContain('/login');
  });
});
