import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{fileURLToPath,pathToFileURL}from'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),state=path.join(dir,'625-continuidad.json');assert(!fs.existsSync(state));
const record={source:'f8f7cf34e8778de784b20e2654058fd722b2a2ec',phase:'waiting617',started:new Date().toISOString(),appEdited:false,realServices:false};const save=()=>fs.writeFileSync(state,JSON.stringify(record,null,2)+'\n');save();
const until=Date.now()+45*60000;while(true){const r=JSON.parse(fs.readFileSync(path.join(dir,'617-continuidad.json'),'utf8'));if(r.finished)break;assert(Date.now()<until);await new Promise(ok=>setTimeout(ok,10000));}
fs.writeFileSync(path.join(dir,'626-config.ts'),"import{defineConfig}from'@playwright/test';import base from'./208-config';export default defineConfig({...base,globalTimeout:12*60*1000,projects:base.projects?.map(p=>({...p,grep:/ak207-624-muro-real/}))});\n");
let b=fs.readFileSync(path.join(dir,'608-recorridos-generados.mjs'),'utf8').replaceAll('608','627').replaceAll('609','628').replaceAll('607-seleccion-config.ts','626-config.ts').replaceAll('list.length===15','list.length===2');
const l=b.split('\n').find(l=>l.startsWith('process.env.AK_AUDIT_SPEC_FILTER='));assert(l);b=b.replace(l,"process.env.AK_AUDIT_SPEC_FILTER='624-muro-real.spec.ts';process.env.AK_AUDIT_SKIP_PORTAL='true';process.env.AK_AUDIT_BATCH_SIZE='1';");
const marker='const additions=[];for(const name of [';assert(b.includes(marker));b=b.replace(marker,marker+'"624-muro-real.spec.ts",');
const builder=path.join(dir,'627-preparador-generado.mjs');assert(!fs.existsSync(builder));fs.writeFileSync(builder,b);
let s=fs.readFileSync(path.join(dir,'584-supervisor-aislado.mjs'),'utf8').replaceAll('584','629').replaceAll('583','627').replaceAll('585','628').replaceAll('627-medios-generado.mjs','627-preparador-generado.mjs');
const sup=path.join(dir,'629-supervisor-generado.mjs');assert(!fs.existsSync(sup));fs.writeFileSync(sup,s);record.phase='running629';save();
try{await import(pathToFileURL(sup).href);}finally{record.phase='finished';record.finished=new Date().toISOString();save();}
