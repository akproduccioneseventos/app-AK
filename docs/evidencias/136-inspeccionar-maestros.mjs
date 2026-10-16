import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const record = JSON.parse(fs.readFileSync(path.join(root, 'docs/evidencias/135-entorno.json')));
const require = createRequire(path.join(record.qa, 'package.json'));
const { chromium } = require('@playwright/test');
const browser = await chromium.launch({ headless: true });
const rows = [];
const commercial = process.argv[2]?.startsWith('comercial');
const forms = process.argv[2] === 'comercial-forms';
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === 'firebaseinstallations.googleapis.com') return route.fulfill({ status: 200,
      contentType: 'application/json', body: JSON.stringify({ fid: 'cQA136localinstallation00', refreshToken: 'synthetic',
        authToken: { token: 'synthetic', expiresIn: '604800s' }, token: 'synthetic', expiresIn: '604800s' }) });
    return ['127.0.0.1','localhost'].includes(url.hostname) || ['blob:','data:'].includes(url.protocol)
      ? route.continue() : route.abort('blockedbyclient');
  });
  await context.addInitScript(() => {
    localStorage.setItem('ak_session', 'true'); sessionStorage.setItem('ak_session', 'true');
    Reflect.deleteProperty(Navigator.prototype, 'serviceWorker');
  });
  const payload = `v1.${Date.now() + 600_000}.${crypto.randomUUID()}`;
  await context.addCookies([{ name: 'ak_session', value: `${payload}.${crypto.createHmac('sha256',
    'playwright-session-secret-with-enough-entropy').update(payload).digest('hex')}`,
    url: 'http://127.0.0.1:3300', httpOnly: true, sameSite: 'Lax' }]);
  const page = await context.newPage();
  for (const route of commercial ? ['/empresa/crm','/contabilidad/crm/agenda']
    : ['/empresa/servicios/nuevo','/proveedores/new','/empleados/nuevo','/empresa/activos-fijos/nuevo']) {
    await page.goto(`http://127.0.0.1:3300${route}`, { waitUntil: 'networkidle' });
    if (forms) {
      await page.getByText(route === '/empresa/crm' ? 'Añadir Prospecto' : 'Agendar Nueva Reunión', { exact: true }).click();
      await page.waitForLoadState('networkidle');
    }
    rows.push({ route, url: page.url(), body: (await page.locator('body').innerText()).slice(0, 16000),
      fields: await page.locator('input,select,textarea,button[role=combobox]').evaluateAll((nodes) => nodes.map((el) => ({
        tag: el.tagName, type: el.getAttribute('type'), name: el.getAttribute('name'), id: el.id,
        placeholder: el.getAttribute('placeholder'), text: el.textContent, value: el.value,
      }))) });
  }
  await context.close();
} finally { await browser.close(); }
fs.writeFileSync(path.join(root, `docs/evidencias/136-${commercial ? forms ? 'comercial-formularios' : 'comercial' : 'maestros'}-inspeccion.json`), JSON.stringify({
  source: record.sourceSha, scope: 'Form inspection only; not workflow acceptance', rows,
}, null, 2) + '\n');
console.log(JSON.stringify(rows.map(({ route, body, fields }) => ({ route, body: body.slice(-9500), fields }))));
