import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { chromium, devices } from '@playwright/test';

if (process.env.AK_ENTORNO_AISLADO !== 'true') throw new Error('Isolated environment only');
const results = [];
const accountPaths = ['data','src/data'].map(dir => path.resolve(dir,'_google-workspace-accounts.json'));
const originals = accountPaths.map(file => fs.existsSync(file) ? fs.readFileSync(file) : null);
if (originals.some(bytes => bytes && JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')).length)) throw new Error('Nonempty accounts fixture refused');
const browser = await chromium.launch({ headless:true });
const fixture = [
  { id:'qa107-company',kind:'company',email:'qa107@example.invalid',accessToken:'',calendarId:'primary',status:'needs_reconnect',lastError:'QA107: permiso retirado',connectedAt:'2026-10-10T10:00:00Z',updatedAt:'2026-10-12T10:00:00Z' },
  { id:'qa107-employee',kind:'employee',employeeId:'qa107-worker',email:'qa107-worker@example.invalid',accessToken:'',status:'error',lastError:'QA107: permiso retirado',connectedAt:'2026-10-10T10:00:00Z',updatedAt:'2026-10-12T10:00:00Z' },
];
try {
  for (const file of accountPaths) { fs.mkdirSync(path.dirname(file),{recursive:true}); fs.writeFileSync(file,JSON.stringify(fixture,null,2)); }
  for (const name of ['desktop','mobile']) {
    const context = await browser.newContext(name === 'mobile' ? { ...devices['Pixel 7'] } : { viewport:{width:1440,height:1000} });
    await context.addInitScript(() => { localStorage.setItem('ak_session','true'); sessionStorage.setItem('ak_session','true'); });
    const payload = `v1.${Date.now()+3600000}.${crypto.randomUUID()}`;
    await context.addCookies([{ name:'ak_session',value:`${payload}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`,url:'http://127.0.0.1:3300',httpOnly:true,sameSite:'Lax' }]);
    const page = await context.newPage();
    await context.route(/^https:\/\//, route => route.abort('blockedbyclient'));
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:3300/settings/google-workspace',{waitUntil:'networkidle',timeout:90000});
    const initial = await page.locator('body').innerText();
    const buttons = await page.getByRole('button').evaluateAll(nodes => nodes.map(node => ({text:node.textContent,disabled:node.disabled})));
    await page.screenshot({path:`docs/evidencias/107-google-${name}-revoked.png`,fullPage:true});
    let injected = 0;
    await page.route('**/settings/google-workspace', async route => {
      if (route.request().method() === 'POST' && route.request().headers()['next-action'] === '00c21a19219b3114ed2f9927f257a1a06269ec4a3b' && injected++ === 0) await route.abort('connectionfailed');
      else await route.continue();
    });
    await page.reload({waitUntil:'networkidle',timeout:90000});
    await page.waitForTimeout(1200);
    const failure = await page.locator('body').innerText();
    const recoveryButtons = await page.getByRole('button').allTextContents();
    await page.screenshot({path:`docs/evidencias/107-google-${name}-focused-failure.png`,fullPage:true});
    await page.unroute('**/settings/google-workspace');
    await page.getByRole('button',{name:'Reintentar',exact:true}).click();
    let retryError = '';
    try { await page.getByText('Falta configurar Google antes de conectar.',{exact:true}).waitFor({timeout:15000}); }
    catch (error) { retryError = error.message; }
    const afterRetry = await page.locator('body').innerText();
    await page.screenshot({path:`docs/evidencias/107-google-${name}-after-retry.png`,fullPage:true});
    if (retryError) await page.reload({waitUntil:'networkidle',timeout:90000});
    const recovered = await page.locator('body').innerText();
    results.push({name,initial,buttons,injected,failure,recoveryButtons,afterRetry,retryError,recovered,errors});
    await context.close();
  }
} finally {
  await browser.close();
  for (let i=0;i<accountPaths.length;i++) { if (originals[i]) fs.writeFileSync(accountPaths[i],originals[i]); else fs.rmSync(accountPaths[i],{force:true}); }
}
fs.writeFileSync('docs/evidencias/107-google-focused.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results.map(result => ({name:result.name,injected:result.injected,configuredWarning:result.initial.includes('Falta configurar Google'),failure:result.failure.slice(0,300),retryError:result.retryError,recoversByButton:result.afterRetry.includes('Falta configurar Google'),recovers:result.recovered.includes('Falta configurar Google'),errors:result.errors})),null,2));
