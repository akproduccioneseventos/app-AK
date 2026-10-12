import fs from 'node:fs';
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import {chromium} from '@playwright/test';
import {fixtureGuard} from './110-fixture-guard.mjs';
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('Private demo only');
const restore=fixtureGuard(),root='http://127.0.0.1:3301';
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa113-discovery'),db=app.firestore();
for(const col of await db.listCollections())if(!(await col.limit(1).get()).empty)throw new Error('Empty owned emulator required');
const browser=await chromium.launch({headless:true});
try{
  await db.collection('insumos').doc('qa113_carne').set({id:'qa113_carne',nombre:'QA113 Carne',categoria:'Carnes',unidad:'kg',valorUnitarioEstimado:100,cantidadDisponible:2});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route(/^https:\/\//,r=>r.abort('blockedbyclient'));await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
  const p=`v1.${Date.now()+3600000}.${crypto.randomUUID()}`;await context.addCookies([{name:'ak_session',value:`${p}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(p).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
  const page=await context.newPage();await page.goto(root+'/empresa/insumos',{waitUntil:'networkidle',timeout:60000});
  const buttons=await page.getByRole('button').allTextContents(),links=await page.getByRole('link').evaluateAll(ns=>ns.map(n=>({text:n.textContent,href:n.getAttribute('href')})));
  console.log(JSON.stringify({buttons,links:links.filter(x=>/men|cost|comida/i.test(x.text))}));
  const candidate=page.getByRole('button',{name:/Ajust.*Cost/i});if(await candidate.count()){await candidate.first().click();console.log(JSON.stringify({dialog:await page.getByRole('dialog').innerText(),inputs:await page.getByRole('dialog').locator('input').evaluateAll(ns=>ns.map(n=>({id:n.id,placeholder:n.placeholder,type:n.type,value:n.value})))}));}
  await page.screenshot({path:'docs/evidencias/113-costos-discovery.png',fullPage:true});
}finally{await browser.close();for(const col of await db.listCollections())for(const doc of(await col.get()).docs)await doc.ref.delete();fs.writeFileSync('docs/evidencias/113-discovery-restored.json',JSON.stringify(restore(),null,2)+'\n');await app.delete();}
