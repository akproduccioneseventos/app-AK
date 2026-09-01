import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';

test.describe('Orden 31: Encontrá tus fotos con una selfie', () => {
  const fiestaId = 'fiesta-selfie-test-31';

  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });
    fiesta.configuracion.nombreEvento = 'XV de Florencia - Búsqueda Facial';
    guardarFiesta(fiesta);
  });

  test.afterAll(async () => {
    borrarFiesta(fiestaId);
  });

  test('El botón de encontrar fotos abre el cartel de privacidad y no prende la cámara sin permiso', async ({ page }) => {
    await page.goto(`/evento/album/${fiestaId}`);

    // 1. Botón "Encontrá tus fotos" visible en el encabezado
    const botonSelfie = page.getByRole('button', { name: /Encontrá tus fotos/i });
    await expect(botonSelfie).toBeVisible();

    // 2. Tocar el botón para abrir el modal
    await botonSelfie.click();

    // 3. Comprobar que aparece el cartel de privacidad de Bloque 0
    await expect(page.getByText(/Tu privacidad es lo primero/i)).toBeVisible();
    await expect(page.getByText(/No se guarda, no se sube a ningún servidor/i)).toBeVisible();

    // 4. Comprobar que no hay stream de cámara activo antes de consentir
    const botonAceptar = page.getByRole('button', { name: /Aceptar y sacar selfie/i });
    await expect(botonAceptar).toBeVisible();

    // 5. Permite cancelar y volver a la galería completa
    const botonCancelar = page.getByRole('button', { name: /Ver todas las fotos sin selfie/i });
    await botonCancelar.click();
    await expect(page.getByText(/Tu privacidad es lo primero/i)).not.toBeVisible();
  });
});
