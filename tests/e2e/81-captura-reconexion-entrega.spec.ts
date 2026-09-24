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
 * Orden 81 — Sección B: Fotocabina sin internet, aviso en pantalla y sincronización única.
 *
 * Flujo de usuario real:
 * 1. Levanta la fotocabina con cámara web y permiso de estación.
 * 2. Se corta la conexión a internet (`context.setOffline(true)`).
 * 3. El invitado pulsa el botón real de captura ("Preparar foto").
 * 4. Tras la cuenta regresiva y la captura, aparece visible en pantalla el aviso:
 *    "Foto guardada en este equipo".
 * 5. Se restablece la conexión (`context.setOffline(false)` y evento 'online').
 * 6. La cola procesa la captura y se comprueba que en la fiesta la foto aparece una sola vez (sin duplicados).
 */

const fiesta = crearFiestaDeEstaNoche({ id: `e2e_fotocabina_offline_81_${Date.now()}` });
fiesta.others = {
  ...fiesta.others,
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
fiesta.socialGallerySettings = {
  ...fiesta.socialGallerySettings,
  enabled: true,
  requireApproval: false,
  allowLikes: true,
  allowComments: true,
  uploadsActive: true,
};

test.beforeAll(() => guardarFiesta(fiesta));
test.afterAll(() => borrarFiesta(fiesta.id));

test.describe('Orden 81 — Fotocabina sin internet, aviso y entrega única', () => {
  test('saca foto con botón real sin internet, muestra aviso guardada en este equipo, reconecta y entrega una sola vez', async ({ page, context }, testInfo) => {
    test.setTimeout(180_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);
    await enchufarCamaraFalsa(page);

    const permiso = crearPermisoDeEstacion(fiesta.id, 'fotocabina');
    await page.goto(`/evento/fotocabina/${fiesta.id}?access=${permiso}`, { waitUntil: 'domcontentloaded' });

    // 1. La estación levanta con cámara en vivo y botón de disparo
    const visor = page.locator('[data-testid="preview-canvas"]');
    await expect(visor).toBeVisible({ timeout: 45_000 });

    const btnDisparo = page.locator('[data-testid="boton-sacar-foto"]');
    await expect(btnDisparo).toBeVisible({ timeout: 20_000 });

    // 2. Simular corte total de conexión antes de sacar la foto
    await context.setOffline(true);

    // 3. Tocar el botón de verdad para sacar la foto
    await btnDisparo.click();

    // 4. Ver en pantalla el aviso visible "guardada en este equipo"
    const avisoOffline = page.locator('[data-testid="aviso-guardada-offline"]').first();
    await expect(avisoOffline).toBeVisible({ timeout: 45_000 });
    await expect(avisoOffline).toContainText(/guardada en este equipo/i);

    // 5. Verificar que la captura está esperando en la base local IndexedDB
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
    }, { timeout: 30_000 }).toBeGreaterThanOrEqual(1);

    // 6. Volver a conectar internet y disparar sincronización
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));

    // 7. Comprobar que en el servidor / datos de la fiesta la foto aparece UNA SOLA VEZ
    await expect.poll(() => {
      const f = leerFiesta(fiesta.id);
      return (f?.others?.entretenimiento?.modules?.fotocabina?.media || []).length;
    }, { timeout: 30_000 }).toBe(1);

    // 8. Reintento de sincronización posterior: comprobar que sigue habiendo una sola foto
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.waitForTimeout(1000);

    const fiestaTrasReintento = leerFiesta(fiesta.id);
    const mediaListFinal = fiestaTrasReintento?.others?.entretenimiento?.modules?.fotocabina?.media || [];
    expect(mediaListFinal.length).toBe(1);

    // 9. Comprobar que en el muro de la fiesta (/evento/social/<id>) aparece UNA sola publicación
    await page.goto(`/evento/social/${fiesta.id}`, { waitUntil: 'domcontentloaded' });
    const publicaciones = page.locator('article');
    await expect(publicaciones).toHaveCount(1, { timeout: 30_000 });
  });
});
