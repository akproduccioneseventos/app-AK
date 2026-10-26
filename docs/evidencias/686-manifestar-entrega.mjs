import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import assert from'node:assert/strict';import{gzipSync}from'node:zlib';import{fileURLToPath}from'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),root=path.resolve(dir,'../..');
const pipeline=JSON.parse(fs.readFileSync(path.join(dir,'684-secuencia.json'),'utf8'));assert(pipeline.finished,'Do not package an active run');
const source='d4c69f2b2395ad3abcaee4fb166bcefbdc1457e0';assert.equal(pipeline.source,source);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');const files=[],stage=new Set();
for(const name of fs.readdirSync(dir).sort()){
 if(!/^(?:65[3-9]|66\d|6[78]\d)-/.test(name)||name==='686-entrega-manifest.json'||name==='686-staging.json')continue;
 const p=path.join(dir,name);if(!fs.statSync(p).isFile()||name.endsWith('.gz'))continue;
 const bytes=fs.readFileSync(p);let stored=name;
 if(name.endsWith('.log')||(name.endsWith('-resultados.json')&&bytes.length>65536)||bytes.includes(Buffer.from('\r\n'))){
  stored=name+'.gz';fs.writeFileSync(path.join(dir,stored),gzipSync(bytes));
 }
 files.push({original:name,stored,bytes:bytes.length,sha256:hash(bytes),storedSha256:hash(fs.readFileSync(path.join(dir,stored)))});stage.add('docs/evidencias/'+stored);
}
for(const folder of['663-capturas','668-capturas','672-capturas','677-capturas','678-capturas','679-capturas','682-capturas']){
 const p=path.join(dir,folder);if(!fs.existsSync(p))continue;
 for(const name of fs.readdirSync(p).sort()){
  const file=path.join(p,name);if(!fs.statSync(file).isFile())continue;const bytes=fs.readFileSync(file);files.push({original:folder+'/'+name,stored:folder+'/'+name,bytes:bytes.length,sha256:hash(bytes)});stage.add('docs/evidencias/'+folder+'/'+name);
 }
}
const manifest={source,generated:new Date().toISOString(),pipeline:pipeline.phase,extraction:'For a .gz entry, gunzip preserves original bytes; sha256 is of the original file.',artifactAttributes:'docs/evidencias/.gitattributes disables text normalization for this audit batch; stored byte hashes are preserved across platforms.',externalAccounts:false,files};
fs.writeFileSync(path.join(dir,'686-entrega-manifest.json'),JSON.stringify(manifest,null,2)+'\n');stage.add('docs/evidencias/686-entrega-manifest.json');
fs.writeFileSync(path.join(dir,'686-staging.json'),JSON.stringify([...stage].sort(),null,2)+'\n');
console.log(JSON.stringify({source,files:files.length,staged:stage.size,root}));
