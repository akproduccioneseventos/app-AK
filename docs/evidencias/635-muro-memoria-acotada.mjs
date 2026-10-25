import fs from'node:fs';import path from'node:path';import os from'node:os';import assert from'node:assert/strict';import{fileURLToPath,pathToFileURL}from'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url));const prior=JSON.parse(fs.readFileSync(path.join(dir,'634-entorno.json'),'utf8'));assert(prior.finished&&prior.cleanupStatus===200&&prior.sourceDiff==='');
const state=path.join(dir,'635-continuidad.json');assert(!fs.existsSync(state));const r={source:prior.source,phase:'waiting-memory',started:new Date().toISOString(),appEdited:false,realServices:false,nodeServerHeapMiB:512,storageHeapMiB:256,firestoreHeapMiB:384};const save=()=>fs.writeFileSync(state,JSON.stringify(r,null,2)+'\n');save();
const until=Date.now()+15*60000;while(os.freemem()<3.5*1024**3){assert(Date.now()<until,'No safe resources for final bounded attempt');await new Promise(ok=>setTimeout(ok,15000));}
fs.copyFileSync(path.join(dir,'632-config.ts'),path.join(dir,'637-config.ts'));
let b=fs.readFileSync(path.join(dir,'631-muro-final.mjs'),'utf8').replaceAll('631','636').replaceAll('633','639').replaceAll('632-config.ts','637-config.ts');
const anchor='const physical=path.join(dir,\'639-driver.mjs\');';assert(b.includes(anchor));b=b.replace(anchor,"code=code.replaceAll('--max-old-space-size=1024','--max-old-space-size=512');\n"+anchor);
const builder=path.join(dir,'636-muro-preparador.mjs');assert(!fs.existsSync(builder));fs.writeFileSync(builder,b);
let s=fs.readFileSync(path.join(dir,'584-supervisor-aislado.mjs'),'utf8').replaceAll('584','638').replaceAll('583','636').replaceAll('585','639').replaceAll('636-medios-generado.mjs','636-muro-preparador.mjs').replaceAll('-Xmx512m','-Xmx384m').replaceAll('--max-old-space-size=512','--max-old-space-size=256');
const sup=path.join(dir,'638-supervisor-generado.mjs');assert(!fs.existsSync(sup));fs.writeFileSync(sup,s);r.phase='running638';r.free=os.freemem();save();
try{await import(pathToFileURL(sup).href);}finally{r.phase='finished';r.finished=new Date().toISOString();save();}
