import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),build=JSON.parse(fs.readFileSync(path.join(dir,'427-entorno.json'),'utf8'));
const end=Date.now()+20*60*1000;
while(true){try{const r=JSON.parse(fs.readFileSync(path.join(dir,'471-emuladores.json'),'utf8'));if(r.finished){assert.equal(r.cleanupStatus,200);break;}}catch(error){if(error.code!=='ENOENT')throw error;}if(Date.now()>end)throw Error('Previous SDK still active; no overlapping browser');await new Promise(ok=>setTimeout(ok,15000));}
let code=fs.readFileSync(path.join(dir,'446-reensayar-geometria-y-barra.mjs'),'utf8').replaceAll('446','475').replaceAll('448','477').replaceAll('expected:4','expected:1').replaceAll('list.length,4','list.length,1');
code=code.replace("assert(os.freemem()>=1024**3,","assert(os.freemem()>=1.5*1024**3,");
code=code.replace("p.name==='chromium-desktop'?/ak207-layout-baseline|ak207-mobile-overflow.*rutas internas del staff|ak207-89.*trago con stock 0/:/ak207-layout-baseline/","p.name==='chromium-desktop'?/ak207-474/:/$a/");
code=code.replace("layout-baseline.spec.ts,mobile-overflow.spec.ts,89-la-barra-no-ofrece-lo-agotado.spec.ts","474-carga-contexto-controlado.spec.ts");
const file=path.join(dir,'476-carga-generada.mjs');assert(!fs.existsSync(file));fs.writeFileSync(file,code);
const addition=path.join(build.qa,'tests/e2e/474-carga-contexto-controlado.spec.ts');assert(!fs.existsSync(addition));fs.copyFileSync(path.join(dir,'474-carga-contexto-controlado.spec.ts'),addition);
try{await import(pathToFileURL(file).href);}finally{if(fs.existsSync(addition))fs.unlinkSync(addition);}
