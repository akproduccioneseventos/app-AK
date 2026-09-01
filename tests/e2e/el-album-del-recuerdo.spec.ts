import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';

test.describe('Orden 28: El Álbum del Recuerdo', () => {
  const fiestaId = 'fiesta-album-test-28';

  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });
    fiesta.configuracion.nombreEvento = 'XV de Valentina - Álbum de Prueba';
    fiesta.configuracion.fechaEvento = new Date().toISOString();
    guardarFiesta(fiesta);
  });

  test.afterAll(async () => {
    borrarFiesta(fiestaId);
  });

  test('El álbum carga la portada, permite pasar páginas y muestra los recuerdos', async ({ page }) => {
    await page.goto(`/evento/album/${fiestaId}`);

    // 1. Comprobar que carga el título del evento en el encabezado y la portada
    await expect(page.locator('h1')).toContainText('XV de Valentina');

    // 2. Comprobar el botón para abrir el álbum
    const botonAbrir = page.getByRole('button', { name: /Abrir Álbum/i });
    if (await botonAbrir.isVisible()) {
      await botonAbrir.click();
      // Debe avanzar a la página 1
      await expect(page.getByText(/Página 1 de/i)).toBeVisible();
    }

    // 3. Comprobar que se puede alternar a la vista de Galería Completa
    const botonGaleria = page.getByRole('button', { name: /Galería Completa/i });
    await expect(botonGaleria).toBeVisible();
    await botonGaleria.click();

    // 4. Comprobar que las solapas de filtro existen
    await expect(page.getByRole('button', { name: /Fotocabina/i })).toBeVisible();
  });
});
