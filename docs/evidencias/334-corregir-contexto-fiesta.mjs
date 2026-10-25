import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');
const source='3e45a4ac6b479f89605163168e31b37dc84f2d0f',target=path.join(dir,'334-contexto-continuidad.json');
assert(!fs.existsSync(target));
const record={source,pid:process.pid,phase:'waiting-own332',started:new Date().toISOString(),appEdited:false,batches:[]};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
try{
 const deadline=Date.now()+4*60*60*1000;
 while(true){const state=JSON.parse(fs.readFileSync(path.join(dir,'332-continuidad-restantes.json'),'utf8'));assert.equal(state.source,source);if(state.phase==='finished'){assert(!state.error,state.error);break;}assert(Date.now()<deadline,'Own332 deadline');await new Promise(yes=>setTimeout(yes,15000));}
 const original=JSON.parse(fs.readFileSync(path.join(dir,'332-recorrido-consolidado.json'),'utf8'));assert.equal(original.source,source);
 const invalid=original.routes.filter(r=>(r.pathname==='/fiestas/nueva'||r.pathname.startsWith('/fiestas/nueva/'))&&!new URL(r.testUrl,'http://127.0.0.1').searchParams.has('fiestaId'));
 record.originalInvalidInputs=invalid.map(r=>({routeTemplate:r.routeTemplate,testUrl:r.testUrl,estado:r.estado}));record.phase='correct-context-only';save();
 const build=JSON.parse(fs.readFileSync(path.join(dir,'291-entorno.json'),'utf8'));assert.equal(build.source,source);
 const replacements=[];
 for(let i=0;i<invalid.length;i+=60){
  const id='336'+String(Math.floor(i/60)+1).padStart(2,'0'),selected=invalid.slice(i,i+60).map(r=>r.routeTemplate),batch={id,selected,started:new Date().toISOString()};record.batches.push(batch);save();
  const log=fs.createWriteStream(path.join(dir,id+'-control.log'));
  const child=spawn(process.execPath,[path.join(dir,'333-recorrido-tramo.mjs'),id,JSON.stringify(selected)],{cwd:root,env:process.env,stdio:['ignore','pipe','pipe']});batch.pid=child.pid;save();child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
  try{batch.exitCode=await new Promise((yes,no)=>{child.once('exit',yes);child.once('error',no);});}finally{await new Promise(yes=>log.end(yes));batch.finished=new Date().toISOString();save();}
  let rows=null;
  for(const name of['resultados.json','partial-'+id+'.json']){const file=path.join(build.qa,'test-results/recorrido',name);if(fs.existsSync(file)&&fs.statSync(file).mtimeMs>=Date.parse(batch.started)){rows=JSON.parse(fs.readFileSync(file,'utf8'));batch.originalReport=file;break;}}
  assert(Array.isArray(rows)&&rows.length>0,'No fresh context evidence, do not silently retry');
  for(const row of rows){assert(selected.includes(row.routeTemplate));assert.equal(new URL(row.testUrl,'http://127.0.0.1').searchParams.get('fiestaId'),'fiesta_esta_noche');}
  const report=id+'-recorrido-resultados.json';fs.writeFileSync(path.join(dir,report),JSON.stringify(rows,null,2)+'\n');replacements.push(...rows.map(r=>({...r,qaReceipt:report})));batch.report=report;batch.reviewed=rows.length;save();
 }
 const latest=new Map(original.routes.map(r=>[r.routeTemplate,r]));for(const row of replacements)latest.set(row.routeTemplate,row);
 const routes=[...latest.values()],states=routes.reduce((a,r)=>{a[r.estado]=(a[r.estado]||0)+1;return a},{});
 const final={...original,scope:original.scope+'; internal-fiesta inputs missing fiestaId corrected in334; original attempts preserved, not app defects.',routes,states,attempts:[...original.attempts,...replacements],contextCorrection:{receipt:'334-contexto-continuidad.json',invalidOriginalInputs:invalid.length,correctedReports:replacements.length}};
 fs.writeFileSync(path.join(dir,'334-recorrido-consolidado.json'),JSON.stringify(final,null,2)+'\n');record.corrected=replacements.length;record.states=states;
}catch(error){record.error=String(error.stack||error);process.exitCode=1;}
finally{record.phase='finished';record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
