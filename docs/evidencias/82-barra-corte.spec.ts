import { expect, test } from '@playwright/test';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from '../../tests/e2e/helpers/fiesta-de-prueba';

if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085'
  || process.env.FIREBASE_PROJECT_ID !== 'demo-ak-producciones'
  || process.env.AK_ENTORNO_AISLADO !== 'true') throw new Error('Solo datos ficticios en el emulador.');

test('cancelar un trago: si se corta la respuesta el control se recupera', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-desktop', 'La misma funcion de la pantalla.');
  test.setTimeout(120_000);
  const app = initializeApp({ projectId: 'demo-ak-producciones' }, `auditoria-corte-${Date.now()}`);
  const db = getFirestore(app);
  const fiesta = crearFiestaDeEstaNoche({ id: `e2e_barra_corte_82_${Date.now()}` });
  if (fiesta.modulosContratados) fiesta.modulosContratados.barraTecnologica = true;
  const invitado = fiesta.invitados![0];
  const ref = db.collection('bar_drink_orders').doc(`bar_82_${fiesta.id}`);
  const ahora = new Date().toISOString();
  fiesta.others = { ...fiesta.others, barraTecnologica: {
    settings: { enabled: true, openingTime: '', closingTime: '' }, orders: [],
  } } as any;
  guardarFiesta(fiesta);
  try {
    await ref.set({ id: ref.id, fiestaId: fiesta.id, drinkId: 'daiquiri-durazno',
      drinkName: 'Daiquiri de durazno', guestName: invitado.nombre, guestId: invitado.id,
      tableNumber: '1', note: '', status: 'nuevo', createdAt: ahora, updatedAt: ahora, source: 'touchscreen' });
    const url = `/invitacion/${fiesta.id}/invitado/${invitado.id}?token=${invitado.guestAccessToken}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /carta de tragos/i }).first().click();
    await expect(page.getByText('Mi pedido actual')).toBeVisible({ timeout: 30_000 });
    const pedido = page.locator('section').filter({ has: page.getByText('Mi pedido actual') });
    const cancelar = pedido.getByRole('button').first();
    await expect(cancelar).toHaveText('Cancelar');
    let cortes = 0;
    await page.route(`**/invitacion/${fiesta.id}/invitado/${invitado.id}*`, async (route) => {
      if (cortes === 0 && route.request().method() === 'POST' && route.request().postData()?.includes(ref.id)) {
        cortes += 1;
        await route.abort('failed');
      }
      else await route.continue();
    });
    await cancelar.click();
    await page.waitForTimeout(2_000);
    expect(cortes, 'se corta solo la cancelacion; las consultas posteriores siguen funcionando').toBe(1);
    await page.screenshot({ path: '82-barra-corte-desktop.png' });
    expect((await ref.get()).data()?.status).toBe('nuevo');
    await expect(cancelar, 'la solicitud rechazada no debe dejar el control bloqueado').toBeEnabled({ timeout: 5_000 });
    await expect(page.getByText('No se pudo cancelar').first()).toBeVisible();
  } finally {
    await ref.delete();
    borrarFiesta(fiesta.id);
    await deleteApp(app);
  }
});
