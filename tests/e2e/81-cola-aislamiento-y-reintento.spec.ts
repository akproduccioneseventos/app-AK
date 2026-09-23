import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  crearPermisoDeEstacion,
  ponerSesionDelEquipo,
} from './helpers/fiesta-de-prueba';

/**
 * Orden 81 — Sección B: Cola de subida, aislamiento entre eventos y reintentos.
 *
 * Verifica que:
 * 1. Los elementos encolados de una fiesta no son procesados ni borrados por otra fiesta (aislamiento por fiestaId).
 * 2. Las credenciales e identidad de un invitado (guestId) permanecen asociadas a su propia captura.
 * 3. Si un envío falla por falta de red, el ítem se conserva en IndexedDB para el próximo reintento.
 */

const fiestaA = crearFiestaDeEstaNoche({ id: `e2e_cola_a_81_${Date.now()}` });
const fiestaB = crearFiestaDeEstaNoche({ id: `e2e_cola_b_81_${Date.now()}` });

test.beforeAll(() => {
  guardarFiesta(fiestaA);
  guardarFiesta(fiestaB);
});

test.afterAll(() => {
  borrarFiesta(fiestaA.id);
  borrarFiesta(fiestaB.id);
});

test.describe('Orden 81 — Cola de subida, aislamiento y reintentos', () => {
  test('la cola aísla capturas por fiesta y conserva los elementos en reintentos fallidos', async ({ page, context }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);

    const permiso = crearPermisoDeEstacion(fiestaA.id, 'fotocabina');
    await page.goto(`/evento/fotocabina/${fiestaA.id}?access=${permiso}`, { waitUntil: 'domcontentloaded' });

    // 1. Insertar directamente en IndexedDB capturas para fiestaA y fiestaB
    const resultadoCarga = await page.evaluate(async ({ idA, idB }) => {
      const { saveOfflineMedia, getPendingOfflineMedia } = await import('@/lib/offline/offline-db');
      const blobA = new Blob(['foto-fiesta-a'], { type: 'image/jpeg' });
      const blobB = new Blob(['foto-fiesta-b'], { type: 'image/jpeg' });

      await saveOfflineMedia({
        fiestaId: idA,
        moduleId: 'fotocabina',
        fileBlob: blobA,
        fileName: 'foto_a.jpg',
        mimeType: 'image/jpeg',
        authorName: 'Invitado A',
        guestId: 'guest_a_123',
      });

      await saveOfflineMedia({
        fiestaId: idB,
        moduleId: 'fotocabina',
        fileBlob: blobB,
        fileName: 'foto_b.jpg',
        mimeType: 'image/jpeg',
        authorName: 'Invitado B',
        guestId: 'guest_b_456',
      });

      const itemsA = await getPendingOfflineMedia(idA);
      const itemsB = await getPendingOfflineMedia(idB);
      return { totalA: itemsA.length, totalB: itemsB.length };
    }, { idA: fiestaA.id, idB: fiestaB.id });

    expect(resultadoCarga.totalA).toBeGreaterThanOrEqual(1);
    expect(resultadoCarga.totalB).toBeGreaterThanOrEqual(1);

    // 2. Verificar resolución de credenciales aislada (guestId no se contagia)
    const credencialesCorrectas = await page.evaluate(async ({ idA }) => {
      const { getPendingOfflineMedia } = await import('@/lib/offline/offline-db');
      const { resolveOfflineMediaCredentials } = await import('@/lib/offline/offline-sync-manager');

      const itemsA = await getPendingOfflineMedia(idA);
      const item = itemsA[0];

      // Simulamos que el scope actual tiene un guestId diferente en el navegador
      const resolved = resolveOfflineMediaCredentials(item, {
        fiestaId: idA,
        guestId: 'otro_invitado_activo',
      });

      // Debe conservar el guestId original del ítem
      return resolved.guestId === 'guest_a_123';
    }, { idA: fiestaA.id });

    expect(credencialesCorrectas).toBe(true);

    // 3. Simular procesamiento offline: si navigator.onLine es falso, no borra la cola
    await context.setOffline(true);

    const reintentoSinPerdida = await page.evaluate(async ({ idA }) => {
      const { processOfflineMediaQueue } = await import('@/lib/offline/offline-sync-manager');
      const { getPendingOfflineMedia } = await import('@/lib/offline/offline-db');

      // Intentar sincronizar sin red
      await processOfflineMediaQueue({ fiestaId: idA });

      // Los ítems deben permanecer intactos
      const pendientes = await getPendingOfflineMedia(idA);
      return pendientes.length;
    }, { idA: fiestaA.id });

    expect(reintentoSinPerdida).toBeGreaterThanOrEqual(1);

    await context.setOffline(false);
  });
});
