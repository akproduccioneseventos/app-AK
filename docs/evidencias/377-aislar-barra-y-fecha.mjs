import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {gunzipSync,gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),target=path.join(dir,'377-control.json');
assert(!fs.existsSync(target),'Preserve receipt');
const record={phase:'waiting376',started:new Date().toISOString(),appEdited:false,scope:'Two isolated desktop controls after the27 native replay: actual select/cancel styles and SAME kitchen business assertions with optional screenshot attachments. No new area or blanket acceptance.'};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();const additions=[];
try{
 const deadline=Date.now()+3*60*60*1000;
 while(true){let r;try{r=JSON.parse(fs.readFileSync(path.join(dir,'376-diagnostico-atomico.json'),'utf8'));}catch{}if(r?.finished)break;if(Date.now()>deadline)throw new Error('Previous376 still active');await new Promise(ok=>setTimeout(ok,30000));}
 const build=JSON.parse(fs.readFileSync(path.join(dir,'366-entorno.json'),'utf8'));assert.equal(build.phase,'built');assert.equal(build.source,'3e45a4ac6b479f89605163168e31b37dc84f2d0f');const qa=path.resolve(build.qa);
 const ts=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
 const original=fs.readFileSync(path.join(qa,'tests/e2e/143-cocina-fecha-local.spec.ts'),'utf8'),ast=ts.createSourceFile('kitchen.ts',original,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS),edits=[];
 const visit=node=>{
  if(ts.isExpressionStatement(node)&&ts.isAwaitExpression(node.expression)&&ts.isCallExpression(node.expression.expression)&&/\.attach$/.test(node.expression.expression.expression.getText(ast))&&/\.screenshot\(/.test(node.getText(ast))){
   const statement=node.getText(ast).replace(/await page\.locator\('main'\)\.screenshot\([^;]*?\)/g,"await page.screenshot({fullPage:true,animations:'disabled',timeout:2000})");
   edits.push({start:node.getStart(ast),end:node.end,text:"try{"+statement+"}catch(error){await testInfo.attach('qa380-capture-unavailable',{contentType:'text/plain',body:String(error)});}"});
  }
  ts.forEachChild(node,visit);
 };visit(ast);assert(edits.length>0,'Capture-only adaptations must be identified');
 let prepared=original;for(const edit of edits.sort((a,b)=>b.start-a.start))prepared=prepared.slice(0,edit.start)+edit.text+prepared.slice(edit.end);
 const assertions=text=>{const tree=ts.createSourceFile('probe.ts',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS),out=[];const scan=n=>{if(ts.isExpressionStatement(n)&&/^(await )?expect\(/.test(n.getText(tree)))out.push(n.getText(tree));ts.forEachChild(n,scan);};scan(tree);return out;};
 assert.deepEqual(assertions(prepared),assertions(original),'Never weaken kitchen assertions');
 fs.writeFileSync(path.join(dir,'380-cocina-adjunto-opcional.spec.ts'),prepared);
 fs.writeFileSync(path.join(dir,'380-adaptacion.json'),JSON.stringify({source:build.source,originalSha256:crypto.createHash('sha256').update(original).digest('hex'),preparedSha256:crypto.createHash('sha256').update(prepared).digest('hex'),assertionsUnchanged:assertions(original),captureOnlyEdits:edits.map(e=>({start:e.start,end:e.end})),visualAcceptance:false},null,2)+'\n');
 for(const name of ['379-mini-quiosco-cancel.spec.ts','380-cocina-adjunto-opcional.spec.ts']){const file=path.join(qa,'tests/e2e',name);assert(!fs.existsSync(file));fs.copyFileSync(path.join(dir,name),file);additions.push(file);}
 fs.writeFileSync(path.join(dir,'377-config.ts'),"import {defineConfig} from '@playwright/test';import base from './208-config';export default defineConfig({...base,projects:base.projects?.filter(p=>p.name==='chromium-desktop')});\n");
 let code=gunzipSync(fs.readFileSync(path.join(dir,'374-driver.mjs.gz'))).toString('utf8').replaceAll('374','381').replaceAll('373-config.ts','377-config.ts')
  .replace('expected:27','expected:2').replace('assert.equal(list.length,27','assert.equal(list.length,2').replace('Only27 previously inconclusive project/case pairs','Only2 isolated controls, not another broad run');
 process.env.AK_AUDIT_SPEC_FILTER='379-mini-quiosco-cancel.spec.ts,380-cocina-adjunto-opcional.spec.ts';process.env.AK_AUDIT_SKIP_PORTAL='true';process.env.AK_AUDIT_BATCH_SIZE='1';
 fs.writeFileSync(path.join(dir,'381-driver.mjs.gz'),gzipSync(code));record.phase='running';save();
 await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));record.phase='finished';
}catch(error){record.phase='qa-setup-or-native-error';record.error=String(error.stack||error);process.exitCode=2;}
finally{for(const file of additions){assert(file.startsWith(path.resolve('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-366-main-')));if(fs.existsSync(file))fs.unlinkSync(file);}record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
