import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'node_modules/firebase-tools/lib/emulator/downloadableEmulatorInfo.json'),'utf8')).storage;
assert.equal(new URL(manifest.remoteUrl).hostname,'storage.googleapis.com');
const cache='C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-tools/firebase-emulators';
fs.mkdirSync(cache,{recursive:true});
const target=path.join(cache,manifest.downloadPathRelativeToCacheDir);
let downloaded=false;
if(!fs.existsSync(target)){
  const response=await fetch(manifest.remoteUrl,{signal:AbortSignal.timeout(180000)});assert.equal(response.status,200);
  const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.length,manifest.expectedSize);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),manifest.expectedChecksumSHA256);
  fs.writeFileSync(target,bytes,{flag:'wx'});downloaded=true;
}
const hash=crypto.createHash('sha256');for await(const bytes of fs.createReadStream(target))hash.update(bytes);
assert.equal(hash.digest('hex'),manifest.expectedChecksumSHA256);
const receipt={downloaded,target,version:manifest.version,sha256:manifest.expectedChecksumSHA256,vendorUrl:manifest.remoteUrl,productionDependencyAdded:false,appEdited:false,finished:new Date().toISOString()};
fs.writeFileSync(path.join(root,'docs/evidencias/300-storage-vendor.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));
