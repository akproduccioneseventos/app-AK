import fs from 'node:fs';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
const dir=new URL('./',import.meta.url),previous=JSON.parse(fs.readFileSync(new URL('430-emuladores.json',dir),'utf8'));assert(previous.finished&&previous.cleanupStatus===200);
const artifact=JSON.parse(fs.readFileSync(new URL('427-entorno.json',dir),'utf8'));const r=spawnSync('git',['diff','--name-only'],{cwd:artifact.qa,encoding:'utf8'});assert.equal(r.status,0);assert.equal(r.stdout.trim(),'');
await import('./439-preparar-control-final.mjs');
await import('./440-sdk-emuladores.mjs');
