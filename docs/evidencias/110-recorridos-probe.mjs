import fs from 'node:fs';
import crypto from 'node:crypto';
import { chromium, devices } from '@playwright/test';
import { fixtureGuard } from './110-fixture-guard.mjs';

if (process.env.AK_ENTORNO_AISLADO !== 'true') throw new Error('Isolated environment only');
const root = 'http://127.0.0.1:3300';
const paths = ['/proveedores', '/proveedores/new', '/perfil', '/settings/account',
  '/settings/task-templates', '/settings/templates', '/settings/templates/contrato',
  '/settings/templates/invitaciones', '/settings/templates/reuniones',
  '/control-tower', '/marketing', '/presentacion-led/portafolio'].filter(path => !process.argv.includes('--retry') || /^\/(perfil|settings)/.test(path));
const results = [];
const restore = fixtureGuard();
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of ['desktop', 'mobile']) {
    const context = await browser.newContext(viewport === 'mobile' ? devices['Pixel 7'] : { viewport: { width: 1440, height: 1000 } });
    await context.route(/^https:\/\//, route => route.abort('blockedbyclient'));
    const user = { email: 'qa110@example.invalid', userId: 'qa110', role: 'admin', perfil: 'dueno' };
    const payload = `v1.${Date.now()+3600000}.${crypto.randomUUID()}.${encodeURIComponent(JSON.stringify(user))}`;
    const token = `${payload}.${crypto.createHmac('sha256', process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`;
    await context.addCookies([{ name: 'ak_session', value: encodeURIComponent(token), url: root, httpOnly: true, sameSite: 'Lax' }]);
    await context.addInitScript(() => { localStorage.setItem('ak_session','true'); sessionStorage.setItem('ak_session','true'); });
    const page = await context.newPage();
    for (const path of paths) {
      const item = { viewport, path, errors: [], requests: [], failedRequests: [] };
      const onError = error => item.errors.push(error.message);
      const onRequest = request => { if (request.headers()['next-action']) item.requests.push({ url: request.url(), action: request.headers()['next-action'] }); };
      const onFailed = request => item.failedRequests.push({url:request.url(),reason:request.failure()?.errorText});
      page.on('pageerror', onError); page.on('request', onRequest); page.on('requestfailed',onFailed);
      try {
        const response = await page.goto(root+path, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(500);
        Object.assign(item, { status: response.status(), url: page.url(), body: await page.locator('main').count() ? await page.locator('main').last().innerText() : await page.locator('body').innerText(),
          controls: await page.locator('main a,main button,main input,main textarea,main select').evaluateAll(nodes => nodes.map(n => ({ tag: n.tagName, text: n.textContent.trim(), href: n.getAttribute('href'), label: n.getAttribute('aria-label'), name: n.getAttribute('name'), placeholder: n.getAttribute('placeholder'), disabled: !!n.disabled, value: n.value }))),
          horizontalOverflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth+2) });
      } catch (error) { item.probeError = error.message; }
      results.push(item);
      page.removeListener('pageerror', onError); page.removeListener('request', onRequest); page.removeListener('requestfailed',onFailed);
      console.log(JSON.stringify({viewport,path,status:item.status,probeError:item.probeError}));
    }
    await context.close();
  }
} finally {
  await browser.close();
  fs.writeFileSync('docs/evidencias/110-discovery-restauracion.json',JSON.stringify(restore(),null,2));
  fs.writeFileSync(`docs/evidencias/110-recorridos-${process.argv.includes('--retry')?'retry':'inicial'}.json`, JSON.stringify(results, null, 2));
}
console.log(JSON.stringify(results.map(r => ({viewport:r.viewport,path:r.path,status:r.status,url:r.url,body:r.body?.slice(-4500),errors:r.errors,probeError:r.probeError,failedRequests:r.failedRequests})),null,2));
