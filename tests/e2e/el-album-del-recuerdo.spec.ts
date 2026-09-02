import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, crearCookieDeSesion } from './helpers/fiesta-de-prueba';

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

  test('El álbum carga la portada, permite pasar páginas y muestra los recuerdos', async ({ context, page }, testInfo) => {
    test.setTimeout(180_000);

    // OJO: hoy `/evento/album/[fiestaId]` **pide contrasena**. No esta en la
    // lista de pantallas publicas (`src/lib/auth/public-paths.ts`), mientras que
    // `/evento/galeria` si lo esta. Sin cuenta, esta prueba veia la pantalla de
    // ingreso y no encontraba ningun titulo.
    //
    // Se le pone la cuenta para poder probar el album. **Pero que el album pida
    // contrasena es una decision del dueno**, no un detalle de la prueba: es lo
    // que recibe el cliente despues de la fiesta. Queda anotado en
    // docs/YA-RESUELTO.md para preguntarselo.
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    await page.goto(`/evento/album/${fiestaId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 25_000 }).catch(() => {});

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
