// @ts-nocheck -- evidencia de Codex pensada para copiarse a tests/e2e; no es código de la app.
// Copy to tests/e2e in the disposable checkout; never seed production.
import { test, expect } from '@playwright/test';
import admin from 'firebase-admin';
import { guardarFiesta, borrarFiesta, crearFiestaDeEstaNoche, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085'
  || process.env.FIREBASE_PROJECT_ID !== 'demo-ak-producciones') {
  throw new Error('These probes require the local demo emulator.');
}
const app = admin.initializeApp({ projectId: 'demo-ak-producciones' }, `audit81-${process.pid}`);
const db = app.firestore();
const ids: string[] = [];
test.afterAll(async () => {
  for (const id of ids) {
    const posts = await db.collection('social_gallery_posts').where('fiestaId', '==', id).get();
    await Promise.all(posts.docs.map((doc) => doc.ref.delete()));
    borrarFiesta(id);
  }
  await app.delete();
});

test('approved emulator posts render in the real wall mosaic', async ({ page, context }, info) => {
  const id = `e2e_audit81_mosaic_${Date.now()}`;
  ids.push(id);
  const fiesta = crearFiestaDeEstaNoche({ id });
  fiesta.socialGallerySettings = { ...fiesta.socialGallerySettings, enabled: true,
    currentLayout: 'masonry', tamanoFotosMosaico: 'grande' } as any;
  guardarFiesta(fiesta);
  await Promise.all(Array.from({ length: 10 }, (_, i) => db.collection('social_gallery_posts')
    .doc(`${id}_${i}`).set({ id: `${id}_${i}`, fiestaId: id, authorName: `Audit ${i}`,
      imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500',
      timestamp: new Date().toISOString(), approved: true, moderationStatus: 'approved',
      mediaType: 'image', caption: `Audit photograph ${i}`, likes: 0 })));
  await ponerSesionDelEquipo(context, info.project.use.baseURL as string);
  await page.goto(`/evento/muro-en-vivo/${id}`);
  await expect(page.locator('.ak-live-stage')).toHaveAttribute('data-tamano-mosaico', 'grande');
  await expect(page.locator('.ak-live-stage article')).toHaveCount(4);
  await page.screenshot({ path: `81-mosaico-${info.project.name}.png` });
  fiesta.socialGallerySettings.tamanoFotosMosaico = 'chica';
  guardarFiesta(fiesta);
  await page.reload();
  await expect(page.locator('.ak-live-stage')).toHaveAttribute('data-tamano-mosaico', 'chica');
  await expect.poll(() => page.locator('.ak-live-stage article').count()).toBeGreaterThan(4);
});

test('slideshow visibly changes the author at the configured interval', async ({ page, context }, info) => {
  const id = `e2e_audit81_rotation_${Date.now()}`;
  ids.push(id);
  const fiesta = crearFiestaDeEstaNoche({ id });
  fiesta.socialGallerySettings = { ...fiesta.socialGallerySettings, enabled: true,
    currentLayout: 'slideshow', segundosPorFoto: 3 } as any;
  guardarFiesta(fiesta);
  await Promise.all(Array.from({ length: 3 }, (_, i) => db.collection('social_gallery_posts')
    .doc(`${id}_${i}`).set({ id: `${id}_${i}`, fiestaId: id, authorName: `Rotate ${i}`,
      imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500',
      timestamp: new Date(Date.now() + i * 1000).toISOString(), approved: true,
      moderationStatus: 'approved', mediaType: 'image', caption: `Rotation ${i}`, likes: 0 })));
  await ponerSesionDelEquipo(context, info.project.use.baseURL as string);
  await page.goto(`/evento/muro-en-vivo/${id}`);
  const author = page.locator('.ak-live-stage').getByText(/Rotate \d/).first();
  await expect(author).toBeVisible();
  const initial = await author.innerText();
  await expect.poll(() => author.innerText(), { timeout: 6500 }).not.toBe(initial);
  await page.screenshot({ path: `81-rotacion-${info.project.name}.png` });
});

test('guest photo receives acknowledgement and is stored in the emulator', async ({ page }, info) => {
  const id = `e2e_audit81_upload_${Date.now()}`;
  ids.push(id);
  const fiesta = crearFiestaDeEstaNoche({ id });
  fiesta.socialGallerySettings = { ...fiesta.socialGallerySettings, enabled: true,
    uploadsActive: true, requireApproval: false };
  guardarFiesta(fiesta);
  await page.goto(`/evento/social/${id}?guestId=inv_prueba_0&token=token-prueba-0`);
  await page.getByText(/Qué querés compartir/i).first().click();
  // A detailed, normally lit bitmap; unlike the legacy 1px photo it can pass quality checks.
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    for (let y = 0; y < 128; y += 8) for (let x = 0; x < 128; x += 8) {
      ctx.fillStyle = (x + y) % 16 === 0 ? '#398fca' : '#de7594';
      ctx.fillRect(x, y, 8, 8);
    }
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'audit-pattern.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await page.getByRole('button', { name: /^Publicar/i }).first().click();
  await expect(page.getByText(/Momento enviado|Momento publicado/i).first()).toBeVisible();
  await expect.poll(async () => (await db.collection('social_gallery_posts')
    .where('fiestaId', '==', id).get()).size).toBe(1);
  const post = (await db.collection('social_gallery_posts').where('fiestaId', '==', id).get()).docs[0].data();
  expect(post.imageUrl).toBeTruthy();
  const image = await page.request.get(post.imageUrl);
  expect(image.ok()).toBe(true);
  expect((await image.body()).length).toBeGreaterThan(100);
  await page.screenshot({ path: `81-subida-${info.project.name}.png` });
});
