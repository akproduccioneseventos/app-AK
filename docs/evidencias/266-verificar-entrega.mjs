import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),source='725e62ba2f909578628fad47402d125ed9632c70';
const target=path.join(root,'docs/evidencias/266-entrega-verificada.json');assert(!fs.existsSync(target),'Preserve');
const checks=[];const check=(id,value,observed)=>{checks.push({id,pass:Boolean(value),observed});assert(value,id);};
function git(args){const r=spawnSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:8*1024**2});assert.equal(r.status,0,r.stderr);return r.stdout;}
const json=file=>JSON.parse(fs.readFileSync(path.join(root,'docs/evidencias',file),'utf8'));
let unexpected;
try{
 check('exact-source-commit-available',git(['rev-parse',`${source}^{commit}`]).trim()===source,source);
 const aggregate={total:0,pass:0,fail:0};
 for(const file of ['260-aprobacion-reintento.json','261-costos-y-senia.json','263-aprobacion-sdk.json','264-contrato-guardado-sdk.json']){
  const r=json(file);check(`${file}-source`,r.source===source,r.source);check(`${file}-no-unexpected`,!r.unexpected,r.unexpected||null);
  const cases=r.cases||r.results;assert(Array.isArray(cases),file);const counts={total:cases.length,pass:cases.filter(c=>c.pass).length,fail:cases.filter(c=>!c.pass).length};
  check(`${file}-counts`,counts.total===r.summary.total&&counts.pass===r.summary.pass&&counts.fail===r.summary.fail,counts);
  for(const key of Object.keys(aggregate))aggregate[key]+=counts[key];
  for(const [file,hash] of Object.entries(r.hashes||{})){assert.equal(crypto.createHash('sha256').update(git(['show',`${source}:${file}`])).digest('hex'),hash,file);}
 }
 check('aggregate-14-criteria-11-pass-3-fail',aggregate.total===14&&aggregate.pass===11&&aggregate.fail===3,aggregate);
 for(const n of ['263','264']){const r=json(`${n}-ejecucion.json`);check(`${n}-cleanup-and-intended-test-failure`,r.cleanupStatus===200&&r.exitCode===1&&!r.error&&!r.probeTimedOut,{exitCode:r.exitCode,cleanupStatus:r.cleanupStatus});}
 const initial=json('262-ejecucion.json');check('262-is-qa-error-before-cases',initial.exitCode===1&&initial.cleanupStatus===200&&!fs.existsSync(path.join(root,'docs/evidencias/262-aprobacion-sdk.json')),{exitCode:initial.exitCode,cleanupStatus:initial.cleanupStatus});
 const scripts=['260-aprobacion-reintento.mjs','261-costos-y-senia.mjs','262-aprobacion-sdk.mjs','262-ejecutar.mjs','263-aprobacion-sdk.mjs','263-ejecutar.mjs','264-contrato-guardado-sdk.mjs','264-ejecutar.mjs','266-verificar-entrega.mjs'];
 for(const script of scripts){const r=spawnSync(process.execPath,['--check',path.join(root,'docs/evidencias',script)],{encoding:'utf8'});check(`syntax-${script}`,r.status===0,r.stderr||'PASS');}
 for(const [file,symbol] of [
  ['src/app/(app)/fiestas/nueva/plan-pagos/page.tsx','approveClientPayment'],
  ['src/app/(app)/fiestas/nueva/gestion-documental/contrato-servicio/page.tsx','updateContratoFiestaActual'],
  ['src/app/actions/fiesta-actual.ts','updateFiestaPartial'],
  ['src/app/actions/fiesta/fiesta.actions.ts','updateDataPartial'],
 ]){const body=git(['show',`${source}:${file}`]);check(`source-consumer-${symbol}`,body.includes(symbol),file);}
 const lines=fs.readFileSync(path.join(root,'ESTADO-ACTUAL.md'),'utf8').trimEnd().split(/\r?\n/).length;check('state-at-most40-lines',lines<=40,lines);
 const tracked=git(['diff','--name-only','HEAD']).trim().split(/\r?\n/).filter(Boolean);check('no-tracked-app-edits',tracked.every(file=>file==='ESTADO-ACTUAL.md'||file.startsWith('docs/')),tracked);
}catch(e){unexpected=String(e.stack||e);process.exitCode=1;}
finally{const receipt={source,checks,unexpected,appAcceptance:false,scope:'Integrity/syntax/source-hash/consumer verification only. Test failures in260/263/264 intentionally retained, TWO causes not accepted. No new app tests rerun.'};fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));}
