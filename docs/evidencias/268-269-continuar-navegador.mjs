import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');
const source='725e62ba2f909578628fad47402d125ed9632c70';
const build=JSON.parse(fs.readFileSync(path.join(dir,'267-entorno.json'),'utf8'));
assert.equal(build.source,source);assert.equal(build.phase,'built');assert.equal(build.buildExit,0);
assert(!fs.existsSync(path.join(dir,'269-ejecucion.json')),'Preserve run');
const selection=JSON.parse(fs.readFileSync(path.join(dir,'215-seleccion.json'),'utf8'));
const manifest={source,buildSource:build.source,selected:selection.selected,batchSize:6,scope:'Current frozen-source native regression of existing142specs; finishes the previously incomplete215 selection. This is not acceptance of421routes/everybutton/allroles. Prior accepted results are retained; current delivery1358 changed app source. Assertions unchanged, network isolated.'};
assert.equal(manifest.selected.length,142);assert(!fs.existsSync(path.join(dir,'268-seleccion.json')));fs.writeFileSync(path.join(dir,'268-seleccion.json'),JSON.stringify(manifest,null,2)+'\n');
const original=fs.readFileSync(path.join(dir,'209-ejecutar-bateria.mjs'),'utf8');let code=original;
const changes=[
 ["const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');",`const root=${JSON.stringify(root)},dir=path.join(root,'docs/evidencias');`],
 ['fa3b492b8f1d6a77433a92f4d63b665cfea3747c',source],
 ['206-entorno.json','267-entorno.json'],
 ['ak-qa-206-','ak-qa-267-'],
 ["if(includePortal){const newTest=",`assert.equal(manifest.length,${manifest.selected.length},'Every selected spec must exist in frozen source');\nif(includePortal){const newTest=`],
 ["for(let index=0;index<groups.length;index++){","const overallDeadline=Date.now()+4*60*60*1000;\n  for(let index=0;index<groups.length;index++){\n    assert.ok(Date.now()<overallDeadline,'Native audit exceeded4hours: remaining cases NOT accepted');\n    assert.ok(fs.existsSync(path.join(qa,'208-config.ts')),'QA config lost: stop rather than falsely count batches');"],
 ["'test','--config','208-config.ts','--output'","'test','--config','208-config.ts','--global-timeout',String(Math.max(60000,Math.min(45*60*1000,overallDeadline-Date.now()))),'--output'"],
 ];
for(const[from,to]of changes){assert(code.includes(from),`QA adaptation missing ${from}`);code=code.replaceAll(from,to);}
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const adapted={source,original:'docs/evidencias/209-ejecutar-bateria.mjs',originalSha256:sha(original),adaptedSha256:sha(code),changes:changes.map(([from,to])=>({from,to})),assertionsChanged:false,appEdited:false,limits:'Only QA source/build gate, run path, existence guards and bounded runtime change. Existing test assertions untouched. Native result may fail/skip; never converted to acceptance.'};
fs.writeFileSync(path.join(dir,'268-adaptaciones.json'),JSON.stringify(adapted,null,2)+'\n');fs.writeFileSync(path.join(dir,'269-runner-materializado.mjs.gz'),gzipSync(code));
process.env.AK_AUDIT_RUN_ID='269';process.env.AK_AUDIT_SPEC_FILTER=manifest.selected.join(',');process.env.AK_AUDIT_SKIP_PORTAL='true';process.env.AK_AUDIT_BATCH_SIZE='6';
await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
