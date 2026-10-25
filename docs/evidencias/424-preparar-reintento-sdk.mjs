import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url));
let child=fs.readFileSync(path.join(dir,'420-recorridos-sdk.mjs'),'utf8')
 .replaceAll('420','424').replaceAll('422','425').replaceAll('406-entorno.json','427-entorno.json')
 .replaceAll('.qa-392-candidate-','.qa-427-source-')
 .replace('ak207-48-touchpix.*ENT-03/','ak207-48-touchpix.*ENT-03: sesion segura|ak207-espejo-moderacion.*con el analisis de imagen caido/')
 .replaceAll('expected:8','expected:9').replaceAll('list.length,8','list.length,9').replaceAll('Only8','Only9')
 .replace('423-barra-pixeles.spec.ts,90-','espejo-moderacion-caida-y-reintento.spec.ts,423-barra-pixeles.spec.ts,90-')
 .replace("import {fileURLToPath} from 'node:url';","import {fileURLToPath,pathToFileURL} from 'node:url';");
const old="try{await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));}\nfinally{if(fs.existsSync(addition))fs.unlinkSync(addition);}";
assert(child.includes(old));
const protection=`const dataBefore=new Map();
const files=()=>{const out=[];const visit=folder=>{if(!fs.existsSync(folder))return;for(const e of fs.readdirSync(folder,{withFileTypes:true})){const p=path.join(folder,e.name);if(e.isDirectory()&&!e.isSymbolicLink())visit(p);else if(e.isFile()&&p.endsWith('.json'))out.push(p);}};for(const sub of['data','src/data'])visit(path.join(build.qa,sub));return out;};
for(const p of files())dataBefore.set(p,fs.readFileSync(p));
const backup=path.join(build.qa,'.qa424-private-data-snapshot.json');fs.writeFileSync(backup,JSON.stringify([...dataBefore].map(([p,b])=>[p,b.toString('base64')])));
const physical=path.join(dir,'425-driver.mjs');assert(!fs.existsSync(physical));fs.writeFileSync(physical,code);
try{await import(pathToFileURL(physical).href);}
finally{
 for(const p of files())if(!dataBefore.has(p))fs.unlinkSync(p);for(const[p,b]of dataBefore)fs.writeFileSync(p,b);
 if(fs.existsSync(addition))fs.unlinkSync(addition);
 for(const name of['ak207-423-barra-pixeles.spec.ts','ak207-90-lo-que-va-atras-dice-donde-quedo.spec.ts','ak207-48-touchpix-entrega-sin-reinicio.spec.ts','ak207-prospecto-simulador.spec.ts','ak207-espejo-moderacion-caida-y-reintento.spec.ts']){const p=path.join(build.qa,'tests/e2e',name);if(fs.existsSync(p))fs.unlinkSync(p);}
 for(const name of['208-config.ts','425-config.ts','208-egress-guard.cjs']){const p=path.join(build.qa,name);if(fs.existsSync(p))fs.unlinkSync(p);}
 fs.unlinkSync(backup);
}`;
child=child.replace(old,protection);
const file=path.join(dir,'424-recorridos-sdk.mjs');assert(!fs.existsSync(file));fs.writeFileSync(file,child);
let parent=fs.readFileSync(path.join(dir,'421-sdk-emuladores.mjs'),'utf8').replaceAll('421','426').replaceAll('420','424');
const parentFile=path.join(dir,'426-sdk-emuladores.mjs');assert(!fs.existsSync(parentFile));fs.writeFileSync(parentFile,parent);
console.log(JSON.stringify({child:'424-recorridos-sdk.mjs',parent:'426-sdk-emuladores.mjs',scope:'Exact narrowTouchpix selection plus remaining Vision-failure mobile variant; persistent outer data snapshot and physical driver avoid preflight cleanup gap/dataURI noise. No app edit.'}));
