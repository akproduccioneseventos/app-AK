import {test,expect} from '@playwright/test';
const routes=['/blog','/landing','/presentacion','/public/blog','/landing/xv-anos','/public','/portal-cliente','/catalogo/bodas','/configuracion/backup-final'];
for(const route of routes)test('447 venta aislada '+route,async({page},info)=>{
 test.setTimeout(120000);const errors:string[]=[],consoleErrors:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error'&&/Minified React error/i.test(message.text()))consoleErrors.push(message.text());});
 const started=Date.now();let text='';
 try{
  const response=await page.goto(route,{waitUntil:'domcontentloaded',timeout:60000});
  expect(response?.status(),route+' HTTP').toBeLessThan(400);
  await page.waitForLoadState('networkidle',{timeout:5000}).catch(()=>{});
  await page.waitForTimeout(3000);text=(await page.locator('body').innerText()).trim();
  expect(text.length,route+' dibuja contenido').toBeGreaterThanOrEqual(40);
  expect([...errors,...consoleErrors],route+' errores JS/React').toEqual([]);
 }finally{await info.attach('qa447-ruta-aislada',{contentType:'application/json',body:Buffer.from(JSON.stringify({route,url:page.url(),duration:Date.now()-started,text:text.slice(0,1200),errors,consoleErrors,scope:'Same nine routes and HTTP/body/React assertions as original long walk, separate fixture context per route; nonasserted networkidle limited5s instead15. Not every control acceptance.'}))});}
});
test('447 quinceaneras tres cargas aisladas criterio2500ms',async({browser},info)=>{
 test.setTimeout(180000);const samples:any[]=[];
 for(let i=0;i<3;i++){
  const context=await browser.newContext();const page=await context.newPage();
  try{const start=Date.now();const response=await page.goto('/quinceaneras',{waitUntil:'domcontentloaded',timeout:60000});const duration=Date.now()-start;
   await expect(page.locator('main,h1').first()).toBeVisible({timeout:10000});
   samples.push({iteration:i,status:response?.status(),duration,timing:await page.evaluate(()=>performance.getEntriesByType('navigation').map((e:any)=>({requestStart:e.requestStart,responseStart:e.responseStart,responseEnd:e.responseEnd,domContentLoaded:e.domContentLoadedEventEnd}))) });
  }finally{await context.close();}
 }
 await info.attach('qa447-tres-cargas',{contentType:'application/json',body:Buffer.from(JSON.stringify({samples,scope:'Local compiled QA performance only, fresh browser contexts/server warmed; no production Core Web Vitals claim.'}))});
 for(const sample of samples){expect(sample.status).toBeLessThan(400);expect(sample.duration,'criterio local2500ms, intento'+sample.iteration).toBeLessThanOrEqual(2500);}
});
