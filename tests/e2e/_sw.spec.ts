import crypto from 'node:crypto';
import fs from 'node:fs';
import { test } from '@playwright/test';
const S='playwright-session-secret-with-enough-entropy';
function tok(){const p=`v1.${Date.now()+36e5}.${crypto.randomUUID()}`;return `${p}.${crypto.createHmac('sha256',S).update(p).digest('hex')}`;}
const LOTE=process.env.LOTE!;
const RUTAS=fs.readFileSync(LOTE,'utf8').split('\n').filter(Boolean);
const out:any[]=[];
test.afterAll(()=>fs.appendFileSync(process.env.SALIDA!, out.map(o=>JSON.stringify(o)).join('\n')+'\n'));
test('sweep', async ({ page, context, baseURL }) => {
  test.setTimeout(2000_000);
  await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
  await context.addCookies([{name:'ak_session',value:tok(),url:baseURL!,httpOnly:true,sameSite:'Lax'}]);
  for(const r of RUTAS){
    const errs:string[]=[]; const h=(e:any)=>errs.push(String(e).slice(0,70)); page.on('pageerror',h);
    let estado='ok';
    try{const res=await page.goto(r,{waitUntil:'domcontentloaded',timeout:40000}); if(res&&res.status()>=400) estado='HTTP'+res.status();}catch{estado='TIMEOUT';}
    await page.waitForLoadState('networkidle').catch(()=>{}); await page.waitForTimeout(1200);
    const d=await page.evaluate(()=>{
      const W=document.documentElement.clientWidth;
      const des=document.documentElement.scrollWidth-W;
      let culpa='';
      if(des>2){
        const cand:any[]=[];
        document.querySelectorAll('*').forEach(el=>{const b=el.getBoundingClientRect();
          if(b.right>W+2&&b.width>40&&!/fixed/.test(getComputedStyle(el).position))
            cand.push({t:el.tagName.toLowerCase(),c:(el.className||'').toString().slice(0,70),w:Math.round(b.width),x:(el.textContent||'').trim().slice(0,20)});});
        culpa=JSON.stringify(cand.slice(-2));
      }
      return {d:des, c:/Error Cr|Algo salió mal|Application error/i.test(document.body.innerText), culpa};
    }).catch(()=>({d:-1,c:false,culpa:''}));
    out.push({r,e:estado,l:page.url().includes('/login'),...d,x:errs.slice(0,1)});
    page.off('pageerror',h);
  }
});
