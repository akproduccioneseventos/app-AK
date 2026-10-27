import fs from'node:fs';import path from'node:path';import os from'node:os';import assert from'node:assert/strict';import{fileURLToPath,pathToFileURL}from'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),state=path.join(dir,'645-continuidad.json');assert(!fs.existsSync(state));
const prior=JSON.parse(fs.readFileSync(path.join(dir,'638-entorno.json'),'utf8'));assert(prior.finished&&prior.sourceDiff==='');
const r={source:prior.source,phase:'waiting-memory',started:new Date().toISOString(),appEdited:false,realServices:false};const save=()=>fs.writeFileSync(state,JSON.stringify(r,null,2)+'\n');save();
const until=Date.now()+15*60000;while(os.freemem()<3.5*1024**3){assert(Date.now()<until);await new Promise(ok=>setTimeout(ok,15000));}
function rename(text,pairs){const original=[...text.matchAll(/[a-f0-9]{40}/g)].map(m=>m[0]),hashes=[];text=text.replace(/[a-f0-9]{40}/g,h=>{hashes.push(h);return'__PRESERVED_HASH_'+(hashes.length-1)+'__';});for(const[a,b]of pairs)text=text.replaceAll(a,b);text=text.replace(/__PRESERVED_HASH_(\d+)__/g,(_,i)=>hashes[Number(i)]);assert.deepEqual([...text.matchAll(/[a-f0-9]{40}/g)].map(m=>m[0]),original,'No source SHA may change while renaming QA');return text;}
fs.copyFileSync(path.join(dir,'632-config.ts'),path.join(dir,'648-config.ts'));
let b=rename(fs.readFileSync(path.join(dir,'631-muro-final.mjs'),'utf8'),[['631','646'],['633','647'],['632-config.ts','648-config.ts']]);
const marker="const physical=path.join(dir,'647-driver.mjs');";assert(b.includes(marker));b=b.replace(marker,"code=code.replaceAll('--max-old-space-size=1024','--max-old-space-size=512');\n"+marker);
const builder=path.join(dir,'646-muro-preparador.mjs');assert(!fs.existsSync(builder));fs.writeFileSync(builder,b);
let s=rename(fs.readFileSync(path.join(dir,'584-supervisor-aislado.mjs'),'utf8'),[['584','649'],['583','646'],['585','647']]).replaceAll('646-medios-generado.mjs','646-muro-preparador.mjs').replaceAll('-Xmx512m','-Xmx384m').replaceAll('--max-old-space-size=512','--max-old-space-size=256');
const sup=path.join(dir,'649-supervisor-generado.mjs');assert(!fs.existsSync(sup));fs.writeFileSync(sup,s);r.phase='running649';save();
try{await import(pathToFileURL(sup).href);}finally{r.phase='finished';r.finished=new Date().toISOString();save();}
