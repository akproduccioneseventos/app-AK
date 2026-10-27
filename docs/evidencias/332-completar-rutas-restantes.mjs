import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),target=path.join(dir,'332-continuidad-restantes.json');assert(!fs.existsSync(target));
const source='3e45a4ac6b479f89605163168e31b37dc84f2d0f',record={source,pid:process.pid,started:new Date().toISOString(),phase:'waiting-own330',appEdited:false,batches:[]};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
try{
 const deadline=Date.now()+90*60*1000;while(true){const r=JSON.parse(fs.readFileSync(path.join(dir,'330-continuidad-normal.json'),'utf8'));assert.equal(r.source,source);if(r.phase==='finished'){assert(!r.error,r.error);break;}assert(Date.now()<deadline,'Own330 deadline');await new Promise(yes=>setTimeout(yes,15000));}
 const gate=JSON.parse(fs.readFileSync(path.join(dir,'327-ejecucion.json'),'utf8'));assert.equal(gate.stats.expected,2);assert.equal(gate.stats.unexpected,0);
 const build=JSON.parse(fs.readFileSync(path.join(dir,'291-entorno.json'),'utf8'));assert.equal(build.source,source);
 const {getAllRoutes}=await import(pathToFileURL(path.join(build.qa,'scripts/helpers/route-inventory.mjs')).href);
 const all=getAllRoutes(path.join(build.qa,'src/app')),templates=[...new Set(all.map(r=>r.routeTemplate))];record.totalTemplates=templates.length;
 const attempts=[];const initial=path.join(dir,'331-recorrido-resultados.json');
 if(fs.existsSync(initial))for(const row of JSON.parse(fs.readFileSync(initial,'utf8')))attempts.push({...row,qaReceipt:'331-recorrido-resultados.json'});
 const seen=()=>new Set(attempts.map(r=>r.routeTemplate));
 const aggregate=()=>{
  const latest=new Map();for(const row of attempts)latest.set(row.routeTemplate,row);const rows=[...latest.values()];
  const result={source,scope:'Fixed inventory, one owner actor, proper fixture/localFIS double. Every route record is not every action/role. Original checks kept; continuation waits for visible ready body instead of global networkidle and additionally refuses header-only acceptance. Fresh browser/server per<=60 unvisited routes.',totalTemplates:templates.length,reviewedUnique:rows.length,unvisited:templates.filter(t=>!latest.has(t)),states:rows.reduce((a,r)=>{a[r.estado]=(a[r.estado]||0)+1;return a},{}),routes:rows,attempts};
  fs.writeFileSync(path.join(dir,'332-recorrido-consolidado.json'),JSON.stringify(result,null,2)+'\n');return result;
 };
 record.phase='remaining-only';record.initialReviewed=seen().size;save();aggregate();
 const runDeadline=Date.now()+3*60*60*1000;
 for(let index=1;index<=20;index++){
  const remaining=templates.filter(t=>!seen().has(t));if(!remaining.length)break;assert(Date.now()<runDeadline,'Bounded remaining-route deadline');
  const resourceDeadline=Date.now()+5*60*1000;while(os.freemem()<2*1024**3&&Date.now()<resourceDeadline)await new Promise(yes=>setTimeout(yes,15000));assert(os.freemem()>=2*1024**3,'No native chunk under2GiB');
  const id='332'+String(index).padStart(2,'0'),selected=remaining.slice(0,60),batch={id,selected,started:new Date().toISOString()};record.batches.push(batch);save();
  const log=fs.createWriteStream(path.join(dir,id+'-control.log'));
  const child=spawn(process.execPath,[path.join(dir,'333-recorrido-tramo.mjs'),id,JSON.stringify(selected)],{cwd:root,env:process.env,stdio:['ignore','pipe','pipe']});batch.pid=child.pid;save();child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
  try{batch.exitCode=await new Promise((yes,no)=>{child.once('exit',yes);child.once('error',no);});}finally{await new Promise(yes=>log.end(yes));batch.finished=new Date().toISOString();save();}
  let rows=null;
  for(const filename of['resultados.json','partial-'+id+'.json']){const file=path.join(build.qa,'test-results/recorrido',filename);if(fs.existsSync(file)&&fs.statSync(file).mtimeMs>=Date.parse(batch.started)){rows=JSON.parse(fs.readFileSync(file,'utf8'));batch.originalReport=file;break;}}
  if(!Array.isArray(rows))throw new Error('Chunk produced no fresh route evidence; do not retry blindly');
  const reportName=id+'-recorrido-resultados.json';fs.writeFileSync(path.join(dir,reportName),JSON.stringify(rows,null,2)+'\n');
  const before=seen().size;for(const row of rows){assert(selected.includes(row.routeTemplate),'Only selected unvisited route');attempts.push({...row,qaReceipt:reportName});}
  batch.added=seen().size-before;batch.report=reportName;save();aggregate();assert(batch.added>0,'No progress: stop rather than consume quota in a loop');
 }
 const final=aggregate();record.reviewedUnique=final.reviewedUnique;record.unvisited=final.unvisited;record.states=final.states;record.inventoryComplete=final.unvisited.length===0;
}catch(error){record.error=String(error.stack||error);process.exitCode=1;}
finally{record.phase='finished';record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
