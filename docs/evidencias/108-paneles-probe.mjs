import fs from 'node:fs';
import crypto from 'node:crypto';
import { chromium,devices } from '@playwright/test';

if (process.env.AK_ENTORNO_AISLADO !== 'true') throw new Error('Isolated environment only');
const browser = await chromium.launch({headless:true});
const results = [];
try {
  for (const viewport of ['desktop','mobile']) {
    const context = await browser.newContext(viewport === 'mobile' ? {...devices['Pixel 7']} : {viewport:{width:1440,height:1000}});
    await context.route(/^https:\/\//,route => route.abort('blockedbyclient'));
    await context.addInitScript(() => {localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
    const payload = `v1.${Date.now()+3600000}.${crypto.randomUUID()}`;
    await context.addCookies([{name:'ak_session',value:`${payload}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`,url:'http://127.0.0.1:3300',httpOnly:true,sameSite:'Lax'}]);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror',e => errors.push(e.message));
    // Rutas comprobadas en main-nav.tsx; no se evalua aqui el menu lateral.
    for (const link of [{text:'Conexiones',href:'/settings/sincronizaciones'},{text:'Redes Sociales',href:'/empresa/redes-sociales'}]) {
      const label = link.text;
      const actionRequests = [];
      page.on('request',request => { const action=request.headers()['next-action']; if(action) actionRequests.push({url:request.url(),action}); });
      await page.goto('http://127.0.0.1:3300'+link.href,{waitUntil:'networkidle',timeout:90000});
      await page.waitForTimeout(1000);
      const body = await page.locator('body').innerText();
      const controls = await page.locator('a,button').evaluateAll(nodes => nodes.map(n => ({tag:n.tagName,text:n.textContent.trim(),href:n.getAttribute('href'),disabled:n.disabled || false})));
      const panelLinks = await page.locator('main a').evaluateAll(nodes => nodes.map(a => ({text:a.textContent.trim(),href:a.getAttribute('href')})));
      const name = label === 'Conexiones' ? 'connections' : 'social';
      await page.screenshot({path:`docs/evidencias/108-${viewport}-${name}.png`,fullPage:true});
      results.push({viewport,label,url:page.url(),body,controls,panelLinks,actionRequests,errors:[...errors]});
      page.removeAllListeners('request');
    }
    await context.close();
  }
} finally {
  await browser.close();
  fs.writeFileSync('docs/evidencias/108-paneles-inicial.json',JSON.stringify(results,null,2));
}
console.log(JSON.stringify(results.map(r => ({viewport:r.viewport,label:r.label,url:r.url,body:r.body.slice(-3800),actions:r.actionRequests})),null,2));
