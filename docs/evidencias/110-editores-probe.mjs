import fs from 'node:fs';
import crypto from 'node:crypto';
import {chromium,devices,expect} from '@playwright/test';
import {fixtureGuard} from './110-fixture-guard.mjs';
const restore=fixtureGuard(),root='http://127.0.0.1:3300',results=[];
const browser=await chromium.launch({headless:true});
async function record(viewport,name,fn) {
  const r={viewport,name};
  try {r.details=await fn();r.status='PASS';} catch(error) {r.status='NOT_ACCEPTED';r.error=error.message;}
  results.push(r);console.log(JSON.stringify(r));
}
try {
  for(const viewport of ['desktop','mobile']) {
    const context=await browser.newContext(viewport==='mobile'?devices['Pixel 7']:{viewport:{width:1440,height:1000}});
    await context.route(/^https:\/\//,r=>r.abort('blockedbyclient'));
    await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
    const payload=`v1.${Date.now()+3600000}.${crypto.randomUUID()}`;
    await context.addCookies([{name:'ak_session',value:`${payload}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
    const page=await context.newPage();page.setDefaultTimeout(18000);
    const guest=await browser.newContext(viewport==='mobile'?devices['Pixel 7']:{viewport:{width:1440,height:1000}});
    await guest.route(/^https:\/\//,r=>r.abort('blockedbyclient'));
    const publicPage=await guest.newPage();publicPage.setDefaultTimeout(18000);
    const marker='QA110_'+viewport+'_'+crypto.randomUUID();
    const go=(p,url)=>p.goto(root+url,{waitUntil:'networkidle',timeout:60000});
    await record(viewport,'landing-save-reload-anonymous-consumer',async()=>{
      await go(page,'/empresa/landing-editor');
      const headline=page.getByPlaceholder('Hacemos Realidad tu Celebraci\u00f3n',{exact:true});
      await headline.fill(marker+' Landing');
      await page.getByRole('button',{name:'Guardar Cambios',exact:true}).first().click();
      await expect(page.getByText('La landing page se actualiz\u00f3 correctamente.',{exact:true})).toBeVisible();
      expect(JSON.parse(fs.readFileSync('src/data/landing-settings.json')).hero.headline).toBe(marker+' Landing');
      await page.reload({waitUntil:'networkidle'});await expect(headline).toHaveValue(marker+' Landing');
      const started=Date.now();
      let headers;
      await expect.poll(async()=>{
        const response=await go(publicPage,'/');headers=await response.allHeaders();
        return publicPage.getByText(marker+' Landing',{exact:true}).isVisible();
      },{timeout:345000,intervals:[1000,5000,15000]}).toBe(true);
      return {storedHeadline:marker+' Landing',editorReload:true,anonymousPublicConsumer:true,refreshSeconds:(Date.now()-started)/1000,headers};
    });
    await record(viewport,'led-catalog-save-reload-anonymous-consumers',async()=>{
      await go(page,'/settings/contenido-publico');
      const title=page.locator('input').filter({visible:true}).first();
      const catalog=page.locator('input').filter({visible:true});
      const index=await catalog.evaluateAll(nodes=>nodes.findIndex(n=>n.value==='Tu boda perfecta, hecha realidad'||n.value.startsWith('QA110_')&&n.value.endsWith(' Catalogo')));
      if(index<0) throw new Error('Catalog title field not located from visible values');
      await title.fill(marker+' LED');await catalog.nth(index).fill(marker+' Catalogo');
      await page.getByRole('button',{name:'Guardar ahora',exact:true}).click();
      await expect(page.locator('[title^="Guardado a las "]')).toBeVisible();
      expect(JSON.parse(fs.readFileSync('src/data/presentacion-led-settings.json')).portada.tituloPrincipal).toBe(marker+' LED');
      expect(JSON.parse(fs.readFileSync('src/data/catalogo-settings.json')).bodas.hero.titulo).toBe(marker+' Catalogo');
      await page.reload({waitUntil:'networkidle'});await expect(title).toHaveValue(marker+' LED');
      await go(publicPage,'/presentacion-led');await expect(publicPage.getByText(marker+' LED',{exact:true}).first()).toBeVisible();
      await go(publicPage,'/catalogo/bodas');await expect(publicPage.getByText(marker+' Catalogo',{exact:true}).first()).toBeVisible();
      return {led:marker+' LED',catalog:marker+' Catalogo',editorReload:true,anonymousConsumers:true};
    });
    await guest.close();await context.close();
  }
} finally {
  await browser.close();
  fs.writeFileSync('docs/evidencias/110-editores-restauracion.json',JSON.stringify(restore(),null,2));
  fs.writeFileSync('docs/evidencias/110-editores.json',JSON.stringify(results,null,2));
}
