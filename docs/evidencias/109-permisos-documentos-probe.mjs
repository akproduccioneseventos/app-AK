import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { request, chromium, devices } from '@playwright/test';
import { jsPDF } from 'jspdf';

if (process.env.AK_ENTORNO_AISLADO !== 'true') throw new Error('Isolated environment only');
const root = 'http://127.0.0.1:3300';
const marker = 'QA109_DOCUMENTO_PRIVADO_FICTICIO';
const filename = `qa109-${crypto.randomUUID()}.pdf`;
const pdf = new jsPDF();
pdf.text(marker, 10, 20);
const bytes = Buffer.from(pdf.output('arraybuffer'));
const extra = process.argv.includes('--extra');
const fileTargets = extra ? ['budgets', 'salon-contracts'] : ['employee-contracts', 'contracts', 'payment-proofs'];
const fixtures = [];
const results = [];
const contexts = [];
let browser;
function cookie(profile) {
  const user = { email: 'qa109@example.invalid', userId: 'qa109', role: profile === 'dueno' ? 'admin' : 'user', perfil: profile };
  const payload = `v1.${Date.now() + 3600000}.${crypto.randomUUID()}.${encodeURIComponent(JSON.stringify(user))}`;
  // Match ResponseCookies serialization; the request parser decodes cookie values once.
  const token = `${payload}.${crypto.createHmac('sha256', process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`;
  return { name: 'ak_session', value: encodeURIComponent(token),
    domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Lax', secure: false,
    expires: Math.floor(Date.now() / 1000) + 3600 };
}
try {
  for (const directory of fileTargets) {
    const folder = path.resolve('src/data', directory);
    const createdFolder = !fs.existsSync(folder);
    fs.mkdirSync(folder, { recursive: true });
    const file = path.join(folder, filename);
    fs.writeFileSync(file, bytes, { flag: 'wx' });
    fixtures.push({ file, folder, createdFolder });
  }
  for (const profile of ['dueno', 'secretaria', 'operador', 'personal', 'cliente', 'invitado', 'anonimo']) {
    const context = await request.newContext({ baseURL: root, storageState: { cookies: profile === 'anonimo' ? [] : [cookie(profile)], origins: [] } });
    contexts.push(context);
    for (const target of fileTargets) {
      const response = await context.get(`/api/${target}/${filename}`, { maxRedirects: 0 });
      const body = await response.body();
      results.push({ profile, target, status: response.status(), identicalFixture: body.equals(bytes),
        markerPresent: body.includes(Buffer.from(marker)), bodyBytes: body.length, contentType: response.headers()['content-type'],
        location: response.headers().location });
    }
    if (extra && profile !== 'dueno' && profile !== 'anonimo') {
      const denied = await context.get('/api/backup/download', { maxRedirects: 0 });
      results.push({ case: 'role-denial-positive-control', profile, status: denied.status(),
        deniedByProfile: denied.status() === 403, contentType: denied.headers()['content-type'] });
    }
  }
  if (!extra) {
    const imageContext = await request.newContext({ baseURL: root });
    contexts.push(imageContext);
    const image = await imageContext.get('/_next/image?url=%2Flogo_ak_producciones.png&w=64&q=75', { maxRedirects: 0 });
    results.push({ case: 'public-image-optimizer', status: image.status(), contentType: image.headers()['content-type'],
      bytes: (await image.body()).length, cache: image.headers()['x-nextjs-cache'] });
  }
  browser = await chromium.launch({ headless: true });
  for (const viewport of ['desktop', 'mobile']) {
    const context = await browser.newContext(viewport === 'mobile' ? devices['Pixel 7'] : { viewport: { width: 1440, height: 1000 } });
    await context.route(/^https:\/\//, route => route.abort('blockedbyclient'));
    await context.addCookies([{ ...cookie('operador'), expires: Math.floor(Date.now()/1000) + 3600 }]);
    await context.addInitScript(() => { localStorage.setItem('ak_session','true'); sessionStorage.setItem('ak_session','true'); });
    const page = await context.newPage();
    await page.goto(root + '/configuracion/backup-final', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(1200);
    const body = await page.locator('body').innerText();
    results.push({ case: 'restricted-profile-ui', viewport, url: page.url(),
      accessMessage: /no tienes acceso|no tiene acceso|sin acceso|no autorizado|acceso restringido/i.test(body),
      downloadLinks: await page.getByRole('link', { name: 'Descargar backup ahora', exact: true }).count() });
    await page.screenshot({ path: `docs/evidencias/109-operador-${viewport}.png`, fullPage: true });
    if (extra) {
      const responsePromise = page.waitForResponse(response => response.url().includes('/api/backup/download'));
      await page.getByRole('link', { name: 'Descargar backup ahora', exact: true }).click();
      const response = await responsePromise;
      results.push({ case: 'operator-backup-real-click', viewport, status: response.status(),
        noBackupDelivered: response.status() === 403 });
    }
    await context.close();
  }
} finally {
  for (const context of contexts) await context.dispose();
  await browser?.close();
  for (const fixture of fixtures) {
    if (!fs.readFileSync(fixture.file).equals(bytes)) throw new Error('Fixture changed; refuse to delete');
    fs.unlinkSync(fixture.file);
    if (fixture.createdFolder && fs.readdirSync(fixture.folder).length === 0) fs.rmdirSync(fixture.folder);
  }
  fs.writeFileSync(`docs/evidencias/109-permisos-documentos${extra ? '-extra' : ''}.json`, JSON.stringify({ sourceApp:'8fa5b56a2833938541a657dcd15ef88130d24b0e',
    fixture: { filename, marker, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length },
    results, fixtureCleanup: fixtures.every(fixture => !fs.existsSync(fixture.file)) }, null, 2) + '\n');
}
console.log(JSON.stringify(results));
if (!results.filter(row => row.profile === 'dueno' && row.target).every(row => row.identicalFixture)) throw new Error('Positive controls did not read fixture');
