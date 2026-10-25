import {test,expect} from '@playwright/test';
test('474 tres cargas con contexto protegido y cache desactivada',async({page,context},info)=>{
 test.setTimeout(180000);const samples:any[]=[];const cdp=await context.newCDPSession(page);
 await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 try{
  for(let attempt=0;attempt<3;attempt++){
   await page.goto('about:blank');const start=Date.now();let status:number|undefined;
   try{const response=await page.goto('/quinceaneras',{waitUntil:'domcontentloaded',timeout:30000});status=response?.status();const duration=Date.now()-start;
    await expect(page.locator('main,h1').first()).toBeVisible({timeout:10000});
    samples.push({attempt,status,duration,timing:await page.evaluate(()=>performance.getEntriesByType('navigation').map((n:any)=>({requestStart:n.requestStart,responseStart:n.responseStart,responseEnd:n.responseEnd,domContentLoaded:n.domContentLoadedEventEnd}))) });
   }catch(error){samples.push({attempt,status,duration:Date.now()-start,error:String(error)});}
  }
  expect(samples).toHaveLength(3);for(const s of samples){expect(s.error,'carga'+s.attempt).toBeUndefined();expect(s.status).toBeLessThan(400);expect(s.duration,'umbral local2500ms, carga'+s.attempt).toBeLessThanOrEqual(2500);}
 }finally{await info.attach('qa474-muestras',{contentType:'application/json',body:Buffer.from(JSON.stringify({samples,scope:'Same2500ms DOMContentLoaded criterion; fixture context keeps local-only FIS guard. HTTP cache disabled, no SDK emulator overhead, no separate context.close loop. This local QA is not production Core Web Vitals.'}))});await cdp.detach();}
});
