import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url));
const target=path.join(dir,'399-manifiesto-final.json');
if(process.argv.includes('--archive-previous')&&fs.existsSync(target)){
 const previous=path.join(dir,'399-manifiesto-prestaging-'+Date.now()+'.json.gz');assert(!fs.existsSync(previous));
 fs.writeFileSync(previous,gzipSync(fs.readFileSync(target)));fs.unlinkSync(target);
}
assert(!fs.existsSync(target),'Preserve completed publication manifest');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const rows=[],publish=new Set();
const number=name=>Number(name.match(/^(\d{3})-/)?.[1]||0);
for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
 const n=number(entry.name);if(n<362||n>652||entry.name==='399-manifiesto-final.json'||!entry.isFile())continue;
 const file=path.join(dir,entry.name),bytes=fs.readFileSync(file);
 if(!/\.(mjs|cjs|ts|tsx|md|json|log|gz|png|jpg|mp4|webm)$/.test(entry.name))continue;
 let published=entry.name,encoding='identity';
 if(entry.name.endsWith('.log')||(entry.name.endsWith('.json')&&bytes.length>256*1024)){
  published=entry.name+'.gz';encoding='gzip';const compressed=gzipSync(bytes);
  if(fs.existsSync(path.join(dir,published)))assert.equal(sha(fs.readFileSync(path.join(dir,published))),sha(compressed),'Existing archive changed: '+published);
  else fs.writeFileSync(path.join(dir,published),compressed);
 }
 publish.add(published);rows.push({original:entry.name,bytes:bytes.length,sha256:sha(bytes),published,encoding});
}
const artifacts=[];
for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
 const n=number(entry.name);if(n<362||n>652||!entry.isDirectory()||!entry.name.includes('artifacts'))continue;
 const walk=folder=>{for(const e of fs.readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,e.name);if(e.isDirectory()&&!e.isSymbolicLink())walk(file);else if(e.isFile()){
  if(e.name==='error-context.md.gz')continue;
  const bytes=fs.readFileSync(file),relative=path.relative(dir,file).replaceAll('\\','/');
  let published=null;
  if(e.name==='error-context.md'){
   published=relative+'.gz';const zipped=gzipSync(bytes);
   if(fs.existsSync(file+'.gz'))assert.equal(sha(fs.readFileSync(file+'.gz')),sha(zipped));else fs.writeFileSync(file+'.gz',zipped);
  }else if(e.name.endsWith('.png')&&bytes.length<512*1024)published=relative;
  artifacts.push({file:relative,bytes:bytes.length,sha256:sha(bytes),published,publication:published?(published.endsWith('.gz')?'GZIP_EXACT_ORIGINAL_BYTES':'same-path'):'LOCAL_ONLY_TRACE_OR_LARGE_ARTIFACT'});
  if(published)publish.add(published);
 }}};walk(path.join(dir,entry.name));
}
for(const name of['387-factura-error-no-es-ausencia.test.tsx','400-informe-final.md','390-conciliacion-final.json','391-limpieza-final-qa.json','388-recordatorios-motor.json'])assert(publish.has(name),'Missing critical evidence '+name);
const list=[...publish].sort();
const output={created:new Date().toISOString(),scope:'Final362-652 supplement; earlier316/360 packages retained. No app/source edit. Logs, generated Playwright error-contexts and large JSON published gzipped; exact uncompressed SHA retained including original whitespace. Pre-staging manifests preserved. Trace ZIP and large artifacts remain local and are NOT falsely advertised as uploaded. Raw binary QA snapshots are excluded.650 supersedes597 for the finite native continuation,640 latest ledger,652 hygiene.',sources:{main:'3e45a4ac6b479f89605163168e31b37dc84f2d0f',historicalNative:'917a98e32c63fe2f832f5cdc16db87f4fc722b6c',nativeAndCanonical978:'978af7d65a60bd287f3ee3cc05037a29566074f4',finalCandidate:'f8f7cf34e8778de784b20e2654058fd722b2a2ec'},records:rows,artifacts,publish:list,publishedFiles:list.length,publishedBytes:list.reduce((n,name)=>n+fs.statSync(path.join(dir,name)).size,0),localOnlyArtifacts:artifacts.filter(a=>a.publication.startsWith('LOCAL_ONLY')).length};
fs.writeFileSync(target,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({publishedFiles:output.publishedFiles,publishedBytes:output.publishedBytes,artifacts:artifacts.length,localOnlyArtifacts:output.localOnlyArtifacts}));
