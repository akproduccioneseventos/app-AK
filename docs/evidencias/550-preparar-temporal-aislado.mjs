import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url));assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'548-orphan-cleanup.json'),'utf8')).sourceDiff,'');
const file=path.join(dir,'551-recorridos-sdk.mjs');assert(!fs.existsSync(file));
fs.writeFileSync(file,fs.readFileSync(path.join(dir,'539-recorridos-sdk.mjs'),'utf8').replaceAll('539','551').replaceAll('542','554'));
console.log(JSON.stringify({prepared:file,source:'978af7d65a60bd287f3ee3cc05037a29566074f4',assertionsChanged:false,fixtureTransport:'demo Firestore REST; application still Admin SDK'}));
