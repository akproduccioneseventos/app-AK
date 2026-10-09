import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';

/**
 * Codex, auditoría 82 (BAR82-CANCEL, orden 132): el invitado tocaba "Cancelar" en su trago, se
 * cortaba la respuesta del servidor y el botón quedaba girando para siempre, sin aviso. Esta prueba
 * corta SÓLO ese pedido y mira lo que ve el invitado: el aviso de que no se pudo, el botón de nuevo
 * disponible y el pedido sin dar por cancelado. Adaptada de `docs/evidencias/82-barra-corte.spec.ts`
 * para correr con los datos de prueba de la puerta (sin emulador).
 */
test('cancelar un trago con la señal cortada: el botón se recupera y no dice "cancelado"', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-desktop', 'La misma función de la pantalla en PC y celular.');
  test.setTimeout(180_000);
  const fiesta = crearFiestaDeEstaNoche({ id: `e2e_barra_corte_${Date.now()}` });
  if (fiesta.modulosContratados) fiesta.modulosContratados.barraTecnologica = true;
  const invitado = fiesta.invitados![0];
  const ahora = new Date().toISOString();
  const pedidoId = `bar_e2e_corte_${Date.now()}`;
  fiesta.others = {
    ...fiesta.others,
    barraTecnologica: {
      settings: { enabled: true, openingTime: '', closingTime: '' },
      orders: [{
        id: pedidoId, fiestaId: fiesta.id, drinkId: 'daiquiri-durazno', drinkName: 'Daiquiri de durazno',
        guestName: invitado.nombre, guestId: invitado.id, tableNumber: '1', note: '', status: 'nuevo',
        createdAt: ahora, updatedAt: ahora, source: 'touchscreen',
      }],
    },
  } as any;
  guardarFiesta(fiesta);
  try {
    await page.goto(`/invitacion/${fiesta.id}/invitado/${invitado.id}?token=${invitado.guestAccessToken}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Estamos preparando tu información/i)).toBeHidden({ timeout: 60_000 });
    await page.getByRole('button', { name: /carta de tragos/i }).first().click();
    await expect(page.getByText(/Estamos preparando el quiosco de tragos/i)).toBeHidden({ timeout: 60_000 });
    await expect(page.getByText('Mi pedido actual')).toBeVisible({ timeout: 30_000 });

    let cortes = 0;
    await page.route(`**/invitacion/${fiesta.id}/invitado/${invitado.id}*`, async (route) => {
      const req = route.request();
      if (cortes === 0 && req.method() === 'POST' && (req.postData() || '').includes(pedidoId)) {
        cortes += 1;
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    const cancelar = page.getByRole('button', { name: 'Cancelar', exact: true });
    await cancelar.click();
    await expect(page.getByText('No se pudo cancelar').first()).toBeVisible({ timeout: 15_000 });
    expect(cortes).toBe(1);
    await expect(cancelar, 'el botón no queda trabado').toBeEnabled({ timeout: 10_000 });
    await expect(page.getByText('Pedido cancelado')).toHaveCount(0);
    await expect(page.getByText('Mi pedido actual')).toBeVisible();
  } finally {
    borrarFiesta(fiesta.id);
  }
});
