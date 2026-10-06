import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';

/**
 * Orden 123 (BARRA72-2). Decisión del dueño, 6/10/2026: el invitado cancela o cambia su trago
 * SÓLO hasta que el barman lo empieza. La pantalla ofrecía Cancelar y Cambiar también en
 * "preparando", y el servidor los rechazaba. Mira lo que ve el invitado en los dos estados.
 */
function fiestaConPedido(estado: 'nuevo' | 'preparando') {
  const fiesta = crearFiestaDeEstaNoche({ id: `e2e_barra_72_${estado}_${Date.now()}` });
  if (fiesta.modulosContratados) fiesta.modulosContratados.barraTecnologica = true;
  const invitado = fiesta.invitados![0];
  const ahora = new Date().toISOString();
  fiesta.others = {
    ...fiesta.others,
    barraTecnologica: {
      settings: { enabled: true, openingTime: '', closingTime: '' },
      orders: [{
        id: `bar_e2e72_${estado}`, fiestaId: fiesta.id, drinkId: 'daiquiri-durazno', drinkName: 'Daiquiri de durazno',
        guestName: invitado.nombre, guestId: invitado.id, tableNumber: '1', note: '', status: estado,
        createdAt: ahora, updatedAt: ahora, source: 'touchscreen',
      }],
    },
  } as any;
  return { fiesta, invitado };
}

for (const estado of ['nuevo', 'preparando'] as const) {
  test(`pedido en "${estado}": el invitado ve lo que de verdad puede hacer`, async ({ page }) => {
    test.setTimeout(180_000);
    const { fiesta, invitado } = fiestaConPedido(estado);
    guardarFiesta(fiesta);
    try {
      await page.goto(`/invitacion/${fiesta.id}/invitado/${invitado.id}?token=${invitado.guestAccessToken}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/Estamos preparando tu información/i)).toBeHidden({ timeout: 60_000 });
      await page.getByRole('button', { name: /carta de tragos/i }).first().click();
      await expect(page.getByText(/Estamos preparando el quiosco de tragos/i)).toBeHidden({ timeout: 60_000 });
      await expect(page.getByText('Mi pedido actual')).toBeVisible({ timeout: 30_000 });

      const cancelar = page.getByRole('button', { name: 'Cancelar', exact: true });
      const cambiar = page.getByRole('button', { name: 'Cambiar trago' });
      if (estado === 'nuevo') {
        await expect(cancelar).toBeVisible();
        await expect(cambiar).toBeVisible();
      } else {
        await expect(cancelar).toHaveCount(0);
        await expect(cambiar).toHaveCount(0);
        await expect(page.getByText(/ya no se puede cancelar ni cambiar/)).toBeVisible();
      }
    } finally {
      borrarFiesta(fiesta.id);
    }
  });
}
