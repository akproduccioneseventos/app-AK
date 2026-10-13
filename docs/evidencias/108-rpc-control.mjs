import fs from 'node:fs';
import crypto from 'node:crypto';
import { request } from '@playwright/test';
import assert from 'node:assert/strict';
import path from 'node:path';

if(process.env.AK_ENTORNO_AISLADO!=='true')throw new Error('Isolated only');
const root='http://127.0.0.1:3300';
const results=[];
const routes=[
  {path:'/settings/sincronizaciones',action:'0051f335e69a311e5dda97534264a9ff35e688867c'},
  {path:'/empresa/redes-sociales',action:'000e797b2efc3330251864f0db3c16dd61c563e8ee'},
];
const api=await request.newContext();
const files=['data','src/data'].map(dir=>path.resolve(dir,'social-posts.json'));
const originals=files.map(file=>fs.existsSync(file)?fs.readFileSync(file):null);
if(originals.some(bytes=>bytes&&JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,'')).length))throw new Error('Nonempty fixture refused');
const marker='QA108_PRIVATE_POST';
try {
  for(const file of files){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify([{id:'qa108-private',content:marker}]));}
  for(const session of ['valid','expired','anonymous']) {
    const payload=`v1.${Date.now()+(session==='expired'?-60000:3600000)}.${crypto.randomUUID()}`;
    const cookie=`ak_session=${payload}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`;
    for(const route of routes) {
      const response=await api.post(root+route.path,{maxRedirects:0,headers:{'Next-Action':route.action,'Content-Type':'text/plain;charset=UTF-8','Origin':root,...(session==='anonymous'?{}:{Cookie:cookie})},data:'[]'});
      const body=await response.text();
      const record={session,route:route.path,status:response.status(),location:response.headers().location,body};
      results.push(record);
      if(session==='valid') {
        assert.equal(record.status,200);
        assert.ok(!body.includes('1:E'));
        assert.ok(route.path.includes('sincronizaciones')?body.includes('google-calendar'):body.includes(marker));
      } else {
        assert.ok(!body.includes('google-calendar'));
        assert.ok(!body.includes(marker));
        if(record.status===307)assert.ok(record.location.includes('/login?redirect='));
        else if(route.path.includes('sincronizaciones')){
          assert.equal(record.status,500);
          assert.ok(body.includes('"digest":"3036932852"'));
        } else {
          assert.equal(record.status,200);
          assert.ok(body.includes('1:[]'));
        }
      }
    }
  }
} finally {
  await api.dispose();
  for(let i=0;i<files.length;i++){
    if(originals[i]){fs.writeFileSync(files[i],originals[i]);assert.ok(fs.readFileSync(files[i]).equals(originals[i]));}
    else{fs.rmSync(files[i],{force:true});assert.equal(fs.existsSync(files[i]),false);}
  }
  fs.writeFileSync('docs/evidencias/108-rpc-control.json',JSON.stringify(results,null,2));
}
console.log(JSON.stringify(results.map(({session,route,status,location})=>({session,route,status,location})),null,2));
