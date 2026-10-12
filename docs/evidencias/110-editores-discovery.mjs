import fs from 'node:fs';
import crypto from 'node:crypto';
import {chromium} from '@playwright/test';
import {fixtureGuard} from './110-fixture-guard.mjs';
const restore=fixtureGuard(),root='http://127.0.0.1:3300',results=[];
const browser=await chromium.launch({headless:true});
try {
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route(/^https:\/\//,r=>r.abort('blockedbyclient'));
  await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
  const payload=`v1.${Date.now()+3600000}.${crypto.randomUUID()}`;
  await context.addCookies([{name:'ak_session',value:`${payload}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
  const page=await context.newPage();
  for(const route of ['/empresa/landing-editor','/settings/contenido-publico']) {
    await page.goto(root+route,{waitUntil:'networkidle',timeout:60000});
    const result={route,body:await page.locator('body').innerText(),inputs:await page.locator('input,textarea').evaluateAll(nodes=>nodes.map(n=>({tag:n.tagName,id:n.id,type:n.type,placeholder:n.placeholder,value:n.value}))),buttons:await page.getByRole('button').allTextContents()};
    results.push(result);console.log(JSON.stringify(result));
  }
  await context.close();
} finally {
  await browser.close();
  fs.writeFileSync('docs/evidencias/110-editores-discovery.json',JSON.stringify(results,null,2));
  fs.writeFileSync('docs/evidencias/110-editores-discovery-restauracion.json',JSON.stringify(restore(),null,2));
}
