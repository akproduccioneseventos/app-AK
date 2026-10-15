import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import admin from 'firebase-admin';
import {chromium,devices} from '@playwright/test';

const source='b520f7cee28546634e1c87391efd7a80e1a40f48';
assert.equal(process.env.COMMIT_SHA,source);
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8085');
const fixture=JSON.parse(fs.readFileSync('docs/evidencias/126-fixtures-execution.json'));
assert.equal(fixture.status,'running');process.kill(fixture.pid,0);
const files=execFileSync('git',['diff','--name-only',source],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
assert.ok(files.every(f=>/^(docs\/|tests\/|src\/__tests__\/|data\/|src\/data\/|ESTADO-ACTUAL\.md$|AGENTS\.md$)/.test(f)),'App code must match accepted build; data under active byte guard only');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa126-decoration'), db=app.firestore();
const browser=await chromium.launch({headless:true}), results=[];
try {
  for(const [device,options] of [['desktop',{viewport:{width:1280,height:900}}],['mobile',devices['Pixel 7']]]) {
    const context=await browser.newContext(options),page=await context.newPage();
    await context.route('**/*',route=>['localhost','127.0.0.1'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort('blockedbyclient'));
    await db.collection('fiestas').doc('qa126-fiesta').update({decoracion:{}});
    await page.goto('http://127.0.0.1:3302/entrada');
    await page.goto('http://127.0.0.1:3301/portal/qa126-fiesta/decoracion');
    const change=page.getByRole('button',{name:'Quiero cambiar algo',exact:true});
    await change.waitFor();
    await page.mouse.move(0,0);
    const style=await change.evaluate(el=>{
      const s=getComputedStyle(el);return {text:s.color,background:s.backgroundColor,border:s.borderColor,fontSize:s.fontSize};
    });
    const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number);
    const luminance=s=>rgb(s).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
    const a=luminance(style.text),b=luminance(style.background),contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    const screenshot=`docs/evidencias/126-decoracion-${device}.png`;
    await page.screenshot({path:screenshot,fullPage:true});
    results.push({device,scenario:'CHANGE_BUTTON_TEXT_CONTRAST_DEFAULT_LIGHT_THEME',status:contrast>=4.5?'PASS':'FAIL',required:4.5,contrast,style,screenshot});
    await change.click();
    const textarea=page.getByPlaceholder('Escribí acá tu comentario o pedido de cambio...');
    const comment=`QA126 sugerencia ficticia ${device}: flores blancas.`;
    await textarea.fill(comment);
    await page.getByRole('button',{name:'Enviar sugerencia',exact:true}).click();
    await page.getByText('Comentario enviado',{exact:true}).waitFor();
    const saved=(await db.collection('fiestas').doc('qa126-fiesta').get()).data()?.decoracion?.opinionCliente;
    assert.equal(saved?.comentario,comment);assert.equal(saved.leGusta,false);
    await page.reload();
    await page.getByText('Sugerencia enviada',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Quiero cambiar algo',exact:true}).click();
    assert.equal(await textarea.inputValue(),comment);
    results.push({device,scenario:'SUGGESTION_SAVED_AND_VISIBLE_AFTER_RELOAD',status:'PASS',saved,
      session:'FICTITIOUS_OWNER_SESSION_NOT_REAL_CLIENT_AUTH',realAction:true,realDemoFirestore:true});
    await context.close();
  }
} catch(error) {results.push({status:'HARNESS_ERROR',message:String(error),stack:error.stack});process.exitCode=2;}
finally {
  await browser.close();await app.delete();
  const record={applicationSourceSha:source,results,allAppCertified:false,gate:results.some(x=>x.status==='HARNESS_ERROR')?'QA_INCOMPLETE':results.some(x=>x.status==='FAIL')?'DEFECT_REPRODUCED':'PASS_TESTED_SCENARIOS_ONLY'};
  fs.writeFileSync('docs/evidencias/126-decoracion-native.json',JSON.stringify(record,null,2)+'\n');
  console.log(JSON.stringify(record));
  if(record.gate==='DEFECT_REPRODUCED')process.exitCode=1;
}
