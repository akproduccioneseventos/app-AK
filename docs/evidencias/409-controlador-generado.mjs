import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {gunzipSync,gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url));
const target=path.join(dir,'409-control.json');assert(!fs.existsSync(target),'Preserve receipt');
const record={source:'917a98e32c63fe2f832f5cdc16db87f4fc722b6c',started:new Date().toISOString(),phase:'checking-frozen-build',appEdited:false,scope:'Two computed-style bar journeys PC/mobile and existing simulator desktop closing case; no repeated27 main cases or374 routes.'};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();let addition;
try{
 const build=JSON.parse(fs.readFileSync(path.join(dir,'406-entorno.json'),'utf8'));
 assert.equal(build.source,record.source);assert.equal(build.phase,'built','No native test on a missing/wrong-source build');
 const qa=path.resolve(build.qa);assert(qa.replaceAll('\\','/').startsWith('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-392-candidate-'));
 addition=path.join(qa,'tests/e2e/393-barra-contraste.spec.ts');assert(!fs.existsSync(addition));fs.copyFileSync(path.join(dir,'393-barra-contraste.spec.ts'),addition);
 fs.writeFileSync(path.join(dir,'409-config.ts'),"import {defineConfig} from '@playwright/test';import base from './208-config';export default defineConfig({...base,projects:base.projects?.map(p=>({...p,grep:p.name==='chromium-desktop'?/ak207-408-camara-preview|ak207-393-barra-contraste|ak207-prospecto-simulador.*llega desde el simulador hasta ver un precio/:/ak207-393-barra-contraste/}))});\n");
 let code=gunzipSync(fs.readFileSync(path.join(dir,'374-driver.mjs.gz'))).toString('utf8')
  .replaceAll('3e45a4ac6b479f89605163168e31b37dc84f2d0f',record.source)
  .replaceAll('366-entorno.json','406-entorno.json').replaceAll('.qa-366-main-','.qa-392-candidate-')
  .replaceAll('374','410').replaceAll('373-config.ts','409-config.ts')
  .replace('expected:27','expected:7').replace('assert.equal(list.length,27','assert.equal(list.length,7')
  .replace('Only27 previously inconclusive project/case pairs','Only7 new-source consumer cases');
 process.env.AK_AUDIT_SPEC_FILTER='393-barra-contraste.spec.ts,prospecto-simulador.spec.ts,408-camara-preview.spec.ts';process.env.AK_AUDIT_SKIP_PORTAL='true';process.env.AK_AUDIT_BATCH_SIZE='1';
 fs.writeFileSync(path.join(dir,'410-driver.mjs.gz'),gzipSync(code));record.phase='running';save();
 await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));record.phase='finished';
}catch(error){record.phase='not-accepted-setup-or-native-error';record.error=String(error.stack||error);process.exitCode=2;}
finally{if(addition&&fs.existsSync(addition))fs.unlinkSync(addition);record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
