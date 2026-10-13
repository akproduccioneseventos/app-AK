import fs from 'node:fs';
import crypto from 'node:crypto';
import {chromium,devices,expect} from '@playwright/test';
import {fixtureGuard} from './110-fixture-guard.mjs';
const restore=fixtureGuard(),root='http://127.0.0.1:3300',results=[];
const browser=await chromium.launch({headless:true});
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
async function record(viewport,name,fn) {
  const r={viewport,name};try{r.details=await fn();r.status='PASS';}catch(error){r.status='NOT_ACCEPTED';r.error=error.message;}
  results.push(r);console.log(JSON.stringify(r));
}
try {
  for(const viewport of ['desktop','mobile']) {
    const context=await browser.newContext(viewport==='mobile'?devices['Pixel 7']:{viewport:{width:1440,height:1000}});
    await context.route(/^https:\/\//,route=>route.abort('blockedbyclient'));
    await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
    const payload=`v1.${Date.now()+3600000}.${crypto.randomUUID()}`;
    await context.addCookies([{name:'ak_session',value:`${payload}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
    const page=await context.newPage();page.setDefaultTimeout(18000);
    const marker='QA110_'+viewport+'_'+crypto.randomUUID();let saved;
    await record(viewport,'marketing-template-save-and-apply-after-reload',async()=>{
      await page.goto(root+'/marketing',{waitUntil:'networkidle',timeout:60000});
      await page.locator('input').filter({visible:true}).first().fill(marker);
      await page.getByPlaceholder('Nombre de la plantilla\u2026').fill(marker+' plantilla');
      await page.getByRole('button',{name:'Guardar',exact:true}).click();
      await expect(page.getByText(/Plantilla guardada/)).toBeVisible();
      saved=read('src/data/marketing-templates.json').find(t=>t.nombre===marker+' plantilla');
      const rendered=await page.locator('textarea').first().inputValue();
      expect(rendered.length).toBeGreaterThan(0);
      expect(saved?.contenido.ig_corto).toBe(rendered);
      await page.reload({waitUntil:'networkidle'});
      await page.getByRole('tab',{name:'Plantillas',exact:true}).click();
      const card=page.locator('[class*="rounded-2xl"]').filter({has:page.getByText(marker+' plantilla',{exact:true})}).last();
      await card.getByRole('button',{name:'Aplicar',exact:true}).click();
      await expect(page.locator('textarea').first()).toHaveValue(saved.contenido.ig_corto);
      return {id:saved.id,generatedCopySavedExactly:true,igShortRestoredFromSavedTemplate:true};
    });
    await record(viewport,'marketing-checklist-save-and-reload',async()=>{
      await page.getByRole('tab',{name:'Checklist',exact:true}).click();
      await page.getByPlaceholder('Tu nombre (para registrar qui\u00e9n lo hizo)').fill(marker);
      const index=viewport==='mobile'?1:0;
      const button=page.getByRole('button').filter({hasText:'Historia de XV'}).nth(index);
      await button.click();
      await expect(button).toContainText(marker);
      await page.reload({waitUntil:'networkidle'});
      await page.getByRole('tab',{name:'Checklist',exact:true}).click();
      await expect(page.getByRole('button').filter({hasText:'Historia de XV'}).nth(index)).toContainText(marker);
      const item=read('src/data/marketing-checklist.json').find(i=>i.hechoBy===marker);
      expect(item?.estado).toBe('hecho');
      return {id:item.id,state:item.estado,by:item.hechoBy,persisted:true};
    });
    await record(viewport,'marketing-download-json',async()=>{
      if(!saved) throw new Error('Template save required');
      await page.getByRole('tab',{name:'Checklist',exact:true}).click();
      const promise=page.waitForEvent('download');
      await page.getByRole('button',{name:'Exportar marketing.json',exact:true}).click();
      const download=await promise,content=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
      expect(content.templates.some(t=>t.id===saved.id&&t.contenido.ig_corto===saved.contenido.ig_corto)).toBe(true);
      expect(content.checklist.some(i=>i.hechoBy===marker)).toBe(true);
      return {filename:download.suggestedFilename(),templatePresent:true,checklistPresent:true};
    });
    await context.close();
  }
} finally {
  await browser.close();
  fs.writeFileSync('docs/evidencias/110-marketing-restauracion.json',JSON.stringify(restore(),null,2));
  fs.writeFileSync('docs/evidencias/110-marketing.json',JSON.stringify(results,null,2));
}
