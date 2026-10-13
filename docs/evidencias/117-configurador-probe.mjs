import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import { chromium, devices, expect } from '@playwright/test';
import { fixtureGuard } from './110-fixture-guard.mjs';
if (process.env.AK_ENTORNO_AISLADO !== 'true' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085') throw new Error('Owned demo only');
const restore = fixtureGuard(), root = 'http://127.0.0.1:3301', results = [];
const app = admin.initializeApp({ projectId: 'demo-ak-producciones' }, 'qa117'), db = app.firestore();
db.settings({ ignoreUndefinedProperties: true });
for (const col of await db.listCollections()) if (!(await col.limit(1).get()).empty) throw new Error('Empty owned emulator required');
const browser = await chromium.launch({ headless: true });
async function record(viewport, name, fn) {
  const item = { viewport, name };
  try { item.details = await fn(); item.status = 'PASS'; }
  catch (error) { item.status = 'NOT_ACCEPTED'; item.error = error.message; }
  results.push(item); console.log(JSON.stringify(item));
}
try {
  function clearArrays(folder) {
    for (const item of fs.readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, item.name);
      if (item.isDirectory()) clearArrays(file);
      else if (item.name.endsWith('.json')) {
        try { if (Array.isArray(JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')))) fs.writeFileSync(file, '[]\n'); } catch {}
      }
    }
  }
  clearArrays('src/data'); clearArrays('data');
  await db.collection('servicios').doc('qa117-dj').set({ id: 'qa117-dj', nombre: 'DJ QA117', categoria: 'Discoteca', precioBase: 1000, calculationMethod: 'fijo', activo: true });
  for (const viewport of ['desktop', 'mobile']) {
    const context = await browser.newContext(viewport === 'mobile' ? devices['Pixel 7'] : { viewport: { width: 1440, height: 1000 } });
    await context.route(/^https:\/\//, route => route.abort('blockedbyclient'));
    await context.addInitScript(() => { localStorage.setItem('ak_session', 'true'); sessionStorage.setItem('ak_session', 'true'); });
    const payload = `v1.${Date.now() + 3600000}.${crypto.randomUUID()}`;
    await context.addCookies([{ name: 'ak_session', value: `${payload}.${crypto.createHmac('sha256', process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`, url: root, httpOnly: true, sameSite: 'Lax' }]);
    const page = await context.newPage(); page.setDefaultTimeout(20000);
    let failSave = false, loseAck = false, saveRequests = 0;
    await context.route('**/*', async route => {
      if (route.request().headers()['next-action'] && route.request().postData()?.includes('QA117 Familia')) {
        saveRequests++;
        if (failSave) { failSave = false; return route.abort('failed'); }
        if (loseAck) { loseAck = false; const response = await route.fetch(); await response.body(); return route.abort('failed'); }
      }
      return route.fallback();
    });
    await page.goto(root + '/empresa/configurador-reunion', { waitUntil: 'networkidle', timeout: 90000 });
    const save = page.getByRole('button', { name: 'Guardar como Presupuesto Formal', exact: true });
    await record(viewport, 'save-control-pointer-and-keyboard-hitbox', async () => {
      await expect(save).toBeEnabled(); await save.scrollIntoViewIfNeeded();
      const hitbox = await save.evaluate(el => {
        const r = el.getBoundingClientRect(), points = [[.1,.5],[.5,.5],[.9,.5]];
        return points.map(([x,y]) => { const top = document.elementFromPoint(r.x+r.width*x,r.y+r.height*y); return { x:r.x+r.width*x,y:r.y+r.height*y,uncovered:el===top||el.contains(top),top:top?.outerHTML.slice(0,260) }; });
      });
      await save.focus(); expect(await save.evaluate(el => document.activeElement === el)).toBe(true);
      await page.screenshot({ path: `docs/evidencias/117-configurador-${viewport}.png`, fullPage: false });
      return { hitbox, fullyUncovered: hitbox.every(p=>p.uncovered), keyboardFocus: true };
    });
    await record(viewport, 'failed-save-retry-one-budget-and-destination', async () => {
      await page.getByPlaceholder('Ej. Familia Rodr\u00edguez').fill('QA117 Familia ' + viewport);
      await page.getByPlaceholder('Ej. 099 123 456').fill('099000117');
      failSave = true;
      await page.getByRole('button', { name: 'Generar Presupuesto Formal', exact: true }).click();
      await expect(page.getByText('Error inesperado', { exact: true })).toBeVisible();
      expect((await db.collection('presupuestos').get()).size).toBe(0);
      await page.getByRole('button', { name: 'Generar Presupuesto Formal', exact: true }).click();
      const destination = page.getByRole('button', { name: /^Ver Presupuesto #/ });
      await expect(destination).toBeVisible({ timeout: 60000 });
      const saved = await db.collection('presupuestos').get(); expect(saved.size).toBe(1);
      const budget = saved.docs[0]; expect(budget.data().clienteNombre).toBe('QA117 Familia ' + viewport);
      const afterSaveEnabled = await save.isEnabled();
      await destination.click(); await expect(page).toHaveURL(new RegExp('/presupuestos/' + budget.id));
      return { saveRequests, count: saved.size, destination: new URL(page.url()).pathname, afterSaveBottomButtonEnabled: afterSaveEnabled, total: budget.data().totalConDescuento };
    });
    await record(viewport, 'lost-ack-retry-does-not-create-second-budget', async () => {
      await page.goto(root + '/empresa/configurador-reunion', { waitUntil: 'networkidle', timeout: 90000 });
      await page.getByPlaceholder('Ej. Familia Rodr\u00edguez').fill('QA117 Familia ACK ' + viewport);
      await page.getByPlaceholder('Ej. 099 123 456').fill('099000117');
      loseAck = true;
      await page.getByRole('button', { name: 'Generar Presupuesto Formal', exact: true }).click();
      await expect(page.getByText('Error inesperado', { exact: true })).toBeVisible({ timeout: 60000 });
      const before = (await db.collection('presupuestos').get()).size;
      expect(before).toBe(2);
      await page.getByRole('button', { name: 'Generar Presupuesto Formal', exact: true }).click();
      await expect(page.getByRole('button', { name: /^Ver Presupuesto #/ })).toBeVisible({ timeout: 60000 });
      const after = (await db.collection('presupuestos').get()).size;
      fs.writeFileSync(`docs/evidencias/117-ack-${viewport}.json`, JSON.stringify({ before, after, expected: 2, saveRequests }, null, 2));
      expect(after).toBe(2);
      return { before, after, saveRequests };
    });
    await context.close();
    for (const col of await db.listCollections()) if (col.id !== 'servicios') for (const doc of (await col.get()).docs) await doc.ref.delete();
  }
} finally {
  await browser.close();
  for (const col of await db.listCollections()) for (const doc of (await col.get()).docs) await doc.ref.delete();
  const cleanup = restore(); await app.delete();
  fs.writeFileSync('docs/evidencias/117-configurador-resultados.json', JSON.stringify({ applicationSourceSha: process.env.COMMIT_SHA, results, cleanup }, null, 2)+'\n');
}
if (results.some(r => r.status !== 'PASS')) process.exitCode = 1;
