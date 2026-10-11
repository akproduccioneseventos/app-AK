// @ts-nocheck -- pagina publica real contra emuladores; no hay firmante de Google en el emulador.
/**
 * Orden 148 (VID96-LECTOR): un error de lectura de las fotos del Video de Vida no se muestra como
 * "Tu Galería (0 de N)". Basado en la sonda de Codex (docs/evidencias/96-video-lector-browser.spec.ts).
 *
 * Solo corre en el entorno aislado con emuladores (Firestore 8085, Storage 9195): si no está, se
 * saltea y lo dice. Con una foto guardada y SIN firmante, el lector no puede dar la dirección: la
 * pantalla tiene que avisar, ofrecer Reintentar y no ofrecer subir. Con la galería de verdad vacía
 * sigue diciendo "0 de 2" y deja subir.
 *
 * Probado rompiéndolo: con el lector devolviendo [] ante el error, el caso "foto guardada" se pone
 * en rojo (aparece "Tu Galería (0 de 2)" y los dos recuadros habilitados).
 */
import admin from 'firebase-admin';
import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';

const aislado =
  process.env.AK_ENTORNO_AISLADO === 'true' &&
  process.env.FIRESTORE_EMULATOR_HOST === '127.0.0.1:8085' &&
  process.env.FIREBASE_STORAGE_EMULATOR_HOST === '127.0.0.1:9195';
test.skip(!aislado, 'Requiere el entorno aislado con emuladores de Firestore y Storage.');

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jV2kAAAAASUVORK5CYII=', 'base64');

let app, db, bucket;
test.beforeAll(() => {
  if (!aislado) return;
  app = admin.initializeApp({ projectId: 'demo-ak-producciones', storageBucket: 'demo-ak-producciones.appspot.com' }, 'e2e148-' + process.pid);
  db = app.firestore();
  db.settings({ ignoreUndefinedProperties: true });
  bucket = app.storage().bucket();
});
test.afterAll(async () => { if (app) await app.delete(); });

for (const guardada of [true, false]) {
  test(`video de vida: ${guardada ? 'foto guardada que no se puede leer avisa y deja reintentar' : 'galería vacía de verdad sigue diciendo 0 y deja subir'}`, async ({ page }, info) => {
    test.setTimeout(120000);
    const id = 'e2e_98_video_' + process.pid + '_' + Date.now();
    const fiesta = crearFiestaDeEstaNoche({ id });
    fiesta.videoVida = { ...fiesta.videoVida, galleryEnabled: true, photoCount: 2, photosUploaded: guardada };
    const ref = db.collection('fiestas').doc(id);
    const archivo = bucket.file(`video-vida-photos/${id}/01.png`);
    try {
      guardarFiesta(fiesta);
      await ref.set(JSON.parse(JSON.stringify(fiesta)));
      if (guardada) await archivo.save(PNG, { resumable: false, metadata: { contentType: 'image/png' } });

      await page.goto('/video-vida/' + id, { waitUntil: 'domcontentloaded' });
      const habilitados = page.locator('input[type=file]:not([disabled])');

      if (guardada) {
        await expect(page.getByText('No pudimos leer tus fotos ahora; no se perdieron. Reintentá.')).toBeVisible({ timeout: 60000 });
        await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
        await expect(page.getByText(/Tu Galería \(0 de/)).toHaveCount(0);
        await expect(habilitados).toHaveCount(0);
        // La foto sigue en Storage: el aviso no la tocó.
        expect((await archivo.exists())[0]).toBe(true);
        await info.attach('lector-error.png',{body:await page.screenshot(),contentType:'image/png'});
        await page.getByRole('button',{name:'Reintentar'}).click();
        await expect(page.getByRole('button',{name:'Reintentar'})).toBeEnabled();
        await expect(habilitados).toHaveCount(0);
        expect((await archivo.exists())[0]).toBe(true);
        // Recovery control: remove ONLY the owned fixture, then use the visible retry.
        await archivo.delete();
        await page.getByRole('button',{name:'Reintentar'}).click();
        await expect(page.getByText('Tu Galería (0 de 2)',{exact:true})).toBeVisible();
        await expect(habilitados).toHaveCount(2);
        await expect(page.getByRole('button',{name:'Reintentar'})).toHaveCount(0);
      } else {
        await expect(page.getByText('Tu Galería (0 de 2)', { exact: true })).toBeVisible({ timeout: 60000 });
        await expect(page.getByRole('button', { name: 'Reintentar' })).toHaveCount(0);
        await expect(habilitados).toHaveCount(2);
      }
      await info.attach('lector-final.png',{body:await page.screenshot(),contentType:'image/png'});
      await info.attach('lector-final.json',{body:JSON.stringify({guardada,body:await page.locator('body').innerText(),habilitados:await habilitados.count(),archivoExists:(await archivo.exists())[0]},null,2),contentType:'application/json'});
    } finally {
      if ((await archivo.exists())[0]) await archivo.delete();
      await ref.delete();
      borrarFiesta(id);
    }
  });
}
