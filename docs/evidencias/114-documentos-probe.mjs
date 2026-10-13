import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import { request, chromium, expect } from '@playwright/test';
import { jsPDF } from 'jspdf';
import { fixtureGuard } from './110-fixture-guard.mjs';
if (process.env.AK_ENTORNO_AISLADO !== 'true' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085') throw new Error('Private QA only');
const restore = fixtureGuard(), root = 'http://127.0.0.1:3301', results = [];
const filename = `qa114-${crypto.randomUUID()}.pdf`, evento = 'qa114_documento';
const pdf = new jsPDF(); pdf.text('QA114 Documento ficticio ajeno', 10, 20);
const bytes = Buffer.from(pdf.output('arraybuffer'));
const targets = ['employee-contracts', 'contracts', 'payment-proofs', 'budgets', 'salon-contracts', 'contracts/fiestas/' + evento];
const app = admin.initializeApp({ projectId: 'demo-ak-producciones' }, 'qa114-documentos'), db = app.firestore();
for (const col of await db.listCollections()) if (!(await col.limit(1).get()).empty) throw new Error('Empty owned emulator required');
const browser = await chromium.launch({ headless: true });
function cookie(perfil, expired = false) {
  const user = { email: 'qa114@example.invalid', userId: 'qa114', role: perfil === 'dueno' ? 'admin' : 'user', perfil };
  const payload = `v1.${Date.now() + (expired ? -60000 : 3600000)}.${crypto.randomUUID()}.${encodeURIComponent(JSON.stringify(user))}`;
  const token = `${payload}.${crypto.createHmac('sha256', process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`;
  return { name: 'ak_session', value: encodeURIComponent(token), domain: '127.0.0.1', path: '/', expires: -1, httpOnly: true, sameSite: 'Lax', secure: false };
}
try {
  for (const target of targets) {
    const folder = path.resolve('src/data', target), file = path.join(folder, filename);
    if (!folder.startsWith(path.resolve('src/data') + path.sep)) throw new Error('Unsafe fixture path');
    fs.mkdirSync(folder, { recursive: true }); fs.writeFileSync(file, bytes, { flag: 'wx' });
  }
  for (const perfil of ['dueno', 'secretaria', 'operador', 'personal', 'cliente', 'invitado', 'prospecto', 'anonimo', 'vencido', 'firma-alterada']) {
    let signed = cookie(perfil === 'vencido' || perfil === 'firma-alterada' ? 'dueno' : perfil, perfil === 'vencido');
    if (perfil === 'firma-alterada') signed.value = signed.value.slice(0, -1) + (signed.value.endsWith('a') ? 'b' : 'a');
    const context = await request.newContext({ baseURL: root, storageState: { cookies: perfil === 'anonimo' ? [] : [signed], origins: [] } });
    try {
      for (const target of targets) {
        const response = await context.get(`/api/${target}/${filename}`, { maxRedirects: 0 });
        const body = await response.body();
        const expected = ['anonimo', 'vencido', 'firma-alterada'].includes(perfil) ? 401 : perfil === 'dueno' || (perfil === 'secretaria' && target !== 'employee-contracts') ? 200 : 403;
        const accepted = response.status() === expected && (expected === 200 ? body.equals(bytes) : !body.equals(bytes));
        results.push({ case: 'documento-por-perfil', perfil, target, expected, actual: response.status(), identicalBytes: body.equals(bytes), status: accepted ? 'PASS' : 'FAIL' });
      }
    } finally { await context.dispose(); }
  }
  await db.collection('clientes').doc('qa114_cliente').set({ id: 'qa114_cliente', name: 'QA114 Cliente', phone: '000000000', eventType: 'Boda', contractFileName: filename, budgetFileName: filename, salonContractFileName: filename });
  await db.collection('empleados').doc('qa114_empleado').set({ id: 'qa114_empleado', nombre: 'QA114 Empleado', cedula: '00000000', rolIds: [], contractFileName: filename });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addCookies([cookie('dueno')]);
  await context.addInitScript(() => { localStorage.setItem('ak_session', 'true'); sessionStorage.setItem('ak_session', 'true'); });
  await context.route(/^https:\/\//, route => route.abort('blockedbyclient'));
  const delivered = new Map();
  await context.route('**/api/**', async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (!pathname.endsWith('/' + filename)) return route.fallback();
    // Chrome's PDF viewer does not expose its response body through CDP.
    const response = await route.fetch({ maxRedirects: 0 });
    const body = await response.body();
    delivered.set(pathname, { status: response.status(), identicalBytes: body.equals(bytes), sha256: crypto.createHash('sha256').update(body).digest('hex') });
    await route.fulfill({ response, body });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  for (const [url, target] of [['/customers/qa114_cliente', 'contracts'], ['/customers/qa114_cliente', 'budgets'], ['/customers/qa114_cliente', 'salon-contracts'], ['/empleados/qa114_empleado/editar', 'employee-contracts']]) {
    const r = { case: 'enlace-real-consumidor', url, target, status: 'NOT_ACCEPTED' };
    try {
      await page.goto(root + url, { waitUntil: 'networkidle', timeout: 60000 });
      const href = `/api/${target}/${filename}`;
      const link = page.locator(`a[href="${href}"]`);
      await expect(link).toBeVisible();
      const responsePromise = context.waitForEvent('response', { predicate: response => new URL(response.url()).pathname === href, timeout: 30000 });
      await link.click();
      const response = await responsePromise;
      expect(response.status()).toBe(200); expect(delivered.get(href)?.identicalBytes).toBe(true);
      expect(delivered.get(href)?.status).toBe(200);
      for (const tab of context.pages()) if (tab !== page) await tab.close();
      r.status = 'PASS'; r.actualLink = href; r.actualResponse = delivered.get(href);
    } catch (e) { r.error = e.message; }
    results.push(r);
  }
  await context.close();
} finally {
  await browser.close();
  for (const col of await db.listCollections()) for (const doc of (await col.get()).docs) await doc.ref.delete();
  fs.writeFileSync('docs/evidencias/114-documentos-resultado.json', JSON.stringify({ applicationSourceSha: process.env.COMMIT_SHA, fixtureSha256: crypto.createHash('sha256').update(bytes).digest('hex'), results, cleanup: restore() }, null, 2));
  await app.delete();
}
console.log(JSON.stringify({ passed: results.filter(r => r.status === 'PASS').length, failed: results.filter(r => r.status !== 'PASS') }));
if (results.some(r => r.status !== 'PASS')) process.exitCode = 1;
