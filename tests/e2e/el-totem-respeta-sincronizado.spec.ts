import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
} from './helpers/fiesta-de-prueba';

test.describe('Tótem respeta syncedWithSocialWall (Orden 374 B4)', () => {
  const fiestaId = `e2e_totem_sync_${Date.now()}`;

  test.beforeEach(() => {
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });
    fiesta.socialGallerySettings = {
      ...(fiesta.socialGallerySettings ?? {}),
      enabled: true,
      totemScreens: [
        {
          id: 'totem-sin-muro',
          enabled: true,
          syncedWithSocialWall: false,
          showLatestPhotos: true,
          slideshowIntervalSeconds: 6,
          theme: 'dark',
          title: 'Tótem sin muro',
          subtitle: 'Prueba sin muro',
        },
      ],
    } as any;
    guardarFiesta(fiesta);
  });

  test.afterEach(() => {
    borrarFiesta(fiestaId);
  });

  test('cuando syncedWithSocialWall está apagado, no carga ni muestra fotos del muro social', async ({ page }) => {
    let llamoAlMuro = false;
    await page.route('**/*', async (route) => {
      const req = route.request();
      if (req.method() === 'POST' && req.postData()?.includes('getPublicSocialPosts')) {
        llamoAlMuro = true;
      }
      await route.continue();
    });

    await page.goto(`/evento/totem/${fiestaId}/totem-sin-muro`);
    await expect(page.getByRole('heading', { name: 'Tótem sin muro' })).toBeVisible({ timeout: 15000 });
    expect(llamoAlMuro).toBe(false);
  });
});
