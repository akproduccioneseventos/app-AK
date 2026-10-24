import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');
const source='3e45a4ac6b479f89605163168e31b37dc84f2d0f',target=path.join(dir,'337-excepciones-continuidad.json');assert(!fs.existsSync(target));
const record={source,pid:process.pid,phase:'waiting-own334',started:new Date().toISOString(),appEdited:false,scope:'Only unresolved opening exceptions, preserve NO_PROBADA; collect body/screenshot, NOT every-action acceptance.'};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
try{
 const deadline=Date.now()+3*60*60*1000;
 while(true){const state=JSON.parse(fs.readFileSync(path.join(dir,'334-contexto-continuidad.json'),'utf8'));assert.equal(state.source,source);if(state.phase==='finished'){assert(!state.error,state.error);break;}assert(Date.now()<deadline,'Own334 deadline');await new Promise(yes=>setTimeout(yes,15000));}
 const original=JSON.parse(fs.readFileSync(path.join(dir,'334-recorrido-consolidado.json'),'utf8')),selected=original.routes.filter(r=>r.estado!=='PASO').map(r=>r.routeTemplate);record.selected=selected;record.phase='forensics-only';save();assert(selected.length<=60,'Bounded exceptions only');
 if(selected.length){
  record.startedProbe=new Date().toISOString();const log=fs.createWriteStream(path.join(dir,'33801-control.log'));
  const child=spawn(process.execPath,[path.join(dir,'333-recorrido-tramo.mjs'),'33801',JSON.stringify(selected)],{cwd:root,env:process.env,stdio:['ignore','pipe','pipe']});record.childPid=child.pid;save();child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
  try{record.exitCode=await new Promise((yes,no)=>{child.once('exit',yes);child.once('error',no);});}finally{await new Promise(yes=>log.end(yes));}
  const build=JSON.parse(fs.readFileSync(path.join(dir,'291-entorno.json'),'utf8'));assert.equal(build.source,source);let rows=null;
  for(const name of['resultados.json','partial-33801.json']){const file=path.join(build.qa,'test-results/recorrido',name);if(fs.existsSync(file)&&fs.statSync(file).mtimeMs>=Date.parse(record.startedProbe)){rows=JSON.parse(fs.readFileSync(file,'utf8'));record.originalReport=file;break;}}
  assert(Array.isArray(rows)&&rows.length>0,'Fresh exceptions evidence required');assert(rows.every(r=>selected.includes(r.routeTemplate)));
  fs.writeFileSync(path.join(dir,'33801-recorrido-resultados.json'),JSON.stringify(rows,null,2)+'\n');record.reviewed=rows.length;record.states=rows.reduce((a,r)=>{a[r.estado]=(a[r.estado]||0)+1;return a},{});
 }
}catch(error){record.error=String(error.stack||error);process.exitCode=1;}
finally{record.phase='finished';record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
