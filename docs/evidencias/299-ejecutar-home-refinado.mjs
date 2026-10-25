import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url));
const original=fs.readFileSync(path.join(dir,'295-ejecutar-nativos-focales.mjs'),'utf8');
const code=original.replaceAll("home:'295'","home:'299'").replaceAll('294-home-interaccion-real.spec.ts','298-home-esperar-desplazamiento.spec.ts');
const target=path.join(dir,'299-driver-home.mjs');assert(!fs.existsSync(target));fs.writeFileSync(target,code);
await import('./299-driver-home.mjs');
