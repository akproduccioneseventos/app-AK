import fs from 'node:fs';
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import {chromium,expect} from '@playwright/test';
import {fixtureGuard} from './110-fixture-guard.mjs';
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('Owned demo only');
const restore=fixtureGuard(),root='http://127.0.0.1:3301',app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa122'),db=app.firestore();
const browser=await chromium.launch({headless:true}),results=[];
try{
  for(const c of await db.listCollections())if(!(await c.limit(1).get()).empty)throw new Error('Empty emulator required');
  function clearArrays(folder){for(const item of fs.readdirSync(folder,{withFileTypes:true})){
    const file=folder+'/'+item.name;
    if(item.isDirectory())clearArrays(file);else if(item.name.endsWith('.json')){try{if(Array.isArray(JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''))))fs.writeFileSync(file,'[]\n');}catch{}}
  }}
  clearArrays('data');clearArrays('src/data');
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route(/^https:\/\//,r=>r.abort('blockedbyclient'));
  await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
  const payload=`v1.${Date.now()+3600000}.${crypto.randomUUID()}`;
  await context.addCookies([{name:'ak_session',value:`${payload}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
  const page=await context.newPage();await page.goto(root+'/empresa/dashboard',{waitUntil:'networkidle',timeout:90000});
  const indicator=page.getByTitle('Abrir asistente activo',{exact:true});await expect(indicator).toBeVisible({timeout:30000});
  const field=page.getByPlaceholder('Hablar con General...');expect(await field.isVisible()).toBe(false);
  await indicator.click();let opened=false;try{await expect(field).toBeVisible({timeout:3000});opened=true;}catch{}
  await page.screenshot({path:'docs/evidencias/122-indicador-click.png',fullPage:false});
  results.push({name:'contextual-indicator-opens-visible-assistant',status:opened?'PASS':'DEFECT_REPRODUCED',opened,
    actualLauncher:await page.locator('[aria-label="Abrir Asistente IA AK"]').count(),legacyTarget:await page.locator('[aria-label="Abrir Asistente AK"]').count()});
  expect(opened).toBe(true);
  await page.getByRole('button',{name:'Abrir Asistente IA AK',exact:true}).click();await expect(field).not.toBeVisible();
  await page.getByRole('button',{name:'Abrir Asistente IA AK',exact:true}).click();await expect(field).toBeVisible();
  results.push({name:'primary-launcher-control-opens-assistant',status:'PASS'});
  console.log(JSON.stringify(results));await context.close();
}catch(error){results.push({status:'QA_NOT_ACCEPTED',error:error.stack});process.exitCode=1;}
finally{await browser.close();for(const c of await db.listCollections())for(const d of(await c.get()).docs)await d.ref.delete();const cleanup=restore();await app.delete();
  fs.writeFileSync('docs/evidencias/122-indicador-resultados.json',JSON.stringify({applicationSourceSha:process.env.COMMIT_SHA,results,cleanup},null,2)+'\n');}
