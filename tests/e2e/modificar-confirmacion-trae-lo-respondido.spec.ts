import { test, expect } from '@playwright/test';
import {
  borrarFiesta,
  crearFiestaDeEstaNoche,
  guardarFiesta,
} from './helpers/fiesta-de-prueba';

test.describe('Modificar confirmación de RSVP', () => {
  test('pre-carga lo que el invitado ya respondió y guarda la modificación', async ({ page }) => {
    test.setTimeout(240_000);
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const fechaEvento = `${future.getUTCFullYear()}-${String(future.getUTCMonth() + 1).padStart(2, '0')}-${String(future.getUTCDate()).padStart(2, '0')}`;

    const fiesta = crearFiestaDeEstaNoche({
      id: `e2e_mod_rsvp_${Date.now()}`,
      fechaEvento,
    });

    const baseInvitados = fiesta.invitados ?? [];
    const guest = {
      ...baseInvitados[0],
      id: baseInvitados[0]?.id ?? 'inv_prueba_0',
      guestAccessToken: baseInvitados[0]?.guestAccessToken ?? 'token-prueba-0',
      nombre: 'Lucía Fernández',
      rsvp: 'Confirmado' as const,
      partySize: 2,
      companionNames: ['Marcos Gómez'],
      dietaryRestriction: 'Vegetariano' as const,
      mensaje: 'Nos vemos en la pista',
    };
    fiesta.invitados = [guest, ...baseInvitados.slice(1)];
    guardarFiesta(fiesta);

    try {
      await page.goto(
        `/invitacion/${fiesta.id}/invitado/${guest.id}?token=${encodeURIComponent(guest.guestAccessToken || '')}`,
        { waitUntil: 'domcontentloaded' },
      );

      const modificarLink = page.getByRole('link', { name: /modificar confirmación/i });
      await expect(modificarLink).toBeVisible({ timeout: 15000 });
      await modificarLink.click();

      await page.waitForURL(/\/invitacion\/.*\/rsvp/, { timeout: 45000, waitUntil: 'domcontentloaded' });

      // Verifica que los campos vinieron pre-cargados con lo que ya había respondido
      await expect(page.locator('#nombre')).toHaveValue('Lucía Fernández', { timeout: 30000 });
      await expect(page.locator('#mensaje')).toHaveValue('Nos vemos en la pista');
      await expect(page.locator('#diet-Vegetariano')).toBeChecked();
      await expect(page.getByPlaceholder('Acompañante 1')).toHaveValue('Marcos Gómez');

      // Modifica mensaje y confirma
      await page.locator('#mensaje').fill('Llego puntual con Marcos');
      await page.getByRole('button', { name: /confirmar asistencia/i }).click();

      await expect(page.getByText(/¡Confirmado!/i)).toBeVisible({ timeout: 15000 });

      // Vuelve a abrir el enlace de modificación y verifica que el cambio persistió
      await page.goto(
        `/invitacion/${fiesta.id}/rsvp?guestId=${encodeURIComponent(guest.id)}&token=${encodeURIComponent(guest.guestAccessToken || '')}`,
        { waitUntil: 'domcontentloaded' },
      );
      await expect(page.locator('#nombre')).toHaveValue('Lucía Fernández', { timeout: 15000 });
      await expect(page.locator('#mensaje')).toHaveValue('Llego puntual con Marcos');
    } finally {
      borrarFiesta(fiesta.id);
    }
  });
});
