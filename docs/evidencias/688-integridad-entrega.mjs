import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import crypto from'node:crypto';import{spawnSync}from'node:child_process';import{gunzipSync}from'node:zlib';import{fileURLToPath}from'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),root=path.resolve(dir,'../..'),manifest=JSON.parse(fs.readFileSync(path.join(dir,'686-entrega-manifest.json'),'utf8'));
assert.equal(manifest.source,'d4c69f2b2395ad3abcaee4fb166bcefbdc1457e0');
const git=spawnSync('git',['ls-files','--stage','-z','--','docs/evidencias'],{cwd:root});assert.equal(git.status,0);
const index=new Map(git.stdout.toString('utf8').split('\0').filter(Boolean).map(record=>{const tab=record.indexOf('\t'),meta=record.slice(0,tab).split(' ');return[record.slice(tab+1),meta[1]];}));
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');let bytes=0;
for(const entry of manifest.files){
 const stored=fs.readFileSync(path.join(dir,entry.stored));assert.equal(sha256(stored),entry.storedSha256||entry.sha256,'Stored checksum '+entry.stored);
 const original=entry.stored!==entry.original?gunzipSync(stored):stored;assert.equal(sha256(original),entry.sha256,'Original checksum '+entry.original);
 const gitHash=crypto.createHash('sha1').update('blob '+stored.length+'\0').update(stored).digest('hex');assert.equal(index.get('docs/evidencias/'+entry.stored),gitHash,'Index differs from evidence bytes '+entry.stored);bytes+=stored.length;
}
console.log(JSON.stringify({source:manifest.source,verifiedOriginals:manifest.files.length,bytes,gitIndexMatches:true}));
