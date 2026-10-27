import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');
const source='725e62ba2f909578628fad47402d125ed9632c70',stateFile=path.join(dir,'273-continuidad.json');
assert(!fs.existsSync(stateFile),'Preserve continuity record');
const selection=JSON.parse(fs.readFileSync(path.join(dir,'268-seleccion.json'),'utf8')).selected;
const initial=JSON.parse(fs.readFileSync(path.join(dir,'269-ejecucion.json'),'utf8'));assert.equal(initial.phase,'finished');assert.equal(initial.source,source);assert.equal(initial.sourceDiff,'');
const build=JSON.parse(fs.readFileSync(path.join(dir,'267-entorno.json'),'utf8'));assert.equal(build.phase,'built');assert.equal(build.source,source);
const prefix='ak207-',sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const state={source,started:new Date().toISOString(),runs:['269'],phase:'checking-remaining',events:[],appEdited:false,acceptance:false};
const save=()=>fs.writeFileSync(stateFile,JSON.stringify(state,null,2)+'\n');save();
function readCases(report){
 const out=[];function walk(suites){for(const s of suites||[]){for(const p of s.specs||[])for(const t of p.tests||[]){const last=t.results?.at(-1),file=path.basename(p.file).replace(prefix,'');const declaredSkip=(t.annotations||[]).some(a=>a.type==='skip');
  const executed=Boolean(last&&!['interrupted','skipped'].includes(last.status));
  out.push({key:`${file}:${p.line}:${p.column}:${t.projectName}`,file,title:p.title,project:t.projectName,status:last?.status||'not-run',declaredSkip,executed,accounted:executed||Boolean(last?.status==='skipped'&&declaredSkip)});}walk(s.suites);}}walk(report.suites);return out;
}
function remaining(){
 const histories=new Map(),blockedBySetup=new Set();
 for(const run of state.runs){const file=path.join(dir,`${run}-ejecucion.json`);if(!fs.existsSync(file))continue;const r=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(r.source,source);assert.equal(r.phase,'finished');assert.equal(r.sourceDiff,'');
  for(const b of r.batches||[]){const reportFile=path.join(dir,b.report);if(!fs.existsSync(reportFile))continue;const report=JSON.parse(fs.readFileSync(reportFile,'utf8'));for(const c of readCases(report)){if(!histories.has(c.key))histories.set(c.key,[]);histories.get(c.key).push({...c,run});}}
 }
 const byFile=new Map();for(const h of histories.values()){const last=h.at(-1);if(!byFile.has(last.file))byFile.set(last.file,[]);byFile.get(last.file).push({key:last.key,executed:h.some(c=>c.executed),accounted:h.some(c=>c.accounted),history:h});}
 const pending=selection.filter(file=>!byFile.has(file)||byFile.get(file).some(c=>!c.accounted));
 for(const file of pending)if(byFile.has(file)&&byFile.get(file).some(c=>c.history.length>=2&&!c.accounted))blockedBySetup.add(file);
 const all=[...byFile.values()].flat();return{pending,blockedBySetup:[...blockedBySetup],uniqueCases:all.length,executed:all.filter(c=>c.executed).length,declaredSkipped:all.filter(c=>!c.executed&&c.accounted).length,cases:all};
}
const original=fs.readFileSync(path.join(dir,'209-ejecutar-bateria.mjs'),'utf8');
try{
 for(let index=0;index<8;index++){
  const current=remaining();state.pending=current.pending;state.uniqueCases=current.uniqueCases;state.executed=current.executed;state.declaredSkipped=current.declaredSkipped;save();
  if(!current.pending.length){state.phase='all-selected-cases-accounted-with-explicit-skips-not-accepted';break;}
  if(current.blockedBySetup.length){state.phase='blocked-unexecuted-cases-after-two-attempts';state.blockedBySetup=current.blockedBySetup;break;}
  const run=String(274+index);assert(!fs.existsSync(path.join(dir,`${run}-ejecucion.json`)),'Preserve next run');
  let code=original;const replacements=[
   ["const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');",`const root=${JSON.stringify(root)},dir=path.join(root,'docs/evidencias');`],
   ['fa3b492b8f1d6a77433a92f4d63b665cfea3747c',source],['206-entorno.json','267-entorno.json'],['ak-qa-206-','ak-qa-267-'],
   ["const runId=process.env.AK_AUDIT_RUN_ID||'209';",`const runId='${run}';`],
   ["if(includePortal){const newTest=",`assert.equal(manifest.length,${current.pending.length},'All selected remaining specs must exist');\nif(includePortal){const newTest=`],
   ["for(let index=0;index<groups.length;index++){","const overallDeadline=Date.now()+4*60*60*1000;\n  for(let index=0;index<groups.length;index++){\n    assert.ok(Date.now()<overallDeadline,'Native run exceeded4hours; remaining NOT accepted');\n    assert.ok(fs.existsSync(path.join(qa,'208-config.ts')),'QA config lost; stop');"],
   ["'test','--config','208-config.ts','--output'","'test','--config','208-config.ts','--global-timeout',String(Math.max(60000,Math.min(45*60*1000,overallDeadline-Date.now()))),'--output'"],
  ];for(const[from,to]of replacements){assert(code.includes(from),from);code=code.replaceAll(from,to);}
  const driver=path.join(dir,`${run}-driver-materializado.mjs`);assert(!fs.existsSync(driver));fs.writeFileSync(driver,code);fs.writeFileSync(driver+'.gz',gzipSync(code));
  fs.writeFileSync(path.join(dir,`${run}-seleccion-y-adaptacion.json`),JSON.stringify({source,selected:current.pending,originalSha256:sha(original),driverSha256:sha(code),changes:replacements.map(([from,to])=>({from,to})),assertionsChanged:false,reason:'Only files with at least one unexecuted/interrupted case, preserving complete specs for dependent setup. Earlier failed results retained, no automatic acceptance.'},null,2)+'\n');
  state.phase='running';state.activeRun=run;save();
  const child=spawn(process.execPath,['--max-old-space-size=192',driver],{cwd:root,env:{...process.env,AK_AUDIT_SPEC_FILTER:current.pending.join(','),AK_AUDIT_SKIP_PORTAL:'true',AK_AUDIT_BATCH_SIZE:'6'},stdio:'inherit'});state.child=child.pid;save();
  const exit=await new Promise((ok,no)=>{child.once('exit',ok);child.once('error',no);});state.runs.push(run);state.events.push({run,exit,finished:new Date().toISOString()});delete state.child;delete state.activeRun;save();
 }
 if(state.phase==='running'||state.phase==='checking-remaining')state.phase='bounded-resume-limit-not-acceptance';
 const final=remaining();fs.writeFileSync(path.join(dir,'273-casos-con-historia.json'),JSON.stringify({source,...final,acceptance:false},null,2)+'\n');state.pending=final.pending;state.uniqueCases=final.uniqueCases;state.executed=final.executed;state.declaredSkipped=final.declaredSkipped;
}catch(e){state.error=String(e.stack||e);state.phase='qa-continuity-error';process.exitCode=1;}
finally{state.finished=new Date().toISOString();save();console.log(JSON.stringify({...state,events:state.events}));if(state.pending?.length)process.exitCode=2;}
