import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import JSZip from 'jszip';
import sharp from 'sharp';
import { chromium, devices, expect } from '@playwright/test';
import { fixtureGuard } from './110-fixture-guard.mjs';
if (process.env.AK_ENTORNO_AISLADO !== 'true' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085') throw new Error('Private demo only');
const restore = fixtureGuard(), results = [], root = 'http://127.0.0.1:3301';
const app = admin.initializeApp({ projectId: 'demo-ak-producciones' }, 'qa115'), db = app.firestore();
db.settings({ ignoreUndefinedProperties: true });
for (const col of await db.listCollections()) if (!(await col.limit(1).get()).empty) throw new Error('Empty owned emulator required');
const browser = await chromium.launch({ headless: true }), ids = JSON.parse(process.env.QA_ACTION_IDS);
async function record(viewport, name, fn) {
  const result = { viewport, name };
  try { result.details = await fn(); result.status = 'PASS'; }
  catch (error) { result.status = 'NOT_ACCEPTED'; result.error = error.message; }
  results.push(result); console.log(JSON.stringify(result));
}
const account = status => ({ id: 'qa115-company', kind: 'company', email: 'qa115@example.invalid', accessToken: '', calendarId: 'primary', status, lastError: status === 'connected' ? undefined : 'QA115 permiso retirado', connectedAt: '2026-10-12T10:00:00Z', updatedAt: '2026-10-12T10:00:00Z' });
try {
  // Vaciar solo arrays de esta copia de QA: no mostrar clientes historicos en las capturas.
  function isolateArrays(folder) {
    if (!fs.existsSync(folder)) return;
    for (const item of fs.readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, item.name);
      if (item.isDirectory()) isolateArrays(file);
      else if (item.name.endsWith('.json')) {
        try { if (Array.isArray(JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')))) fs.writeFileSync(file, '[]\n'); } catch { /* Leave unknown fixtures untouched. */ }
      }
    }
  }
  isolateArrays('src/data'); isolateArrays('data');
  for (const format of ['png', 'jpeg', 'webp', 'avif']) await record('native-windows', 'sharp-' + format + '-decode-resize', async () => {
    const buffer = await sharp({ create: { width: 600, height: 400, channels: 3, background: '#e12635' } }).toFormat(format).toBuffer();
    const metadata = await sharp(buffer).resize(150).toBuffer({ resolveWithObject: true });
    expect(metadata.info.width).toBe(150); expect(metadata.info.height).toBe(100);
    return { width: metadata.info.width, height: metadata.info.height, versions: sharp.versions };
  });
  await db.collection('empleados').doc('qa115-1').set({ id: 'qa115-1', nombre: 'QA115 Uno' });
  await db.collection('empleados').doc('qa115-2').set({ id: 'qa115-2', nombre: 'QA115 Dos' });
  for (const [id, status] of [['qa115-a', 'connected'], ['qa115-b', 'error']]) await db.collection('google_workspace_accounts').doc(id).set({ ...account(status), id, kind: 'employee', employeeId: id, email: id + '@example.invalid' });
  for (const viewport of ['desktop', 'mobile']) {
    const context = await browser.newContext(viewport === 'mobile' ? devices['Pixel 7'] : { viewport: { width: 1440, height: 1000 } });
    await context.route(/^https:\/\//, route => route.abort('blockedbyclient'));
    await context.addInitScript(() => { localStorage.setItem('ak_session', 'true'); sessionStorage.setItem('ak_session', 'true'); });
    const payload = `v1.${Date.now() + 3600000}.${crypto.randomUUID()}`;
    await context.addCookies([{ name: 'ak_session', value: `${payload}.${crypto.createHmac('sha256', process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`, url: root, httpOnly: true, sameSite: 'Lax' }]);
    const page = await context.newPage(); page.setDefaultTimeout(20000);
    let faultId = null, blocked = 0, loseCostResponse = false, costAck = null;
    await context.route('**/*', async route => {
      const id = route.request().headers()['next-action'];
      if (id && id === faultId) { blocked++; return route.abort('failed'); }
      if (loseCostResponse && id === ids.adjustAllInsumoCosts) {
        loseCostResponse = false; const response = await route.fetch(); await response.body(); costAck = response.status(); return route.abort('failed');
      }
      return route.fallback();
    });
    const go = path => page.goto(root + path, { waitUntil: 'networkidle', timeout: 90000 });
    await record(viewport, 'next-image-optimizer-uses-patched-native-sharp', async () => {
      const response = await context.request.get(root + '/_next/image?url=%2Flogo_ak_producciones.png&w=256&q=75', { headers: { Accept: 'image/webp' }, timeout: 60000 });
      expect(response.status()).toBe(200);
      const buffer = await response.body(), metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBeGreaterThan(0); expect(metadata.width).toBeLessThanOrEqual(256);
      expect(metadata.format).toBe('webp');
      await go('/simulador-ak');
      const logo = page.getByRole('img', { name: 'AK Producciones', exact: true }).first();
      await expect(logo).toBeVisible();
      await expect.poll(() => logo.evaluate(img => img.complete && img.naturalWidth > 0 && getComputedStyle(img).opacity === '1')).toBe(true);
      const rendered = await logo.evaluate(img => ({ src: img.currentSrc, width: img.naturalWidth, height: img.naturalHeight }));
      expect(rendered.src).toContain('logo_ak_producciones.png');
      await page.screenshot({ path: `docs/evidencias/115-logo-simulador-${viewport}.png`, fullPage: true });
      return { status: response.status(), width: metadata.width, height: metadata.height, format: metadata.format, actualNextImageEndpoint: true, actualConsumer: '/simulador-ak', rendered };
    });
    for (const [path, action, error, retry] of [
      ['/control-tower', 'getControlTowerData', 'No se pudieron cargar las prioridades', 'Reintentar'],
      ['/control-tower/preparacion', 'getAllFiestasPreparationScores', 'No se pudieron cargar las fiestas', 'Reintentar'],
      ['/control-tower/comercial', 'getCommercialFollowups', 'No se pudieron cargar los seguimientos', 'Reintentar'],
      ['/control-tower/post-fiesta', 'getPostEventOpportunities', 'No se pudieron cargar las fiestas', 'Reintentar'],
      ['/settings/sincronizaciones', 'getEstadoConexiones', 'No se pudieron actualizar las conexiones', 'Reintentar'],
      ['/empresa/redes-sociales', 'getSocialPosts', 'No se pudieron cargar los datos', 'Reintentar lectura'],
      ['/settings/google-workspace', 'getGoogleWorkspaceDashboard', 'No se pudo consultar el estado de Google', 'Reintentar'],
    ]) await record(viewport, action + '-transport-failure-and-retry', async () => {
      faultId = ids[action]; blocked = 0;
      await go(path); await expect(page.getByRole('alert').filter({ hasText: error }).first()).toBeVisible();
      expect(blocked).toBeGreaterThan(0); const failedText = await page.locator('body').innerText();
      if (path === '/control-tower') expect(failedText).not.toContain('Todo tranquilo por ahora');
      if (path === '/control-tower/preparacion') expect(failedText).not.toContain('No hay fiestas para revisar');
      await page.screenshot({ path: `docs/evidencias/115-${action}-${viewport}-failure.png`, fullPage: true });
      faultId = null; await page.getByRole('button', { name: retry, exact: true }).click();
      await expect(page.getByRole('alert').filter({ hasText: error })).toHaveCount(0, { timeout: 45000 });
      await page.waitForLoadState('networkidle'); return { blocked, retryUsed: true, actualConsumer: path };
    });
    faultId = null;
    for (const status of ['needs_reconnect', 'error', 'connected']) await record(viewport, 'google-' + status + '-visible-status-and-staff-count', async () => {
      await db.collection('google_workspace_accounts').doc('qa115-company').set(account(status));
      await go('/settings/google-workspace?fiestaId=qa115-fiesta');
      await expect(page.getByText('1/2', { exact: true })).toBeVisible();
      await expect(page.getByText('qa115-b@example.invalid', { exact: true })).toBeVisible();
      const button = page.getByRole('button', { name: 'Sincronizar fiestas', exact: true });
      if (status === 'connected') await expect(button).toBeEnabled(); else { await expect(button).toBeDisabled(); await expect(page.getByText('QA115 permiso retirado', { exact: true }).first()).toBeVisible(); }
      await page.screenshot({ path: `docs/evidencias/115-google-${status}-${viewport}.png`, fullPage: true });
      return { status, onlyConnectedStaffCounted: 1, companySyncEnabled: await button.isEnabled(), noOAuthOrMessagesSent: true };
    });
    await record(viewport, 'last-supplier-does-not-return-after-delete-and-reload', async () => {
      const name = 'QA115 Proveedor ' + viewport, ref = db.collection('proveedores').doc('qa115-provider');
      await ref.set({ id: ref.id, nombre: name, tipo: 'Proveedor' });
      await go('/proveedores'); await page.getByRole('button', { name: 'Eliminar ' + name, exact: true }).click();
      await page.getByRole('alertdialog').getByRole('button', { name: /eliminar|confirmar/i }).click();
      await expect.poll(async () => (await ref.get()).exists).toBe(false);
      await go('/proveedores'); await expect(page.getByText(name, { exact: true })).toHaveCount(0);
      return { nativeDocumentDeleted: true, doesNotReturnAfterReload: true };
    });
    await record(viewport, 'last-custom-invitation-is-deleted-without-deleting-builtins', async () => {
      const name = 'QA115 Invitacion ' + viewport, ref = db.collection('invitacion_digital_templates').doc('qa115-template');
      await ref.set({ id: ref.id, name, category: 'XV', plantilla: 'grazia', cabecera: {} });
      await go('/settings/templates/invitaciones');
      const row = page.getByText(name, { exact: true }).locator('xpath=../../..');
      await row.getByTitle('Eliminar', { exact: true }).click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar', exact: true }).click();
      await expect.poll(async () => (await ref.get()).exists).toBe(false);
      await go('/settings/templates/invitaciones'); await expect(page.getByText(name, { exact: true })).toHaveCount(0);
      const builtin = page.getByText('Grazia Base', { exact: true }).locator('xpath=../../..');
      await builtin.getByTitle('Eliminar', { exact: true }).click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar', exact: true }).click();
      await expect(page.getByText('Las plantillas incorporadas no se pueden eliminar.', { exact: true })).toBeVisible();
      await expect(page.getByText('Grazia Base', { exact: true })).toBeVisible();
      return { nativeDocumentDeleted: true, builtinCatalogUnchanged: true };
    });
    await record(viewport, 'costs-export-restore-and-lost-ack-retry-preserve-idempotence', async () => {
      const ref = db.collection('insumos').doc('qa115-carne');
      await ref.set({ id: ref.id, nombre: 'QA115 Carne', categoria: 'Carnes', unidad: 'kg', valorUnitarioEstimado: 100, cantidadDisponible: 2 });
      await go('/empresa/insumos');
      const adjust = async () => { await page.locator('#cost-percentage-adjust').fill('10'); await page.getByRole('button', { name: 'Ajustar Costos', exact: true }).click(); await page.getByRole('alertdialog').getByRole('button', { name: 'Aplicar ajuste del +10%', exact: true }).click(); };
      loseCostResponse = true; await adjust(); await expect(page.getByText('Error al ajustar costos', { exact: true })).toBeVisible();
      expect(costAck).toBe(200); expect((await ref.get()).data().valorUnitarioEstimado).toBe(110);
      const download = await context.request.get(root + '/api/backup/download', { timeout: 90000 }); expect(download.status()).toBe(200);
      const zip = await JSZip.loadAsync(await download.body());
      const ledger = JSON.parse(await zip.file('ajustes-costos-insumos.json').async('string'));
      expect(ledger.some(item => item.id && item.terminado && item.porcentaje === 10)).toBe(true);
      const own = new JSZip(); own.file('insumos.json', await zip.file('insumos.json').async('string')); own.file('ajustes-costos-insumos.json', JSON.stringify(ledger));
      await ref.update({ valorUnitarioEstimado: 999 });
      for (const doc of (await db.collection('ajustes_costos_insumos').get()).docs) await doc.ref.delete();
      const upload = await context.request.post(root + '/api/backup/upload', { multipart: { backupFile: { name: 'qa115-costs.zip', mimeType: 'application/zip', buffer: await own.generateAsync({ type: 'nodebuffer' }) } }, timeout: 90000 });
      expect(upload.status()).toBe(200); expect((await upload.json()).completo).toBe(true);
      expect((await ref.get()).data().valorUnitarioEstimado).toBe(110);
      await adjust(); await expect(page.getByText('Costos de Insumos Ajustados', { exact: true })).toBeVisible();
      expect((await ref.get()).data().valorUnitarioEstimado).toBe(110);
      expect((await ref.get()).data().cantidadDisponible).toBe(2);
      return { costBefore: 100, costAfter: 110, restoredCost: 110, afterRetry: 110, receiptIDs: ledger.map(item => item.id), stock: (await ref.get()).data().cantidadDisponible };
    });
    await record(viewport, 'legacy-pending-receipt-and-turn-restore-and-resume-without-second-percentage', async () => {
      const operation = crypto.randomUUID(), id = crypto.createHash('sha256').update(operation).digest('hex');
      const book = db.collection('ajustes_costos_insumos'), ingredient = db.collection('insumos').doc('qa115-carne');
      const before = (await ingredient.get()).data().valorUnitarioEstimado;
      try {
        await book.doc(id).set({ porcentaje: 10, ids: [ingredient.id], terminado: false });
        await book.doc('_turno').set({ operacion: id, porcentaje: 10 });
        const response = await context.request.get(root + '/api/backup/download', { timeout: 90000 }); expect(response.status()).toBe(200);
        const exported = await JSZip.loadAsync(await response.body());
        const ledger = JSON.parse(await exported.file('ajustes-costos-insumos.json').async('string'));
        expect(ledger.find(item => item.id === id).terminado).toBe(false);
        expect(ledger.find(item => item.id === '_turno').operacion).toBe(id);
        const zip = new JSZip(); zip.file('insumos.json', await exported.file('insumos.json').async('string')); zip.file('ajustes-costos-insumos.json', JSON.stringify(ledger));
        await book.doc(id).delete(); await book.doc('_turno').delete();
        const restored = await context.request.post(root + '/api/backup/upload', { multipart: { backupFile: { name: 'qa115-pending.zip', mimeType: 'application/zip', buffer: await zip.generateAsync({ type: 'nodebuffer' }) } }, timeout: 90000 });
        expect((await restored.json()).completo).toBe(true);
        const resumed = await context.request.post(root + '/empresa/insumos', { data: JSON.stringify([10, operation]), headers: { 'Next-Action': ids.adjustAllInsumoCosts, 'Content-Type': 'text/plain;charset=UTF-8', Origin: root }, timeout: 90000 });
        expect(resumed.status()).toBe(200);
        expect((await book.doc(id).get()).data().terminado).toBe(true);
        expect((await book.doc('_turno').get()).exists).toBe(false);
        expect((await ingredient.get()).data().valorUnitarioEstimado).toBe(before);
        return { actualCompiledActionUsed: true, pendingReceiptId: id, sharedTurnPreserved: true, resumed: true, costBefore: before, costAfter: before };
      } finally { await book.doc(id).delete(); await book.doc('_turno').delete(); }
    });
    await context.close();
  }
} finally {
  await browser.close(); let deleted = 0;
  for (const col of await db.listCollections()) for (const doc of (await col.get()).docs) { await doc.ref.delete(); deleted++; }
  let documentsRemaining = 0; for (const col of await db.listCollections()) documentsRemaining += (await col.get()).size;
  fs.writeFileSync('docs/evidencias/115-native-resultado.json', JSON.stringify({ applicationSourceSha: process.env.COMMIT_SHA, results, cleanup: { deleted, documentsRemaining, ...restore() } }, null, 2) + '\n');
  await app.delete();
}
if (results.length !== 34 || results.some(result => result.status !== 'PASS')) process.exitCode = 1;
