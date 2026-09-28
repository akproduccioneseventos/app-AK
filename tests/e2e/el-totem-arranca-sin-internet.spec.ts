import { expect, test } from '@playwright/test';
import {
  borrarFiesta,
  crearFiestaDeEstaNoche,
  guardarFiesta,
  ponerSesionDelEquipo,
} from './helpers/fiesta-de-prueba';

test.describe('Bloque 4 - Tótem arranca sin internet y se recupera solo', () => {
  test('corta la red en la primera carga, la vuelve a dar y comprueba que el tótem termina mostrando su título', async ({
    context,
    page,
    baseURL,
  }) => {
    test.setTimeout(45_000);

    await ponerSesionDelEquipo(context, baseURL);

    const fiestaId = `e2e_totem_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });
    const tituloTotem = `Tótem Entrada ${Date.now()}`;

    fiesta.socialGallerySettings = {
      ...(fiesta.socialGallerySettings || {}),
      enabled: true,
      totemScreens: [
        {
          id: 'totem-entrada',
          enabled: true,
          title: tituloTotem,
          honoreeName: tituloTotem,
          subtitle: 'Bienvenido al evento',
          backgroundMode: 'aurora',
          layout: 'portrait',
          accentColor: '#dc2626',
          showQr: true,
          showLatestPhotos: true,
          syncedWithSocialWall: true,
          audioReactive: false,
        },
      ],
    } as any;
    guardarFiesta(fiesta);

    try {
      let redCortada = true;

      await page.route('**/*', async (route) => {
        const type = route.request().resourceType();
        if (redCortada && (type === 'fetch' || type === 'xhr')) {
          await route.abort('internetdisconnected');
          return;
        }
        await route.continue();
      });

      // Abrir el tótem con la red cortada para llamadas a datos
      await page.goto(`/evento/totem/${fiestaId}/totem-entrada`);

      // Debe mostrar el cartel de espera y reintento
      const cartelEspera = page.getByText('Esperando conexión, se reintenta solo');
      await expect(cartelEspera).toBeVisible({ timeout: 15_000 });
      await expect(cartelEspera).toContainText('Esperando conexión, se reintenta solo');

      // Restauramos la conexión a internet
      redCortada = false;

      // El tótem se reintenta automáticamente a los 5 segundos y termina mostrando su título
      const headingTotem = page.getByRole('heading', { name: tituloTotem });
      await expect(headingTotem).toBeVisible({ timeout: 15_000 });
      await expect(headingTotem).toContainText(tituloTotem);
    } finally {
      borrarFiesta(fiestaId);
    }
  });
});
