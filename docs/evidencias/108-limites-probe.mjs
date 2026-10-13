import fs from 'node:fs';
import crypto from 'node:crypto';
import { chromium,devices } from '@playwright/test';

if (process.env.AK_ENTORNO_AISLADO !== 'true') throw new Error('Isolated only');
const browser = await chromium.launch({headless:true});
const results = [];
const root = 'http://127.0.0.1:3300';
const routes = [
  {name:'connections',path:'/settings/sincronizaciones',action:'0051f335e69a311e5dda97534264a9ff35e688867c',refresh:'Actualizar'},
  {name:'social',path:'/empresa/redes-sociales',action:'000e797b2efc3330251864f0db3c16dd61c563e8ee'},
];
try {
  for (const viewport of ['desktop','mobile']) {
    const context = await browser.newContext(viewport === 'mobile' ? {...devices['Pixel 7']} : {viewport:{width:1440,height:1000}});
    await context.route(/^https:\/\//,route => route.abort('blockedbyclient'));
    await context.addInitScript(() => {localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
    const payload = `v1.${Date.now()+3600000}.${crypto.randomUUID()}`;
    await context.addCookies([{name:'ak_session',value:`${payload}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console',message => {if(message.type()==='error')consoleErrors.push(message.text());});
    for (const item of routes) {
      let cut = 0;
      const pattern = root+item.path;
      await page.route(pattern,async route => {
        if(route.request().headers()['next-action']===item.action && cut++ === 0) await route.abort('connectionfailed');
        else await route.continue();
      });
      await page.goto(pattern,{waitUntil:'networkidle',timeout:90000});
      await page.waitForTimeout(800);
      const firstFailure = await page.locator('body').innerText();
      await page.screenshot({path:`docs/evidencias/108-${viewport}-${item.name}-first-failure.png`,fullPage:true});
      let afterDismiss = '';
      let failureButtons = [];
      if(item.name==='social') {
        const close = page.locator('[toast-close]');
        if(await close.count()) await close.first().click();
        await page.waitForTimeout(500);
        afterDismiss = await page.locator('body').innerText();
        failureButtons = await page.getByRole('button').allTextContents();
        await page.screenshot({path:`docs/evidencias/108-${viewport}-social-dismissed.png`,fullPage:true});
      }
      await page.unroute(pattern);
      if(item.refresh) await page.getByRole('button',{name:item.refresh,exact:true}).click();
      else await page.reload({waitUntil:'networkidle'});
      if(item.name==='connections') await page.getByText('Google Calendar y Workspace',{exact:true}).waitFor({timeout:30000});
      else await page.getByText('No hay publicaciones que coincidan con los filtros seleccionados.',{exact:true}).waitFor({timeout:30000});
      const recovered = await page.locator('body').innerText();
      let refreshFailure = '';
      let refreshCuts = 0;
      if(item.refresh) {
        await page.route(pattern,async route => {
          if(route.request().headers()['next-action']===item.action) {refreshCuts++;await route.abort('connectionfailed');}
          else await route.continue();
        });
        await page.getByRole('button',{name:item.refresh,exact:true}).click();
        await page.waitForTimeout(1000);
        refreshFailure = await page.locator('body').innerText();
        await page.screenshot({path:`docs/evidencias/108-${viewport}-${item.name}-refresh-failure.png`,fullPage:true});
        await page.unroute(pattern);
        await page.getByRole('button',{name:item.refresh,exact:true}).click();
        await page.getByText('Google Calendar y Workspace',{exact:true}).waitFor();
      }
      results.push({viewport,route:item.path,initialCuts:cut,firstFailure,afterDismiss,failureButtons,recovered,refreshCuts,refreshFailure,consoleErrors:[...consoleErrors]});
    }
    await context.close();
    for(const session of ['anonymous','expired']) {
      const noAuth = await browser.newContext(viewport === 'mobile' ? {...devices['Pixel 7']} : {viewport:{width:1440,height:1000}});
      await noAuth.route(/^https:\/\//,route => route.abort('blockedbyclient'));
      if(session==='expired') {
        await noAuth.addInitScript(() => {localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
        const payload=`v1.${Date.now()-60000}.${crypto.randomUUID()}`;
        await noAuth.addCookies([{name:'ak_session',value:`${payload}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
      }
      const client=await noAuth.newPage();
      for(const item of routes) {
        await client.goto(root+item.path,{waitUntil:'networkidle',timeout:60000});
        await client.waitForTimeout(1000);
        const rpc = await noAuth.request.post(root+item.path,{headers:{'Next-Action':item.action,'Content-Type':'text/plain;charset=UTF-8','Origin':root},data:'[]'});
        results.push({viewport,session,route:item.path,url:client.url(),body:(await client.locator('body').innerText()).slice(-1800),rpc:{status:rpc.status(),body:(await rpc.text()).slice(-2200)}});
      }
      await noAuth.close();
    }
  }
} finally {
  await browser.close();
  fs.writeFileSync('docs/evidencias/108-limites-finales.json',JSON.stringify(results,null,2));
}
console.log(JSON.stringify(results.map(r=>({viewport:r.viewport,session:r.session,route:r.route,url:r.url,cuts:r.initialCuts,refreshCuts:r.refreshCuts,afterDismiss:r.afterDismiss?.slice(-180),rpcStatus:r.rpc?.status,rpcTail:r.rpc?.body.slice(-180),body:r.body?.slice(-200)})),null,2));
