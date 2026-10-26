import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import assert from'node:assert/strict';import{gzipSync}from'node:zlib';import{fileURLToPath}from'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),root=path.resolve(dir,'../..');
const pipeline=JSON.parse(fs.readFileSync(path.join(dir,'673-secuencia.json'),'utf8'));assert(pipeline.finished,'Do not package an active run');
const source='cce8299c18237d9dd432120751d39d4154b7e58b';assert.equal(pipeline.source,source);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');const files=[],stage=new Set();
for(const name of fs.readdirSync(dir).sort()){
 if(!/^(?:65[3-9]|66\d|67[0-6])-/.test(name)||name==='674-entrega-manifest.json'||name==='674-staging.json')continue;
 const p=path.join(dir,name);if(!fs.statSync(p).isFile()||name.endsWith('.gz'))continue;
 const bytes=fs.readFileSync(p);let stored=name;
 if(name.endsWith('.log')||(name.endsWith('-resultados.json')&&bytes.length>65536)){
  stored=name+'.gz';fs.writeFileSync(path.join(dir,stored),gzipSync(bytes));
 }
 files.push({original:name,stored,bytes:bytes.length,sha256:hash(bytes),storedSha256:hash(fs.readFileSync(path.join(dir,stored)))});stage.add('docs/evidencias/'+stored);
}
for(const folder of['663-capturas','668-capturas','672-capturas']){
 const p=path.join(dir,folder);if(!fs.existsSync(p))continue;
 for(const name of fs.readdirSync(p).sort()){
  const file=path.join(p,name);if(!fs.statSync(file).isFile())continue;const bytes=fs.readFileSync(file);files.push({original:folder+'/'+name,stored:folder+'/'+name,bytes:bytes.length,sha256:hash(bytes)});stage.add('docs/evidencias/'+folder+'/'+name);
 }
}
const manifest={source,generated:new Date().toISOString(),pipeline:pipeline.phase,extraction:'For a .gz entry, gunzip preserves original bytes; sha256 is of the original file.',externalAccounts:false,files};
fs.writeFileSync(path.join(dir,'674-entrega-manifest.json'),JSON.stringify(manifest,null,2)+'\n');stage.add('docs/evidencias/674-entrega-manifest.json');
fs.writeFileSync(path.join(dir,'674-staging.json'),JSON.stringify([...stage].sort(),null,2)+'\n');
console.log(JSON.stringify({source,files:files.length,staged:stage.size,root}));
