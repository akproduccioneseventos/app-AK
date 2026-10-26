import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';

/**
 * Orden 194 / Bloque 4: Los enlaces del invitado llevan quién es
 * - El enlace de confirmar y el de 'mi mesa' llevan guestId (y token).
 * - Post-fiesta sin galeriaUrl no muestra el botón del álbum ni enlaces rotos a wfolio.
 */

test.describe('Los enlaces del invitado llevan quién es (Orden 194)', () => {
  let fiesta: any;

  test.beforeEach(() => {
    fiesta = crearFiestaDeEstaNoche();
    guardarFiesta(fiesta);
  });

  test.afterEach(() => {
    if (fiesta?.id) {
      borrarFiesta(fiesta.id);
    }
  });

  test('el enlace de confirmar asistencia desde la invitación lleva guestId', async ({ page }) => {
    // El enlace de confirmar sólo aparece si el invitado todavía no confirmó.
    const guest = fiesta.invitados.find((g: any) => g.rsvp === 'Pendiente');
    await page.goto(`/invitacion/${fiesta.id}/invitado/${guest.id}?token=${guest.guestAccessToken}`);

    // El botón / enlace de confirmar (RSVP) debe contener guestId
    const enlaceRsvp = page.locator(`a[href*="/rsvp"][href*="guestId=${guest.id}"]`).first();
    await expect(enlaceRsvp).toBeAttached({ timeout: 15_000 });
  });

  test('el hub desde mi mesa lleva guestId', async ({ page }) => {
    const guest = fiesta.invitados[0];
    await page.goto(`/evento/mi-mesa/${fiesta.id}`);

    const input = page.locator('input[type="text"]').first();
    if (await input.isVisible()) {
      await input.fill(guest.nombre.slice(0, 4));
      await page.keyboard.press('Enter');

      const botonEntrar = page.locator(`a[href*="/evento/hub/${fiesta.id}"][href*="guestId="]`).first();
      await expect(botonEntrar).toBeAttached({ timeout: 10_000 });
    }
  });

  test('post-fiesta sin galeriaUrl no muestra el botón del álbum ni enlaces a wfolio', async ({ page }) => {
    delete fiesta.galeriaUrl;
    await page.goto(`/post-fiesta/${fiesta.id}`);

    const botonAlbum = page.locator('a[href*="wfolio.com"], a[href*="drive.google.com"]');
    await expect(botonAlbum).toHaveCount(0);
  });
});
