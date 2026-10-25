import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),old=fs.readFileSync(path.join(dir,'267-entorno-actual.mjs'),'utf8');
const code=old.replaceAll('267','280').replaceAll('725e62ba2f909578628fad47402d125ed9632c70','3e45a4ac6b479f89605163168e31b37dc84f2d0f');
const target=path.join(dir,'280-entorno-actual.mjs');assert(!fs.existsSync(target));fs.writeFileSync(target,code);
await import('./280-entorno-actual.mjs');
