import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  crearPermisoDeEstacion,
  ponerSesionDelEquipo,
  leerFiesta,
} from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';

/**
 * Orden 81 — Sección B: Aislamiento entre eventos y cola de reintento.
 *
 * Flujo de usuario real:
 * 1. Se configuran dos fiestas distintas (fiestaA y fiestaB) en la misma estación / dispositivo.
 * 2. En modo offline (`context.setOffline(true)`), se saca una foto con el botón real en la fotocabina de fiestaA.
 * 3. Se confirma que aparece en pantalla el aviso "Foto guardada en este equipo".
 * 4. Luego se abre la fotocabina de fiestaB en modo offline y se saca otra foto real.
 * 5. Se restablece la conexión a internet.
 * 6. La sincronización automática envía cada foto exclusivamente a su fiesta correspondiente
 *    sin mezclar fotos ni filtrar capturas de una fiesta en la otra.
 */

const fiestaA = crearFiestaDeEstaNoche({ id: `e2e_cola_a_81_${Date.now()}` });
const fiestaB = crearFiestaDeEstaNoche({ id: `e2e_cola_b_81_${Date.now() + 1}` });

for (const f of [fiestaA, fiestaB]) {
  f.others = {
    ...f.others,
    entretenimiento: {
      modules: {
        fotocabina: {
          enabled: true,
          fotosPorTanda: 1,
          segundosCuentaRegresiva: 2,
          autoPublish: true,
        },
      },
    },
  };
}

test.beforeAll(() => {
  guardarFiesta(fiestaA);
  guardarFiesta(fiestaB);
});

test.afterAll(() => {
  borrarFiesta(fiestaA.id);
  borrarFiesta(fiestaB.id);
});

test.describe('Orden 81 — Cola de subida, aislamiento y reintentos', () => {
  test('las capturas offline se aíslan por fiesta y se sincronizan a su destino sin cruzarse', async ({ page, context }, testInfo) => {
    test.setTimeout(180_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);
    await enchufarCamaraFalsa(page);

    // 1. Abrir fotocabina para fiestaA
    const permisoA = crearPermisoDeEstacion(fiestaA.id, 'fotocabina');
    await page.goto(`/evento/fotocabina/${fiestaA.id}?access=${permisoA}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible({ timeout: 25_000 });

    // 2. Abrir fotocabina para fiestaB en una segunda pantalla mientras hay conexión
    const pageB = await context.newPage();
    await enchufarCamaraFalsa(pageB);
    const permisoB = crearPermisoDeEstacion(fiestaB.id, 'fotocabina');
    await pageB.goto(`/evento/fotocabina/${fiestaB.id}?access=${permisoB}`, { waitUntil: 'domcontentloaded' });
    await expect(pageB.locator('[data-testid="preview-canvas"]')).toBeVisible({ timeout: 25_000 });

    // Cortar conexión para todo el contexto
    await context.setOffline(true);

    // Disparar captura en fiestaA
    await page.locator('[data-testid="boton-sacar-foto"]').click();
    const avisoA = page.locator('[data-testid="aviso-guardada-offline"]').first();
    await expect(avisoA).toBeVisible({ timeout: 45_000 });
    await expect(avisoA).toContainText(/guardada en este equipo/i);

    // Disparar captura en fiestaB
    await pageB.locator('[data-testid="boton-sacar-foto"]').click();
    const avisoB = pageB.locator('[data-testid="aviso-guardada-offline"]').first();
    await expect(avisoB).toBeVisible({ timeout: 45_000 });
    await expect(avisoB).toContainText(/guardada en este equipo/i);

    // 3. Verificar que ambas capturas están en la base local IndexedDB sin errores
    await expect.poll(async () => {
      return page.evaluate(async () => {
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
    }, { timeout: 30_000 }).toBeGreaterThanOrEqual(2);

    // 4. Restablecer conexión y sincronizar
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await pageB.evaluate(() => window.dispatchEvent(new Event('online')));

    // 5. Verificar aislamiento: fiestaA tiene su foto y fiestaB tiene la suya, ninguna duplicada ni cruzada
    await expect.poll(() => {
      const datosFiestaA = leerFiesta(fiestaA.id);
      const mediaA = datosFiestaA?.others?.entretenimiento?.modules?.fotocabina?.media || [];
      return mediaA.length;
    }, { timeout: 30_000 }).toBe(1);

    await expect.poll(() => {
      const datosFiestaB = leerFiesta(fiestaB.id);
      const mediaB = datosFiestaB?.others?.entretenimiento?.modules?.fotocabina?.media || [];
      return mediaB.length;
    }, { timeout: 30_000 }).toBe(1);

    const mediaA = leerFiesta(fiestaA.id)?.others?.entretenimiento?.modules?.fotocabina?.media || [];
    const mediaB = leerFiesta(fiestaB.id)?.others?.entretenimiento?.modules?.fotocabina?.media || [];

    // Comprobar que los identificadores de fotos son distintos (no se mezclaron)
    expect(mediaA[0].id).not.toBe(mediaB[0].id);

    await pageB.close();
  });
});
