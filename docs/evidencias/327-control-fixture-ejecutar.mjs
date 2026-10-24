import fs from 'node:fs';
import assert from 'node:assert/strict';
let code=fs.readFileSync(new URL('./295-ejecutar-nativos-focales.mjs',import.meta.url),'utf8');
assert(code.includes("home:'295'")&&code.includes('294-home-interaccion-real.spec.ts'));
code=code.replaceAll("home:'295'","home:'327'").replaceAll('294-home-interaccion-real.spec.ts','326-control-fixture-navegacion.spec.ts');
// Copied beside the existing E2E helpers, not kept under docs in the QA checkout.
const original=new URL('./326-control-fixture-navegacion.spec.ts',import.meta.url),bytes=fs.readFileSync(original,'utf8');
const prepared=bytes.replaceAll('../../tests/e2e/helpers/','./helpers/');
const source=new URL('./326-control-fixture-navegacion-qa.spec.ts',import.meta.url);assert(!fs.existsSync(source));fs.writeFileSync(source,prepared);
code=code.replaceAll('326-control-fixture-navegacion.spec.ts','326-control-fixture-navegacion-qa.spec.ts');
const target=new URL('./327-driver.mjs',import.meta.url);assert(!fs.existsSync(target));fs.writeFileSync(target,code);await import('./327-driver.mjs');
