import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url));
const build=JSON.parse(fs.readFileSync(path.join(dir,'406-entorno.json'),'utf8'));assert.equal(build.phase,'built');
const extra=path.join(build.qa,'tests/e2e/408-camara-preview.spec.ts');assert(!fs.existsSync(extra));
let code=fs.readFileSync(path.join(dir,'394-validar-consumidores-finales.mjs'),'utf8')
 .replaceAll('394','409').replaceAll('395','410').replaceAll('392-entorno.json','406-entorno.json')
 .replaceAll('expected:3','expected:7').replaceAll('list.length,3','list.length,7').replaceAll('Only3','Only7')
 .replace('/ak207-393-barra-contraste|ak207-prospecto-simulador','/ak207-408-camara-preview|ak207-393-barra-contraste|ak207-prospecto-simulador')
 .replace("'393-barra-contraste.spec.ts,prospecto-simulador.spec.ts'","'393-barra-contraste.spec.ts,prospecto-simulador.spec.ts,408-camara-preview.spec.ts'");
const file=path.join(dir,'409-controlador-generado.mjs');assert(!fs.existsSync(file));fs.writeFileSync(file,code);
fs.copyFileSync(path.join(dir,'408-camara-preview.spec.ts'),extra);
try{await import(new URL('./409-controlador-generado.mjs',import.meta.url));}
finally{if(fs.existsSync(extra))fs.unlinkSync(extra);}
