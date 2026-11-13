import { expect, test } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test.describe('Cada casa tiene su barra (Orden 284 Bloque 2)', () => {
  const casos = [
    {
      ruta: '/invoices',
      casaId: 'plata',
      pestanaTestId: 'pestana-facturas',
      nombrePestana: 'Facturas',
    },
    {
      ruta: '/empresa/contabilidad/gastos',
      casaId: 'plata',
      pestanaTestId: 'pestana-gastos',
      nombrePestana: 'Gastos',
    },
    {
      ruta: '/customers',
      casaId: 'vender',
      pestanaTestId: 'pestana-clientes',
      nombrePestana: 'Clientes',
    },
    {
      ruta: '/empresa/salones',
      casaId: 'recursos',
      pestanaTestId: 'pestana-salones',
      nombrePestana: 'Salones',
    },
    {
      ruta: '/marketing',
      casaId: 'marketing',
      pestanaTestId: 'pestana-resumen',
      nombrePestana: 'Resumen',
    },
  ];

  for (const caso of casos) {
    test(`en ${caso.ruta} se ve la barra de ${caso.casaId} con la pestaña ${caso.nombrePestana} activa`, async ({
      page,
      context,
      baseURL,
    }) => {
      await ponerSesionDelEquipo(context, baseURL);
      await page.goto(caso.ruta);
      await page.waitForLoadState('domcontentloaded');

      // 1. Barra de la casa visible y con el id de casa correcto
      const barra = page.getByTestId('barra-de-la-casa');
      await expect(barra.first()).toBeVisible();
      await expect(barra.first()).toHaveAttribute('data-casa', caso.casaId);

      // 2. Pestaña esperada activa
      const pestana = page.getByTestId(caso.pestanaTestId);
      await expect(pestana.first()).toBeVisible();
      await expect(pestana.first()).toHaveAttribute('data-activa', 'true');
    });
  }

  test('a 390 px de ancho la página no se desplaza de costado en las pantallas con barra', async ({
    page,
    context,
    baseURL,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await ponerSesionDelEquipo(context, baseURL);

    for (const caso of casos) {
      await page.goto(caso.ruta);
      await page.waitForLoadState('domcontentloaded');

      const noSeDesplaza = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
      });

      expect(noSeDesplaza).toBe(true);
    }
  });
});
