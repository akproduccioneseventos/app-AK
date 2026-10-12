import fs from 'node:fs';
import crypto from 'node:crypto';
import { chromium,devices } from '@playwright/test';
import { fixtureGuard } from './110-fixture-guard.mjs';
const restore=fixtureGuard(), root='http://127.0.0.1:3300', results=[];
const browser=await chromium.launch({headless:true});
try {
  for(const viewport of ['desktop','mobile']) {
    const context=await browser.newContext(viewport==='mobile'?devices['Pixel 7']:{viewport:{width:1440,height:1000}});
    await context.route(/^https:\/\//,route=>route.abort('blockedbyclient'));
    await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
    const user={email:'qa110@example.invalid',userId:'qa110',role:'admin',perfil:'dueno'};
    const payload=`v1.${Date.now()+3600000}.${crypto.randomUUID()}.${encodeURIComponent(JSON.stringify(user))}`;
    const token=`${payload}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`;
    await context.addCookies([{name:'ak_session',value:encodeURIComponent(token),url:root,httpOnly:true,sameSite:'Lax'}]);
    const page=await context.newPage();page.setDefaultTimeout(18000);
    for(const test of [
      {path:'/control-tower/comercial',name:'commercial-read-network-failure',read:true,action:'0017fcfad3a7cb6b02f28412013b7697e5a2f6daec'},
      {path:'/control-tower/post-fiesta',name:'postevent-read-network-failure',read:true,action:'00abbc95106351d9186b620bb367678bba84cab6ab'},
      {path:'/control-tower/automatizaciones',name:'automations-run-network-failure',button:'Ejecutar revisi\u00f3n inteligente',action:'00559a3646f2fca0c77707a728f7f06b58701ac9e1'},
      {path:'/control-tower/comercial',name:'commercial-alert-network-failure',button:'Crear avisos',action:'00ca8d7c5c7d6866f3545f03a5a7409283bff02243'},
    ]) {
      const item={viewport,...test,blocked:[],errors:[]};
      const onError=error=>item.errors.push(error.message);page.on('pageerror',onError);
      async function block(route) {
        if(route.request().method()==='POST' && route.request().headers()['next-action']===test.action) {item.blocked.push(route.request().headers()['next-action']);return route.abort('failed');}
        return route.continue();
      }
      try {
        if(test.read) await page.route(root+test.path,block);
        await page.goto(root+test.path,{waitUntil:'domcontentloaded',timeout:60000});
        if(!test.read) {await page.route(root+test.path,block);await page.getByRole('button',{name:test.button,exact:true}).click();}
        await page.waitForTimeout(1500);
        const body=await page.locator('body').innerText();
        Object.assign(item,{body,url:page.url(),falseCalm:/Todo tranquilo|No hay fiestas finalizadas|No hay oportunidades/i.test(body),visibleFailure:/No se pudo|No pudimos|Error|fall[o\u00f3]|Reintentar|problema de conexi[o\u00f3]n/i.test(body),
          retryButton:await page.getByRole('button',{name:/Reintentar|Reintento/}).count(),
          enabled:test.button && await page.getByRole('button',{name:test.button,exact:true}).count()?await page.getByRole('button',{name:test.button,exact:true}).isEnabled():null});
        await page.screenshot({path:`docs/evidencias/110-${test.name}-${viewport}.png`,fullPage:true});
      } catch(error) {item.probeError=error.message;}
      finally {await page.unroute(root+test.path);page.removeListener('pageerror',onError);}
      results.push(item);console.log(JSON.stringify({viewport,name:test.name,blocked:item.blocked.length,falseCalm:item.falseCalm,visibleFailure:item.visibleFailure,probeError:item.probeError}));
    }
    await context.close();
  }
} finally {
  await browser.close();
  fs.writeFileSync('docs/evidencias/110-centro-restauracion.json',JSON.stringify(restore(),null,2));
  fs.writeFileSync('docs/evidencias/110-centro.json',JSON.stringify(results,null,2));
}
