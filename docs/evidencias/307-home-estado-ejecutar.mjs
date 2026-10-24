import fs from 'node:fs';
import assert from 'node:assert/strict';
let code=fs.readFileSync(new URL('./295-ejecutar-nativos-focales.mjs',import.meta.url),'utf8');
assert(code.includes("home:'295'")&&code.includes('294-home-interaccion-real.spec.ts'));
code=code.replaceAll("home:'295'","home:'307'").replaceAll('294-home-interaccion-real.spec.ts','306-home-clic-y-estado.spec.ts');
const target=new URL('./307-driver-home.mjs',import.meta.url);assert(!fs.existsSync(target));
fs.writeFileSync(target,code);await import('./307-driver-home.mjs');
