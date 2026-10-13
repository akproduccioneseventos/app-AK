import fs from 'node:fs';
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import { chromium, devices, expect } from '@playwright/test';
import { fixtureGuard } from './110-fixture-guard.mjs';
if (process.env.AK_ENTORNO_AISLADO !== 'true' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085') throw new Error('Private QA only');
const restore = fixtureGuard(), results = [], root = 'http://127.0.0.1:3301';
const app = admin.initializeApp({ projectId: 'demo-ak-producciones' }, 'qa114-incidentes'), db = app.firestore();
for (const col of await db.listCollections()) if (!(await col.limit(1).get()).empty) throw new Error('Empty owned emulator required');
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of ['desktop', 'mobile']) {
    const context = await browser.newContext(viewport === 'mobile' ? devices['Pixel 7'] : { viewport: { width: 1440, height: 1000 } });
    await context.route(/^https:\/\//, r => r.abort('blockedbyclient'));
    await context.addInitScript(() => { localStorage.setItem('ak_session', 'true'); sessionStorage.setItem('ak_session', 'true'); });
    const p = `v1.${Date.now() + 3600000}.${crypto.randomUUID()}`;
    await context.addCookies([{ name: 'ak_session', value: `${p}.${crypto.createHmac('sha256', process.env.AK_SESSION_SECRET).update(p).digest('hex')}`, url: root, httpOnly: true, sameSite: 'Lax' }]);
    const page = await context.newPage(), fiestaId = 'qa114_incidente_' + viewport;
    let bloqueado = false;
    await context.route('**/*', r => bloqueado && r.request().headers()['next-action'] === process.env.QA_INCIDENT_ACTION ? r.abort('failed') : r.fallback());
    page.setDefaultTimeout(20000);
    const own = async () => (await db.collection('incidentes').get()).docs.filter(d => d.data().fiestaId === fiestaId).map(d => d.data());
    const r = { viewport, name: 'incidente-nuevo-y-borrador-fallido', status: 'NOT_ACCEPTED' };
    try {
      await page.goto(root + '/incidentes?fiestaId=' + fiestaId, { waitUntil: 'networkidle', timeout: 60000 });
      await page.getByRole('button', { name: 'Nueva Incidencia', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByPlaceholder('Título del incidente').fill('QA114 Incidente A');
      await dialog.getByPlaceholder('Describí el incidente...').fill('QA114 Detalle A');
      await dialog.getByPlaceholder('Nombre del responsable').fill('QA114 Operador');
      bloqueado = true;
      await dialog.getByRole('button', { name: 'Registrar Incidente', exact: true }).click();
      await expect(page.getByText('Error al guardar', { exact: true })).toBeVisible();
      await expect(dialog.getByPlaceholder('Título del incidente')).toHaveValue('QA114 Incidente A');
      expect((await own()).length).toBe(0);
      bloqueado = false;
      await dialog.getByRole('button', { name: 'Registrar Incidente', exact: true }).click();
      await expect(dialog).not.toBeVisible();
      expect((await own()).length).toBe(1);
      await page.getByRole('button', { name: 'Nueva Incidencia', exact: true }).click();
      await expect(dialog.getByPlaceholder('Título del incidente')).toHaveValue('');
      await expect(dialog.getByPlaceholder('Describí el incidente...')).toHaveValue('');
      await expect(dialog.getByPlaceholder('fiesta_1234...')).toHaveValue(fiestaId);
      await expect(dialog.getByPlaceholder('Nombre del responsable')).toHaveValue('QA114 Operador');
      await dialog.getByPlaceholder('Título del incidente').fill('QA114 Incidente B');
      await dialog.getByPlaceholder('Describí el incidente...').fill('QA114 Detalle B');
      await dialog.getByRole('button', { name: 'Registrar Incidente', exact: true }).click();
      await expect(dialog).not.toBeVisible();
      expect((await own()).map(d => d.titulo).sort()).toEqual(['QA114 Incidente A', 'QA114 Incidente B']);
      await page.screenshot({ path: `docs/evidencias/114-incidente-${viewport}.png`, fullPage: true });
      r.status = 'PASS'; r.details = { errorDraftKept: true, contextAndResponsibleKept: true, distinctRecords: 2 };
    } catch (e) { r.error = e.message; }
    results.push(r); console.log(JSON.stringify(r));
    await context.close();
  }
} finally {
  await browser.close();
  let deleted = 0;
  for (const col of await db.listCollections()) for (const doc of (await col.get()).docs) { await doc.ref.delete(); deleted++; }
  let documentsRemaining = 0;
  for (const col of await db.listCollections()) documentsRemaining += (await col.get()).size;
  fs.writeFileSync('docs/evidencias/114-incidentes-resultado.json', JSON.stringify({ applicationSourceSha: process.env.COMMIT_SHA, results, cleanup: { deleted, documentsRemaining, ...restore() } }, null, 2));
  await app.delete();
}
if (results.some(r => r.status !== 'PASS')) process.exitCode = 1;
