import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {gzipSync,gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
const root='docs/evidencias/',read=f=>JSON.parse(fs.readFileSync(root+f,'utf8')),criteria=[];
function add(file,filter=()=>true){for(const r of read(file).filter(filter)){assert(['PASS','FAIL'].includes(r.status),file+' incomplete: '+r.name);criteria.push({file,viewport:r.viewport,name:r.name,status:r.status});}}
add('111-operaciones.json');
add('111-recursos-segunda.json',r=>r.viewport==='desktop');
add('111-recursos-mobile.json');
add('111-titulos.json');
assert.equal(criteria.length,28);
assert.equal(new Set(criteria.map(c=>c.viewport+'|'+c.name)).size,28);
const summary=Object.fromEntries(['PASS','FAIL'].map(s=>[s,criteria.filter(c=>c.status===s).length]));
assert.equal(summary.PASS,24);assert.equal(summary.FAIL,4);
for(const f of ['111-operaciones-restauracion.json','111-recursos-restauracion.json','111-recursos-mobile-restauracion.json','111-titulos-restauracion.json']){assert.equal(read(f).bytesRestored,true,f);assert.equal(read(f).initialDocuments,0,f);}
for(const f of ['111-operaciones-execution.json','111-recursos-segunda-execution.json','111-recursos-mobile-execution.json','111-titulos-execution.json'])assert.equal(read(f).exitCode,0,f);
const stopped=read('111-entorno-detenido.json');assert.equal(stopped.listeners.length,0);assert.equal(stopped.appFailure,false);assert.equal(stopped.stopped.length,3);
const appSha='8fa5b56a2833938541a657dcd15ef88130d24b0e';
const changed=execFileSync('git',['diff','--name-only',appSha,'HEAD'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
assert(changed.every(f=>/^(docs\/|tests\/e2e\/|ESTADO-ACTUAL\.md$)/.test(f)),'Accepted app source changed');
execFileSync('git',['diff','--exit-code','--','src/data','data'],{stdio:'pipe'});
const compressed=[];
for(const file of fs.readdirSync(root).filter(f=>/^111-.*\.log$/.test(f))){
  const bytes=fs.readFileSync(root+file),gz=gzipSync(bytes,{level:9});
  assert(gunzipSync(gz).equals(bytes));fs.writeFileSync(root+file+'.gz',gz);
  compressed.push({raw:file,archive:file+'.gz',bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
fs.writeFileSync(root+'111-artifactos-comprimidos.json',JSON.stringify(compressed,null,2));
const files=fs.readdirSync(root).filter(f=>/^111-/.test(f)&&f!=='111-resultado.json'&&!f.endsWith('.log')).sort();
const hashes=files.map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(root+file)).digest('hex')}));
const result={auditoria:111,generatedAt:new Date().toISOString(),evidenceHead:'39704d5c9f64c4914310be2b040c1a9b073c502f',applicationSourceSha:appSha,comparedMain:'99faf4eb061fa46341cfdde6f81b93b3bfb9c73c',privateClaudeBranch:'NOT_CONTRASTED',summary,criteria,hashes,distinctDefects:2,correctionsPending:['157','158'],allAppAccepted:false,productionChanges:false,limits:'Scoped fictitious-data emulator/browser checks; not all buttons/roles, external integrations, deployed SHA, hardware or 19 original budgets.'};
fs.writeFileSync(root+'111-resultado.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({summary,criteria:criteria.length,distinctDefects:2,evidenceFiles:hashes.length,allAppAccepted:false}));
