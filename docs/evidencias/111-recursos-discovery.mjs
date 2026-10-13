import fs from 'node:fs';
import crypto from 'node:crypto';
import {chromium} from '@playwright/test';
import {fixtureGuard} from './110-fixture-guard.mjs';
const restore=fixtureGuard(),root=process.env.PLAYWRIGHT_BASE_URL,results=[];
if(root!=='http://127.0.0.1:3301')throw new Error('Private SDK QA only');
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route(/^https:\/\//,r=>r.abort('blockedbyclient'));
  await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
  const p=`v1.${Date.now()+3600000}.${crypto.randomUUID()}`;
  await context.addCookies([{name:'ak_session',value:`${p}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(p).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
  const page=await context.newPage();
  for(const route of ['/empresa/activos-fijos','/empresa/activos-fijos/nuevo','/empresa/insumos','/empresa/insumos/nuevo']){
    await page.goto(root+route,{waitUntil:'networkidle',timeout:60000});
    const r={route,body:await page.locator('body').innerText(),inputs:await page.locator('input,textarea').evaluateAll(ns=>ns.map(n=>({id:n.id,type:n.type,placeholder:n.placeholder,value:n.value}))),buttons:await page.getByRole('button').allTextContents()};
    results.push(r);console.log(JSON.stringify(r));
  }
  await context.close();
}finally{
  await browser.close();fs.writeFileSync('docs/evidencias/111-recursos-discovery.json',JSON.stringify(results,null,2));
  fs.writeFileSync('docs/evidencias/111-recursos-discovery-restauracion.json',JSON.stringify(restore(),null,2));
}
