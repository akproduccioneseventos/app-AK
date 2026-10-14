import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import admin from 'firebase-admin';
import zlib from 'node:zlib';
import {chromium,devices,expect} from '@playwright/test';
import {fixtureGuard} from './110-fixture-guard.mjs';
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('Owned QA only');
const restore=fixtureGuard(),root='http://127.0.0.1:3301',browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}),results=[];
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa124-position'),db=app.firestore();
const mobileOnly=process.argv.includes('--mobile-only-reuse-desktop');
if(mobileOnly){const prior=JSON.parse(zlib.gunzipSync(fs.readFileSync('docs/evidencias/124-posicion-mobile-captura-124-posicion-resultados.json.gz')));
  assert.equal(prior.applicationSourceSha,process.env.COMMIT_SHA);assert.equal(prior.cleanup.bytesRestored,true);
  const passed=prior.results.filter(r=>r.status==='PASS');assert.equal(passed.length,1);assert.equal(passed[0].viewport,'desktop');results.push(passed[0]);}
function clearArrays(folder){for(const item of fs.readdirSync(folder,{withFileTypes:true})){
  const file=folder+'/'+item.name;if(item.isDirectory())clearArrays(file);else if(item.name.endsWith('.json')){try{if(Array.isArray(JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''))))fs.writeFileSync(file,'[]\n');}catch{}}
}}
try{
  for(const c of await db.listCollections())if(!(await c.limit(1).get()).empty)throw new Error('Empty owned emulator required');
  clearArrays('data');clearArrays('src/data');
  await db.collection('servicios').doc('qa124-pos-dj').set({id:'qa124-pos-dj',nombre:'DJ QA124 Posicion',categoria:'Discoteca',precioBase:1000,calculationMethod:'fijo',activo:true});
  for(const viewport of mobileOnly?['mobile']:['desktop','mobile']){
    const context=await browser.newContext(viewport==='mobile'?devices['Pixel 7']:{viewport:{width:1440,height:1000}});
    await context.route(/^https:\/\//,r=>r.abort('blockedbyclient'));
    await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
    const payload=`v1.${Date.now()+3600000}.${crypto.randomUUID()}`;
    await context.addCookies([{name:'ak_session',value:`${payload}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
    const page=await context.newPage();await page.goto(root+'/empresa/configurador-reunion',{waitUntil:'networkidle',timeout:90000});
    const canvas=page.locator('canvas').first();await expect(canvas).toBeVisible({timeout:60000});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const first=Buffer.from((await canvas.evaluate(el=>el.toDataURL('image/png'))).split(',')[1],'base64');
    fs.writeFileSync(`docs/evidencias/124-canvas-${viewport}-quiet.png`,first);
    const {data,info}=await sharp(first).removeAlpha().raw().toBuffer({resolveWithObject:true});const colors=new Set();
    for(let i=0;i<data.length;i+=info.channels*43)colors.add(data.subarray(i,i+3).toString('hex'));
    assert(colors.size>30,'3D canvas blank/flat');await page.getByRole('button',{name:'Recorrer',exact:true}).click();
    await expect(page.getByRole('button',{name:'Pausar recorrido',exact:true})).toHaveAttribute('aria-pressed','true');
    await page.waitForTimeout(1200);const moving=Buffer.from((await canvas.evaluate(el=>el.toDataURL('image/png'))).split(',')[1],'base64');
    fs.writeFileSync(`docs/evidencias/124-canvas-${viewport}-moving.png`,moving);
    assert(!first.equals(moving),'Camera did not change canvas');await page.getByRole('button',{name:'Pausar recorrido',exact:true}).click();
    const save=page.getByRole('button',{name:'Guardar como Presupuesto Formal',exact:true});
    await expect(save).toBeEnabled();await save.scrollIntoViewIfNeeded();
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const hitbox=await save.evaluate(el=>{const r=el.getBoundingClientRect();return[.1,.5,.9].map(x=>{const top=document.elementFromPoint(r.x+r.width*x,r.y+r.height*.5);return{x:r.x+r.width*x,y:r.y+r.height*.5,uncovered:el===top||el.contains(top),top:top?.outerHTML.slice(0,200)};});});
    assert(hitbox.every(p=>p.uncovered),JSON.stringify(hitbox));await save.focus();assert(await save.evaluate(el=>document.activeElement===el));
    if(viewport==='desktop'){
      const grip=page.getByRole('button',{name:'Mover el asistente'});await expect(grip).toBeVisible();const old=await grip.boundingBox();
      await page.mouse.move(old.x+old.width/2,old.y+old.height/2);await page.mouse.down();await page.mouse.move(old.x-180,old.y-80,{steps:10});await page.mouse.up();
      const moved=await grip.boundingBox();assert(Math.abs(old.x-moved.x)+Math.abs(old.y-moved.y)>20);
      await page.getByRole('button',{name:'Minimizar el asistente',exact:true}).click();await expect(page.getByRole('button',{name:'Mostrar el asistente',exact:true})).toBeVisible();
      await page.getByRole('button',{name:'Mostrar el asistente',exact:true}).click();await expect(grip).toBeVisible();
    }
    await page.screenshot({path:`docs/evidencias/124-posicion-${viewport}.png`,scale:'css',timeout:90000});
    results.push({viewport,status:'PASS',hitbox,keyboardFocus:true,dragAndMinimize:viewport==='desktop',canvasColors:colors.size,cameraMoves:true,renderer:'software SwiftShader',route:'/empresa/configurador-reunion'});console.log(JSON.stringify(results.at(-1)));await context.close();
  }
}catch(error){results.push({status:'QA_NOT_ACCEPTED',error:error.stack});process.exitCode=1;}
finally{await browser.close();for(const c of await db.listCollections())for(const d of(await c.get()).docs)await d.ref.delete();await app.delete();const cleanup=restore();fs.writeFileSync('docs/evidencias/124-posicion-resultados.json',JSON.stringify({applicationSourceSha:process.env.COMMIT_SHA,results,cleanup,
  compositeNative:mobileOnly?{reused:1,reusedEvidence:'124-posicion-mobile-captura-124-posicion-resultados.json.gz',newCases:1,note:'Same compiled source, CSS-scale screenshot only; desktop assertions retained.'}:null},null,2)+'\n');}
