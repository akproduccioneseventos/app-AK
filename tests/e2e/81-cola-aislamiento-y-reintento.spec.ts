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
  if (!f.others) f.others = {};
  if (!f.others.entretenimiento) f.others.entretenimiento = { modules: {} };
  if (!f.others.entretenimiento.modules) f.others.entretenimiento.modules = {};
  f.others.entretenimiento.modules.fotocabina = {
    enabled: true,
    fotosPorTanda: 1,
    segundosCuentaRegresiva: 2,
    autoPublish: true,
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
    test.setTimeout(120_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);
    await enchufarCamaraFalsa(page);

    // 1. Abrir fotocabina para fiestaA
    const permisoA = crearPermisoDeEstacion(fiestaA.id, 'fotocabina');
    await page.goto(`/evento/fotocabina/${fiestaA.id}?access=${permisoA}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible({ timeout: 25_000 });

    // Cortar conexión y disparar captura real en fiestaA
    await context.setOffline(true);
    await page.locator('[data-testid="boton-sacar-foto"]').click();

    // Comprobar aviso de guardado en este equipo para fiestaA
    const avisoA = page.locator('[data-testid="aviso-guardada-offline"]');
    await expect(avisoA).toBeVisible({ timeout: 25_000 });
    await expect(avisoA).toContainText('guardada en este equipo');

    // 2. Abrir fotocabina para fiestaB (siguiendo desconectados)
    const permisoB = crearPermisoDeEstacion(fiestaB.id, 'fotocabina');
    await page.goto(`/evento/fotocabina/${fiestaB.id}?access=${permisoB}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible({ timeout: 25_000 });

    // Disparar captura real en fiestaB
    await page.locator('[data-testid="boton-sacar-foto"]').click();

    // Comprobar aviso de guardado en este equipo para fiestaB
    const avisoB = page.locator('[data-testid="aviso-guardada-offline"]');
    await expect(avisoB).toBeVisible({ timeout: 25_000 });
    await expect(avisoB).toContainText('guardada en este equipo');

    // 3. Verificar que ambas capturas están en la base local IndexedDB sin errores
    const totalEnCola = await page.evaluate(async () => {
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
    expect(totalEnCola).toBeGreaterThanOrEqual(2);

    // 4. Restablecer conexión y sincronizar
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));

    // Esperar procesamiento de la cola
    await page.waitForTimeout(5000);

    // 5. Verificar aislamiento: fiestaA tiene su foto y fiestaB tiene la suya, ninguna duplicada ni cruzada
    const datosFiestaA = leerFiesta(fiestaA.id);
    const mediaA = datosFiestaA?.others?.entretenimiento?.modules?.fotocabina?.media || [];
    expect(mediaA.length).toBe(1);

    const datosFiestaB = leerFiesta(fiestaB.id);
    const mediaB = datosFiestaB?.others?.entretenimiento?.modules?.fotocabina?.media || [];
    expect(mediaB.length).toBe(1);

    // Comprobar que los identificadores de fotos son distintos (no se mezclaron)
    expect(mediaA[0].id).not.toBe(mediaB[0].id);
  });
});
