import fs from 'node:fs';
import assert from 'node:assert/strict';
const source='917a98e32c63fe2f832f5cdc16db87f4fc722b6c';
const dir=new URL('./',import.meta.url);
const current=JSON.parse(fs.readFileSync(new URL('385-delta-publico.json',dir),'utf8'));
assert.equal(current.source,source);assert.equal(current.phase,'finished');
assert.equal(current.canonical.exit,0);
const target=new URL('392-entorno-actual.mjs',dir);
assert(!fs.existsSync(target),'Preserve existing source and receipts');
let code=fs.readFileSync(new URL('366-entorno-actual.mjs',dir),'utf8');
assert(code.includes('3e45a4ac6b479f89605163168e31b37dc84f2d0f'));
code=code.replaceAll('366','392')
 .replaceAll('3e45a4ac6b479f89605163168e31b37dc84f2d0f',source)
 .replace('.qa-392-main-','.qa-392-candidate-');
fs.writeFileSync(target,code);
await import(target.href);
