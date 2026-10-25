import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),source='3e45a4ac6b479f89605163168e31b37dc84f2d0f';
const build=JSON.parse(fs.readFileSync(path.join(dir,'291-entorno.json'),'utf8'));assert.equal(build.phase,'built');assert.equal(build.source,source);assert.equal(build.sourceDiff,'');
const mode=process.argv[2]||'home';assert(['home','failed-files','route-walk'].includes(mode));
const run=({home:'327','failed-files':'296','route-walk':'297'})[mode];assert(!fs.existsSync(path.join(dir,`${run}-ejecucion.json`)),'Preserve run');
let selected;
const additions=[];
if(mode==='home'){
 const file=path.join(build.qa,'tests/e2e/326-control-fixture-navegacion-qa.spec.ts');assert(!fs.existsSync(file));fs.copyFileSync(path.join(dir,'326-control-fixture-navegacion-qa.spec.ts'),file);additions.push(file);selected=['326-control-fixture-navegacion-qa.spec.ts'];
}else if(mode==='failed-files')selected=[...new Set(JSON.parse(fs.readFileSync(path.join(dir,'279-fallas-para-revision.json'),'utf8')).cases.map(c=>c.file))];
else selected=['recorrido-de-pantallas.spec.ts'];
const old=fs.readFileSync(path.join(dir,'209-ejecutar-bateria.mjs'),'utf8');let code=old;
const changes=[
 ["const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');",`const root=${JSON.stringify(root)},dir=path.join(root,'docs/evidencias');`],
 ['fa3b492b8f1d6a77433a92f4d63b665cfea3747c',source],['206-entorno.json','291-entorno.json'],['ak-qa-206-','ak-qa-280-'],
 ["const runId=process.env.AK_AUDIT_RUN_ID||'209';",`const runId='${run}';`],
 ["if(includePortal){const newTest=",`assert.equal(manifest.length,${selected.length},'All selected focal files must exist');\nif(includePortal){const newTest=`],
 ];
if(mode==='route-walk')changes.push(
 [".filter(file=>!file.includes('recorrido-de-pantallas'))",''],
 ["const runEnv={...env,AK_QA_RESULTS:","const runEnv={...env,AK_RECORRIDO_CARRILES:'1',AK_QA_RESULTS:"],
);
for(const[from,to]of changes){assert(code.includes(from),from);code=code.replaceAll(from,to);}
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
fs.writeFileSync(path.join(dir,`${run}-seleccion-y-adaptacion.json`),JSON.stringify({source,mode,selected,changes:changes.map(([from,to])=>({from,to})),originalSha256:sha(old),driverSha256:sha(code),assertionsChanged:false,scope:mode==='route-walk'?'Original navigation inventory finally enabled; ONE lane, same per-route checks. Route availability/pictures NEVER equal all actions/roles accepted.':mode==='home'?'New stronger home criterion: no fixme, no force-click, no optional360 action. Screenshots freeze motion only after interaction.':'Existing failed-file contexts rerun on new exact app source. Original assertions/timeouts untouched; previous failures retained, source and memory conditions differ.'},null,2)+'\n');
fs.writeFileSync(path.join(dir,`${run}-driver-materializado.mjs.gz`),gzipSync(code));
process.env.AK_AUDIT_SPEC_FILTER=selected.join(',');process.env.AK_AUDIT_SKIP_PORTAL='true';process.env.AK_AUDIT_BATCH_SIZE=mode==='failed-files'?'6':'0';
try{await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));}
finally{for(const file of additions){assert(file.startsWith(path.resolve(build.qa)+path.sep));if(fs.existsSync(file))fs.unlinkSync(file);}}
