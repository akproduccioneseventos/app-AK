import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const record = JSON.parse(fs.readFileSync(new URL('151-entorno.json', import.meta.url)));
assert.equal(record.buildExit, 0);
const found = {};
function scan(folder) {
  for (const item of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, item.name);
    if (item.isDirectory()) scan(file);
    else if (item.name.endsWith('.js')) {
      for (const m of fs.readFileSync(file, 'utf8').matchAll(/createServerReference\)\("([a-f0-9]+)",[^)]*,"(saveFiesta|getFiestaById)"\)/g)) {
        found[m[2]] ??= {}; found[m[2]][m[1]] ??= []; found[m[2]][m[1]].push(path.relative(record.qa, file));
      }
    }
  }
}
scan(path.join(record.qa, '.next/static/chunks'));
const manifest = JSON.parse(fs.readFileSync(path.join(record.qa, '.next/server/server-reference-manifest.json')));
const refs = Object.entries(found).flatMap(([name, ids]) => Object.entries(ids).map(([id, chunks]) => ({ name, id, chunks,
  workers: manifest.node?.[id]?.workers ?? manifest.edge?.[id]?.workers ?? null })));
const out = new URL('151-descubrir-acciones.json', import.meta.url);
assert.equal(fs.existsSync(out), false, 'Preserve receipt');
fs.writeFileSync(out, JSON.stringify({ source: record.source, refs }, null, 2));
console.log(JSON.stringify(refs));
