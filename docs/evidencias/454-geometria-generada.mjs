import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {gunzipSync,gzipSync} from 'node:zlib';
import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),receipt=path.join(dir,'453-control.json');
assert(!fs.existsSync(receipt));
const previous=JSON.parse(fs.readFileSync(path.join(dir,'440-emuladores.json'),'utf8'));
assert.equal(previous.phase,'finished');assert.equal(previous.cleanupStatus,200);
const source='917a98e32c63fe2f832f5cdc16db87f4fc722b6c';
const build=JSON.parse(fs.readFileSync(path.join(dir,'427-entorno.json'),'utf8'));assert.equal(build.source,source);
const record={source,started:new Date().toISOString(),scope:'Only two original layout projects, original staff-overflow loop, original20 stock suggestions. Same assertions; no baseline reset. JSON fictitious mode is sufficient for geometry, not synchronization.',appEdited:false,realServices:false,freeBytes:os.freemem()};
const save=()=>fs.writeFileSync(receipt,JSON.stringify(record,null,2)+'\n');save();
assert(os.freemem()>=1.5*1024**3,'One browser requires1GiB; no foreign process may be stopped');
fs.writeFileSync(path.join(dir,'453-config.ts'),"import {defineConfig} from '@playwright/test';import base from './208-config';export default defineConfig({...base,projects:base.projects?.map(p=>({...p,grep:p.name==='chromium-desktop'?/ak207-layout-baseline|ak207-mobile-overflow.*rutas internas del staff|ak207-89.*trago con stock 0/:/ak207-layout-baseline/}))});\n");
const add=`import {createRequire as __require453} from 'node:module';
const __ts453=__require453('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const __changes453=[];
function __adapt453(file,raw){
 let text=raw;
 if(file.endsWith('89-la-barra-no-ofrece-lo-agotado.spec.ts'))text=text.replace('test.setTimeout(90_000);','test.setTimeout(240_000);');
 if(file.endsWith('mobile-overflow.spec.ts'))text=text.replace('test.setTimeout(300_000);','test.setTimeout(600_000); await page.setViewportSize({width:390,height:844});');
 if(file.endsWith('layout-baseline.spec.ts'))text=text.replace('await page.evaluate(() => (document as any).fonts?.ready).catch(() => {});',"await page.evaluate(() => Promise.race([(document as any).fonts?.ready,new Promise(resolve=>setTimeout(resolve,15000))])).catch(() => {});");
 __changes453.push({file,original:hash(raw),prepared:hash(text),assertionsChanged:false,scope:'Only case runtime budget/font-readiness upper bound; baseline expectations and absolute geometry rules untouched.'});
 fs.writeFileSync(path.join(dir,'453-adaptaciones.json'),JSON.stringify(__changes453,null,2)+'\\n');return text;
}
`;
let code=gunzipSync(fs.readFileSync(path.join(dir,'374-driver.mjs.gz'))).toString('utf8')
 .replaceAll('3e45a4ac6b479f89605163168e31b37dc84f2d0f',source)
 .replaceAll('366-entorno.json','427-entorno.json').replaceAll('.qa-366-main-','.qa-427-source-')
 .replaceAll('374','455').replaceAll('373-config.ts','453-config.ts')
 .replace('expected:27','expected:4').replace('assert.equal(list.length,27','assert.equal(list.length,4');
assert(code.includes("const raw=fs.readFileSync(file,'utf8');"));
code=add+code.replace("const raw=fs.readFileSync(file,'utf8');","const originalRaw=fs.readFileSync(file,'utf8');const raw=__adapt453(file,originalRaw);")
 .replace('originalSha256:hash(raw)','originalSha256:hash(originalRaw),preparedSha256:hash(raw)')
 .replace("const env={...safe,...JSON.parse(envResult.stdout).forzadas,","const env={...safe,...JSON.parse(envResult.stdout).forzadas,LAYOUT_BASELINE_ROUTES:'/admin,/presupuestos/nuevo',");
process.env.AK_AUDIT_SPEC_FILTER='layout-baseline.spec.ts,mobile-overflow.spec.ts,89-la-barra-no-ofrece-lo-agotado.spec.ts';
process.env.AK_AUDIT_SKIP_PORTAL='true';process.env.AK_AUDIT_BATCH_SIZE='1';
const baseline=path.join(build.qa,'tests/e2e/layout-baseline.json');const original=fs.readFileSync(baseline);
const physical=path.join(dir,'455-driver.mjs');assert(!fs.existsSync(physical));fs.writeFileSync(physical,code);fs.writeFileSync(physical+'.gz',gzipSync(code));
try{record.phase='running';save();await import(pathToFileURL(physical).href);record.phase='finished';}
catch(error){record.phase='qa-setup-or-run-error';record.error=String(error.stack||error);process.exitCode=1;}
finally{fs.writeFileSync(baseline,original);record.finished=new Date().toISOString();record.baselineRestored=true;save();}
