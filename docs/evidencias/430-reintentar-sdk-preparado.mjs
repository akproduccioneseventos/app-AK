import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url));
const prepared=JSON.parse(fs.readFileSync(path.join(dir,'427-entorno.json'),'utf8'));assert.equal(prepared.source,'917a98e32c63fe2f832f5cdc16db87f4fc722b6c');assert.equal(prepared.phase,'built');assert(prepared.runtimeFiles>3000);assert(fs.existsSync(path.join(prepared.qa,'.next/BUILD_ID')));
const previous=JSON.parse(fs.readFileSync(path.join(dir,'426-emuladores.json'),'utf8'));assert(previous.finished&&previous.cleanupStatus===200,'Prior emulator processes must be stopped first');
const target=path.join(dir,'430-emuladores-generado.mjs');assert(!fs.existsSync(target));fs.writeFileSync(target,fs.readFileSync(path.join(dir,'426-sdk-emuladores.mjs'),'utf8').replaceAll('426','430'));
await import(new URL('./430-emuladores-generado.mjs',import.meta.url));
