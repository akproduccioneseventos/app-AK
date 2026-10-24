import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),receipt=process.argv[2]||'340';assert(['340','344'].includes(receipt));
const runId=receipt==='344'?'33803':'33802',target=path.join(dir,receipt+'-excepciones-continuidad.json');assert(!fs.existsSync(target));
const source='3e45a4ac6b479f89605163168e31b37dc84f2d0f',read=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
const prior=read('337-excepciones-continuidad.json'),first=read('33801-recorrido-resultados.json');assert.equal(prior.source,source);assert.equal(prior.phase,'finished');assert.equal(read('33801-ejecucion.json').sourceDiff,'');
if(receipt==='344'){assert.equal(read('340-excepciones-continuidad.json').phase,'finished');assert.equal(read('33802-ejecucion.json').sourceDiff,'');}
const seen=new Set(first.map(r=>r.routeTemplate)),selected=prior.selected.filter(r=>!seen.has(r));assert.equal(selected.length,11);assert(os.freemem()>=2*1024**3,'No native continuation under2GiB');
const record={source,pid:process.pid,phase:'forensics-remaining-only',started:new Date().toISOString(),appEdited:false,selected,priorRows:first.length,reason:'Own339 interruption preserved first4. Standard Playwright screenshot timeout2000 instead of unbounded CDP. No app/assertion changes.'};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
try{
 const log=fs.createWriteStream(path.join(dir,runId+'-control.log'));
 const child=spawn(process.execPath,[path.join(dir,'333-recorrido-tramo.mjs'),runId,JSON.stringify(selected)],{cwd:root,env:process.env,stdio:['ignore','pipe','pipe']});record.childPid=child.pid;save();child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
 try{record.exitCode=await new Promise((yes,no)=>{child.once('exit',yes);child.once('error',no);});}finally{await new Promise(yes=>log.end(yes));}
 const build=read('291-entorno.json');assert.equal(build.source,source);let rows=null;
 for(const name of['resultados.json','partial-'+runId+'.json']){const file=path.join(build.qa,'test-results/recorrido',name);if(fs.existsSync(file)&&fs.statSync(file).mtimeMs>=Date.parse(record.started)){rows=JSON.parse(fs.readFileSync(file,'utf8'));record.originalReport=file;break;}}
 assert(Array.isArray(rows)&&rows.length===selected.length,'All remaining exception rows required');assert(rows.every(r=>selected.includes(r.routeTemplate)));
 fs.writeFileSync(path.join(dir,runId+'-recorrido-resultados.json'),JSON.stringify(rows,null,2)+'\n');
 const combined=[...first,...rows];assert.equal(new Set(combined.map(r=>r.routeTemplate)).size,prior.selected.length);
 record.reviewedUnique=combined.length;record.states=combined.reduce((a,r)=>{a[r.estado]=(a[r.estado]||0)+1;return a},{});record.routes=combined;record.sourceDiff=read(runId+'-ejecucion.json').sourceDiff;
}catch(error){record.error=String(error.stack||error);process.exitCode=1;}
finally{record.phase='finished';record.finished=new Date().toISOString();save();console.log(JSON.stringify({...record,routes:undefined}));}
