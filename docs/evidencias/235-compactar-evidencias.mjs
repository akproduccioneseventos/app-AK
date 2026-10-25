import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {gzipSync,gunzipSync} from 'node:zlib';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const names=['209-ejecucion.json','209-primer-inicio-ejecucion.json','213-resultados.json','214-ejecucion.json','215-ejecucion.json','215-resultados.json','215-batch-001-resultados.json','215-batch-002-resultados.json','231-manifiesto-artefactos.json'].map(name=>'docs/evidencias/'+name);
const artifactRoot=path.join(root,'docs/evidencias/213-artifacts');
for(const entry of fs.readdirSync(artifactRoot,{withFileTypes:true}))if(entry.isDirectory()){
  const relative=`docs/evidencias/213-artifacts/${entry.name}/error-context.md`;
  if(fs.existsSync(path.join(root,relative)))names.push(relative);
}
const target=path.join(root,'docs/evidencias/235-publicacion-compacta.json');assert.equal(fs.existsSync(target),false);
const records=[];
for(const relative of names){
  const old=spawnSync('git',['cat-file','-e',`9d1a07f99b8d6972995ff8c2b9f1a5a1ac4a81de:${relative}`],{cwd:root,encoding:'utf8'});assert.notEqual(old.status,0,'Never untrack a preexisting file');
  const file=path.resolve(root,relative);assert.ok(file.startsWith(path.resolve(root,'docs/evidencias')+path.sep));
  assert.equal(fs.existsSync(file+'.gz'),false,'Preserve gzip');
  const bytes=fs.readFileSync(file),compressed=gzipSync(bytes,{level:9});assert.ok(gunzipSync(compressed).equals(bytes));fs.writeFileSync(file+'.gz',compressed);
  const result=spawnSync('git',['rm','--cached','--',relative],{cwd:root,encoding:'utf8'});assert.equal(result.status,0,result.stderr);
  const add=spawnSync('git',['add','--',relative+'.gz'],{cwd:root,encoding:'utf8'});assert.equal(add.status,0,add.stderr);
  records.push({file:relative,published:relative+'.gz',bytes:bytes.length,gzipBytes:compressed.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),lossless:true,localOriginalRetained:fs.existsSync(file)});
}
fs.writeFileSync(target,JSON.stringify({checkedAt:new Date().toISOString(),scope:'Only own newly added audit artifacts. Lossless gzip, originals retained locally and in previous unpublished commit; no application or evidence content changed.',records},null,2)+'\n');console.log(JSON.stringify({files:records.length,bytes:records.reduce((n,r)=>n+r.bytes,0),gzipBytes:records.reduce((n,r)=>n+r.gzipBytes,0)}));
