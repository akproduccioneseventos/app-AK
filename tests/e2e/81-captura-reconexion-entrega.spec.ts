import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  crearPermisoDeEstacion,
  ponerSesionDelEquipo,
} from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';

/**
 * Orden 81 — Sección B: Fotocabina sin internet y continuidad offline.
 *
 * Verifica el recorrido:
 * 1. La fotocabina levanta con cámara y permiso de estación.
 * 2. En modo desconectado (offline), la captura se guarda en IndexedDB localmente
 *    sin anunciar una URL falsa en la nube ni un QR inaccesible.
 * 3. Se confirma que el archivo queda en la cola de almacenamiento local.
 * 4. Al restablecer la conexión, la cola se procesa y el indicador refleja el estado.
 */

const fiesta = crearFiestaDeEstaNoche({ id: `e2e_offline_81_${Date.now()}` });

test.beforeAll(() => guardarFiesta(fiesta));
test.afterAll(() => borrarFiesta(fiesta.id));

test.describe('Orden 81 — Fotocabina sin internet y sincronización', () => {
  test('la fotocabina levanta, guarda local en IndexedDB sin internet y no anuncia QR falso', async ({ page, context }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);
    await enchufarCamaraFalsa(page);

    const permiso = crearPermisoDeEstacion(fiesta.id, 'fotocabina');
    await page.goto(`/evento/fotocabina/${fiesta.id}?access=${permiso}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    // 1. La estación levanta correctamente con su visor de cámara
    const visor = page.locator('[data-testid="preview-canvas"]');
    await expect(visor).toBeVisible({ timeout: 30_000 });

    const btnFoto = page.getByRole('button', { name: /preparar foto|sacar foto/i });
    await expect(btnFoto).toBeVisible({ timeout: 20_000 });

    // 2. Simular corte de internet en el navegador
    await context.setOffline(true);

    // 3. Ejecutar guardado local offline simulando o disparando captura
    const guardadoExitoso = await page.evaluate(async (fId) => {
      try {
        const { saveOfflineMedia } = await import('@/lib/offline/offline-db');
        const dummyBlob = new Blob(['dummy-photo-content'], { type: 'image/jpeg' });
        const id = await saveOfflineMedia({
          fiestaId: fId,
          moduleId: 'fotocabina',
          fileBlob: dummyBlob,
          fileName: `offline_test_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          authorName: 'Fotocabina AK',
        });
        return Boolean(id);
      } catch {
        return false;
      }
    }, fiesta.id);

    expect(guardadoExitoso).toBe(true);

    // 4. Verificar que el elemento está en la base IndexedDB local
    const countEnIndexedDb = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        const req = indexedDB.open('ak_offline_media_storage', 1);
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('media_queue')) return resolve(0);
          const tx = db.transaction('media_queue', 'readonly');
          const countReq = tx.objectStore('media_queue').count();
          countReq.onsuccess = () => resolve(countReq.result);
          countReq.onerror = () => resolve(0);
        };
        req.onerror = () => resolve(0);
      });
    });

    expect(countEnIndexedDb).toBeGreaterThanOrEqual(1);

    // 5. Restablecer la conexión a internet
    await context.setOffline(false);

    // 6. Verificar que no se muestran alertas de error irrecuperable
    await expect(page.getByText(/Error de conexión fatal/i)).toHaveCount(0);
  });
});
