import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  ponerSesionDelEquipo,
  leerFiesta,
} from './helpers/fiesta-de-prueba';

/**
 * Orden 81 — Sección D: Barra tecnológica, roles y pedidos sin duplicados.
 *
 * Flujo de usuario real:
 * 1. El invitado entra desde su invitación digital personalizada.
 * 2. Se comprueba que no tiene acceso a botones de administración ni pantalla de barman.
 * 3. Selecciona un trago del quiosco y toca DOS VECES RÁPIDO el botón de confirmar pedido.
 * 4. La protección contra doble pulsación evita duplicados:
 *    - Se verifica que en la fiesta se registró EXACTAMENTE UN pedido.
 *    - Se abre la pantalla del barman (`/evento/barra/[id]/barman`) y se comprueba
 *      que en la lista de pedidos en vivo el pedido del invitado aparece una sola vez.
 */

const fiesta = crearFiestaDeEstaNoche({ id: `e2e_barra_81_${Date.now()}` });
const invitado = fiesta.invitados?.[0] || {
  id: 'inv_test_81',
  nombre: 'Lucía Fernández',
  tableNumber: '1',
  guestAccessToken: 'tok_test_81',
};

test.beforeAll(() => guardarFiesta(fiesta));
test.afterAll(() => borrarFiesta(fiesta.id));

test.describe('Orden 81 — Barra tecnológica: doble toque sin duplicados y pantalla de barman', () => {
  test('dos toques rápidos de pedir generan un solo pedido en la barra y al barman', async ({ page, context }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;

    // 1. Abrir la pantalla de invitación del invitado con quiosco de barra
    await page.goto(`/invitacion/${fiesta.id}/invitado/${invitado.id}?token=${invitado.guestAccessToken}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 25_000 }).catch(() => {});

    // 2. Verificar que no se muestran controles administrativos de barman
    await expect(page.getByRole('button', { name: /pausar barra|entregar pedido|cerrar caja|gestionar stock/i })).toHaveCount(0);
    await expect(page.getByText(/Panel de control barman|Modo Bartender|Administración de barra/i)).toHaveCount(0);

    // Abrir la carta de tragos desde el portal del invitado
    const btnCarta = page.getByRole('button', { name: /carta de tragos/i }).or(page.getByText(/carta de tragos/i)).first();
    if (await btnCarta.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btnCarta.click();
    }

    // 3. Seleccionar el primer trago de la carta
    const btnPedir = page.locator('[data-testid="boton-pedir-trago"]').first();
    await expect(btnPedir).toBeVisible({ timeout: 20_000 });
    await btnPedir.click();

    // 4. Se abre el diálogo modal con el botón Confirmar
    const btnConfirmar = page.locator('[data-testid="boton-confirmar-pedido"]');
    await expect(btnConfirmar).toBeVisible({ timeout: 10_000 });

    // 5. Simular DOS toques rápidos en el botón de confirmar pedido
    await Promise.all([
      btnConfirmar.click({ force: true, noWaitAfter: true }).catch(() => {}),
      btnConfirmar.click({ force: true, noWaitAfter: true }).catch(() => {}),
    ]);

    // 6. Esperar a que el diálogo se cierre y aparezca el aviso de éxito
    await expect(page.getByText(/Pedido registrado/i)).toBeVisible({ timeout: 15_000 });

    // 7. Comprobar en los datos guardados de la fiesta que hay exactamente UN pedido para este invitado
    const fiestaActualizada = leerFiesta(fiesta.id);
    const pedidos = fiestaActualizada?.others?.barraTecnologica?.orders || [];
    const pedidosDelInvitado = pedidos.filter(
      (p: any) => p.guestName === invitado.nombre || p.guestId === invitado.id,
    );
    expect(pedidosDelInvitado.length).toBe(1);

    // 8. Abrir la pantalla del barman con sesión del equipo y verificar que aparece una sola vez
    await ponerSesionDelEquipo(context, baseURL);
    const barmanPage = await context.newPage();
    await barmanPage.goto(`/evento/barra/${fiesta.id}/barman`, { waitUntil: 'domcontentloaded' });
    await barmanPage.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(barmanPage.getByText(invitado.nombre)).toHaveCount(1);
    await barmanPage.close();
  });
});
