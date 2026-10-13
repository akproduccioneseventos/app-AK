import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root='docs/evidencias/',read=f=>JSON.parse(fs.readFileSync(root+f,'utf8'));
const criteria=[];
function add(file,filter=()=>true,normalize=r=>r.status) {
  for(const row of read(file).filter(filter)) {
    const status=normalize(row);assert(['PASS','FAIL','PARTIAL'].includes(status),file+': incomplete '+row.name);
    criteria.push({file,viewport:row.viewport,name:row.name,status});
  }
}
add('110-providers.json');
add('110-meetings.json');
add('110-acciones.json',r=>r.name.startsWith('invitation-'),r=>r.details?.acceptance?.startsWith('FAIL')?'FAIL':r.status);
add('110-centro.json',()=>true,r=>{
  assert.equal(r.blocked.length,1);assert.equal(r.blocked[0],r.action);
  return r.visibleFailure?'PASS':'FAIL';
});
add('110-negocios.json');
add('110-marketing.json');
add('110-counts.json',()=>true,r=>{
  assert.equal(r.details.actualNew,0);assert(r.details.advertised>0);assert.equal(r.details.noDuplicates,true);
  return r.status;
});
for(const criterion of criteria) if(criterion.file==='110-counts.json') criterion.name='automations-created-counter-matches-persisted-delta';
add('110-editores.json');
assert.equal(new Set(criteria.map(c=>c.viewport+'|'+c.name+'|'+c.file)).size,criteria.length);
for(const file of ['110-acciones-restauracion.json','110-meetings-restauracion.json','110-centro-restauracion.json','110-providers-restauracion.json','110-negocios-restauracion.json','110-marketing-restauracion.json','110-counts-restauracion.json','110-editores-restauracion.json']) assert.equal(read(file).bytesRestored,true,file);
assert.equal(read('110-providers-sdk-restauracion.json').remaining,read('110-providers-sdk-restauracion.json').initialCount);
assert(!fs.existsSync(root+'.110-fail-fiesta-reads'));
assert.equal(read('110-entorno-detenido.json').listeners.length,0);
assert.equal(read('110-entorno-detenido.json').appFailure,false);
for(const row of read('110-providers.json').filter(r=>r.name==='provider-delete-cancel-and-confirm')) {
  assert.equal(row.details.documentExists,false);assert.equal(row.details.localContainsDeleted,true);assert.equal(row.details.presentAfterReload,1);
}
const appSha='8fa5b56a2833938541a657dcd15ef88130d24b0e';
const changed=execFileSync('git',['diff','--name-only',appSha,'HEAD'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
assert(changed.every(f=>/^(docs\/|tests\/e2e\/|ESTADO-ACTUAL\.md$)/.test(f)),'App changed; old build cannot be reused');
execFileSync('git',['diff','--exit-code','--','src/data','data'],{stdio:'pipe'});
const sources=new Set(criteria.map(c=>c.file));
for(const f of fs.readdirSync(root)) if(/^110-.*\.png$/.test(f)||/^110-.*(?:restauracion|execution)\.json$/.test(f)) sources.add(f);
sources.add('110-recorridos-independientes.md');sources.add('110-provider-faults.jsonl');
sources.add('110-entorno-detenido.json');
for(const file of ['110-recorridos-inicial.json.gz','110-recorridos-retry.json.gz','110-sdk-emulator.log.gz']) sources.add(file);
const hashes=[...sources].sort().map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(root+file)).digest('hex')}));
const summary=Object.fromEntries(['PASS','FAIL','PARTIAL'].map(s=>[s,criteria.filter(c=>c.status===s).length]));
const result={auditoria:110,generatedAt:new Date().toISOString(),evidenceHead:'2f6007beaf8fe93c5f87dfc632c63f66eeb0428d',applicationSourceSha:appSha,comparedMain:'99faf4eb061fa46341cfdde6f81b93b3bfb9c73c',privateClaudeBranch:'NOT_CONTRASTED',summary,criteria,hashes,allAppAccepted:false,productionChanges:false,correctionsPending:'156',limits:'Not each button, all roles, real integrations, deployed same SHA, hardware or 19 original budgets.'};
fs.writeFileSync(root+'110-resultado.json',JSON.stringify(result,null,2));console.log(JSON.stringify({summary,criteria:criteria.length,evidenceFiles:hashes.length,allAppAccepted:false}));
