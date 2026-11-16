import { expect, test } from '@playwright/test';
import { crearFiestaDeEstaNoche, borrarFiesta, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';
import { PESTANAS_FIESTA } from '../../src/lib/fiesta/fiesta-modules';

test.describe('Planificar tiene un solo orden (Orden 284 Bloque 5)', () => {
  let fiestaId: string;

  test.beforeEach(async ({ context, baseURL }) => {
    const fiesta = crearFiestaDeEstaNoche({ id: `e2e-orden284-${Date.now()}` });
    fiestaId = fiesta.id;
    await ponerSesionDelEquipo(context, baseURL);
  });

  test.afterEach(async () => {
    if (fiestaId) {
      borrarFiesta(fiestaId);
    }
  });

  test('en /fiestas/nueva se ven las 5 pestañas, no se ven momentos ni modos rápidos, y aparece "No contratado en esta fiesta"', async ({ page }) => {
    await page.goto(`/fiestas/nueva?fiestaId=${encodeURIComponent(fiestaId)}`);
    await page.waitForLoadState('domcontentloaded');

    // 1. Se ven las 5 pestañas oficiales
    for (const p of PESTANAS_FIESTA) {
      const tab = page.getByRole('tab', { name: p.label });
      await expect(tab).toBeVisible();
    }

    // 2. NO se ven los textos de los momentos eliminados
    const textosMomentos = ['1. Vender', '2. Armar', '3. La Noche', '4. Después'];
    for (const texto of textosMomentos) {
      await expect(page.getByText(texto, { exact: true })).toBeHidden();
    }

    // 3. NO se ven los textos de los modos rápidos eliminados
    const textosModosRapidos = ['Día del Evento', 'Preparación', 'Vista Cliente', 'Tecnología AK'];
    for (const texto of textosModosRapidos) {
      await expect(page.getByText(texto, { exact: true })).toBeHidden();
    }

    // 4. Aparece "No contratado en esta fiesta"
    const noContratado = page.getByText(/No contratado en esta fiesta/i);
    await expect(noContratado.first()).toBeVisible();
    await expect(noContratado.first()).toContainText('No contratado en esta fiesta');
  });
});
