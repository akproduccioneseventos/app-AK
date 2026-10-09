import { expect, test } from '@playwright/test';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from '../../tests/e2e/helpers/fiesta-de-prueba';

if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085'
  || process.env.FIREBASE_PROJECT_ID !== 'demo-ak-producciones'
  || process.env.AK_ENTORNO_AISLADO !== 'true') throw new Error('Solo datos ficticios en el emulador.');

const app = initializeApp({ projectId: 'demo-ak-producciones' }, `auditoria-barra-${process.pid}`);
const db = getFirestore(app);
test.afterAll(async () => { await deleteApp(app); });

for (const estado of ['nuevo', 'preparando'] as const) {
  test(`pedido ${estado}: controles correctos y persistencia real`, async ({ page }) => {
    test.setTimeout(120_000);
    const fiesta = crearFiestaDeEstaNoche({ id: `e2e_barra_82_${estado}_${Date.now()}` });
    if (fiesta.modulosContratados) fiesta.modulosContratados.barraTecnologica = true;
    const invitado = fiesta.invitados![0];
    const orderId = `bar_82_${fiesta.id}`;
    const ahora = new Date().toISOString();
    fiesta.others = { ...fiesta.others, barraTecnologica: {
      settings: { enabled: true, openingTime: '', closingTime: '' }, orders: [],
    } } as any;
    guardarFiesta(fiesta);
    const ref = db.collection('bar_drink_orders').doc(orderId);
    try {
      await ref.set({ id: orderId, fiestaId: fiesta.id, drinkId: 'daiquiri-durazno',
        drinkName: 'Daiquiri de durazno', guestName: invitado.nombre, guestId: invitado.id,
        tableNumber: '1', note: '', status: estado, createdAt: ahora, updatedAt: ahora, source: 'touchscreen' });
      await page.goto(`/invitacion/${fiesta.id}/invitado/${invitado.id}?token=${invitado.guestAccessToken}`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: /carta de tragos/i }).first().click();
      await expect(page.getByText('Mi pedido actual')).toBeVisible({ timeout: 30_000 });
      const cancelar = page.getByRole('button', { name: 'Cancelar', exact: true });
      const cambiar = page.getByRole('button', { name: 'Cambiar trago' });
      if (estado === 'nuevo') {
        await expect(cancelar).toBeVisible();
        await expect(cambiar).toBeVisible();
        await cancelar.click();
        await expect.poll(async () => (await ref.get()).data()?.status).toBe('cancelado');
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: /carta de tragos/i }).first().click();
        await expect(page.getByText('Mi pedido actual')).toHaveCount(0);
        expect((await ref.get()).data()?.status).toBe('cancelado');
      } else {
        await expect(cancelar).toHaveCount(0);
        await expect(cambiar).toHaveCount(0);
        await expect(page.getByText(/ya no se puede cancelar ni cambiar/)).toBeVisible();
        expect((await ref.get()).data()?.status).toBe('preparando');
      }
      await page.screenshot({ path: `82-barra-${estado}-${test.info().project.name}.png` });
    } finally {
      await ref.delete();
      borrarFiesta(fiesta.id);
    }
  });
}
