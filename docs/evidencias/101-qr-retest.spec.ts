// @ts-nocheck -- isolated browser audit, never production fixtures.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import admin from 'firebase-admin';
import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';
if (process.env.AK_ENTORNO_AISLADO !== 'true' || path.basename(process.cwd()) !== 'ak-entorno-aislado-101' ||
    path.dirname(process.cwd()) !== path.join(os.tmpdir(), 'ak-codex88') || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085') throw new Error('Demo101 only');
const app = admin.initializeApp({ projectId: 'demo-ak-producciones' }, 'qr101-' + process.pid);
const db = app.firestore(); db.settings({ ignoreUndefinedProperties: true });
test.afterAll(async () => app.delete());
const cases = [
  { name: 'original94', id: 'q92rmv2yk9b9', gid: 'gq92rmv2yk9b9', token: 'qa92tokenmv2yk9b9' },
  { name: 'short', id: 'e2e_99_qr_corto_1791695521018', gid: 'g99', token: 'qa99corto' },
  { name: 'uuid', id: 'e2e_99_qr_uuid_1791695586308', gid: 'g99uuid', token: '11111111-2222-4333-8444-555555555555' },
  { name: 'production-shaped', event: 'verified_fiesta_ficticia_2026_10_11', gid: 'invitado_11111111-2222-4333-8444-555555555555', token: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' },
];
for (const c of cases) test('Downloaded QR actual reader and SDK persistence: ' + c.name, async ({ page, context, baseURL }, info) => {
  test.setTimeout(180000);
  const id = c.id || 'e2e_101_qr_' + c.event + '_' + Date.now();
  const fiesta = crearFiestaDeEstaNoche({ id });
  fiesta.invitados = [{ id: c.gid, nombre: 'Invitado ficticio auditoria 101', rsvp: 'Confirmado', categoria: 'Adulto', partySize: 2, guestAccessToken: c.token, checkedIn: false }];
  const ref = db.collection('fiestas').doc(id), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  expect((await ref.get()).exists, 'never overwrite another fixture').toBe(false);
  guardarFiesta(fiesta); await ref.set(JSON.parse(JSON.stringify(fiesta)));
  try {
    expect((await page.goto(`/invitacion/${id}/invitado/${c.gid}?token=${c.token}`, { waitUntil: 'domcontentloaded' }))?.status()).toBe(200);
    const download = page.getByRole('button', { name: /Guardar QR/ });
    await expect(download).toBeVisible({ timeout: 60000 });
    const [file] = await Promise.all([page.waitForEvent('download'), download.click()]);
    const bytes = fs.readFileSync((await file.path())!);
    const onScreen = await page.locator('#qr-guest-portal').evaluate(e => ({ width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height }));
    expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
    const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
    expect(width).toBeGreaterThan(100); expect(height).toBe(width);
    const border = await page.evaluate(async b64 => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
      const p = ctx.getImageData(0, 0, canvas.width, 4).data;
      let nonWhite = 0; for (let i = 0; i < p.length; i += 4) if (p[i] < 250 || p[i+1] < 250 || p[i+2] < 250 || p[i+3] !== 255) nonWhite++;
      return nonWhite;
    }, bytes.toString('base64'));
    expect(border).toBe(0);
    await info.attach('actual-downloaded-qr.png', { body: bytes, contentType: 'image/png' });
    await ponerSesionDelEquipo(context, baseURL); await enchufarCamaraFalsa(page);
    await page.goto('/evento/accesos/' + id, { waitUntil: 'domcontentloaded' });
    const change = page.locator('#html5-qrcode-anchor-scan-type-change');
    await expect(change).toBeVisible({ timeout: 60000 }); await change.click();
    const input = page.locator('#qr-acceso-reader input[type=file]');
    const payload = { name: 'actual-download.png', mimeType: 'image/png', buffer: bytes };
    await input.setInputFiles(payload);
    await expect(page.getByText(/ACCESO PERMITIDO/)).toBeVisible({ timeout: 45000 });
    await expect.poll(async () => (await ref.get()).data()?.invitados?.[0]?.checkedIn, { timeout: 30000 }).toBe(true);
    const first = (await ref.get()).data().invitados[0]; expect(first.checkInTimestamp).toBeTruthy();
    await info.attach('reader-first.png', { body: await page.screenshot(), contentType: 'image/png' });
    await page.waitForTimeout(7000); await input.setInputFiles([]); await input.setInputFiles(payload);
    await expect(page.getByText(/Este QR ya fue utilizado anteriormente/)).toBeVisible({ timeout: 30000 });
    const second = (await ref.get()).data().invitados[0]; expect(second.checkInTimestamp).toBe(first.checkInTimestamp);
    expect(second.partySize).toBe(2); expect(errors).toEqual([]);
    await info.attach('sdk-after-second.json', { body: JSON.stringify({ id, first, second, bytes: bytes.length, width, height, onScreen, border, errors }, null, 2), contentType: 'application/json' });
  } finally { await ref.delete(); borrarFiesta(id); }
});
