import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const dir = path.join(root,'docs/evidencias');
const source = '9b7ee982c5d6ff1377fccc0490abc85a9cfd8419';
const candidate = '108e17b4387237fc921ea12e8d1eb65b20f62ac9';
const target = path.join(dir,'165-validacion.json'); assert.equal(fs.existsSync(target),false,'Preserve validation');
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const readJson = name => JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
const receiptNames = ['160-retest-portales-tareas','161-galeria-video-retest','162-seguimiento-fecha-retest','163-proveedor-concurrencia','164-once-tareas-respuestas'];
const receipts = receiptNames.map(name => {
  const r = readJson(`${name}.json`); assert.equal(r.testSha256,hash(fs.readFileSync(path.join(dir,`${name}.mjs`))),`${name} selfhash`);
  assert.equal(r.appEdited,false); assert.equal(r.source,name.startsWith('161') || name.startsWith('162') ? candidate : source);
  const all = r.cases || r.runs.flatMap(run => run.cases);
  assert.equal(all.length,r.summary.total); assert.equal(all.filter(c=>c.pass).length,r.summary.pass); assert.equal(all.filter(c=>!c.pass).length,r.summary.fail);
  return {name,source:r.source,sha256:hash(fs.readFileSync(path.join(dir,`${name}.json`))),summary:r.summary,scope:r.scope,limits:r.limits};
});
const summary = receipts.reduce((t,r)=>({total:t.total+r.summary.total,pass:t.pass+r.summary.pass,fail:t.fail+r.summary.fail}),{total:0,pass:0,fail:0});
assert.deepEqual(summary,{total:152,pass:144,fail:8});
const git = args => {const p=spawnSync('git',args,{cwd:root,encoding:'utf8'});assert.equal(p.status,0,p.stderr);return p.stdout.trim();};
assert.equal(git(['diff','--name-only',source,'--','src','package.json','package-lock.json','scripts']), '','No app edits');
assert.equal(git(['diff','--check']), '');
const stateLines = fs.readFileSync(path.join(root,'ESTADO-ACTUAL.md'),'utf8').trimEnd().split(/\r?\n/).length; assert.ok(stateLines<=40);
let syntaxCount = 0,jsonCount = 0;
for(const name of fs.readdirSync(dir).filter(n=>/^16[0-5]-/.test(n))) {
  if(name.endsWith('.mjs')) {const p=spawnSync(process.execPath,['--check',path.join(dir,name)],{encoding:'utf8'});assert.equal(p.status,0,`${name}: ${p.stderr}`);syntaxCount++;}
  if(name.endsWith('.json')) {readJson(name);jsonCount++;}
}
for(const order of ['199-gemini-galeria-foco-teclado.md','200-claude-portal-personal-lecturas-previas.md','201-claude-tareas-publicas-respuesta-recortada.md','204-claude-proveedor-cambios-simultaneos.md']) {
  const text=fs.readFileSync(path.join(root,'docs/ordenes',order),'utf8'); assert.match(text,/```comprobar[\s\S]*```\s*$/); assert.match(text,/prueba: docs\/evidencias\//);
}
const treePaths=git(['ls-tree','-r','--name-only',source,'--','src/app']).split('\n');
const currentRoutes=treePaths.filter(n=>/^src\/app\/(?:.*\/)?(?:page|route)\.(?:tsx?|jsx?)$/.test(n));
const inventory=readJson('134-conciliacion.json');
const areaOverlay={source,inventorySource:inventory.sourceSha,priorInventoryCounts:inventory.counts,currentRouteCount:currentRoutes.length,
  meaning:'Historical inventory plus focal receipts, NOT a complete acceptance matrix per role/control/state',
  areas:inventory.areas.map(a=>({id:a.id,name:a.name,historicalOwnedRoutes:a.ownedRoutes,historicalScopes:a.reportScopes,fullAreaAccepted:false})),
  newReceipts:receipts.map(r=>({name:r.name,source:r.source,summary:r.summary})),allAppCertified:false};
fs.writeFileSync(path.join(dir,'165-recuento-areas.json'),JSON.stringify(areaOverlay,null,2)+'\n');
const result={checkedAt:new Date().toISOString(),source,candidate,receipts,summary,distinctPendingCauses:2,syntaxCount,jsonCount,stateLines,
  appDiff:'',whitespacePass:true,sourceSelfhashesPass:5,currentRouteCount:currentRoutes.length,
  resources:{freeMemoryBytes:os.freemem(),heavyQaMinimumBytes:2*1024**3,heavyQaStarted:false},
  limits:['Multiple source SHAs; not one frozen release acceptance','No new wide Jest/build/native run, no production/OAuth/hardware/19originals acceptance'],allAppCertified:false};
fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
