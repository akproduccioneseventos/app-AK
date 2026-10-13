import fs from 'node:fs';
import crypto from 'node:crypto';
import {chromium} from '@playwright/test';
import {fixtureGuard} from './110-fixture-guard.mjs';
const restore=fixtureGuard(),root=process.env.PLAYWRIGHT_BASE_URL,results=[];
if(root!=='http://127.0.0.1:3300')throw new Error('Owned local QA only');
const browser=await chromium.launch({headless:true});
try {
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route(/^https:\/\//,r=>r.abort('blockedbyclient'));
  await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
  const p=`v1.${Date.now()+3600000}.${crypto.randomUUID()}`;
  await context.addCookies([{name:'ak_session',value:`${p}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(p).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
  const page=await context.newPage();
  for(const route of ['/incidentes','/playbooks']) {
    await page.goto(root+route,{waitUntil:'networkidle',timeout:60000});
    const r={route,body:await page.locator('body').innerText(),inputs:await page.locator('input,textarea').evaluateAll(nodes=>nodes.map(n=>({id:n.id,type:n.type,placeholder:n.placeholder,value:n.value}))),buttons:await page.getByRole('button').allTextContents()};
    results.push(r);console.log(JSON.stringify(r));
    if(route==='/incidentes'){
      await page.getByRole('button',{name:'Nueva Incidencia',exact:true}).click();
      const dialog=page.getByRole('dialog');
      const d={route,dialog:await dialog.innerText(),inputs:await dialog.locator('input,textarea').evaluateAll(ns=>ns.map(n=>({id:n.id,type:n.type,placeholder:n.placeholder,value:n.value})))};
      results.push(d);console.log(JSON.stringify(d));
    }
  }
  await context.close();
} finally {
  await browser.close();fs.writeFileSync('docs/evidencias/111-discovery.json',JSON.stringify(results,null,2));
  fs.writeFileSync('docs/evidencias/111-discovery-restauracion.json',JSON.stringify(restore(),null,2));
}
