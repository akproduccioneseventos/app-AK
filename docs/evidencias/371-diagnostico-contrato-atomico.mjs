import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),target=path.join(dir,'371-diagnostico-atomico.json'),source='3f9460185143ef034dcd713e975d2a0af5e20f1a';
assert(!fs.existsSync(target),'Preserve receipt');
const record={source,phase:'waiting-native367-close',started:new Date().toISOString(),diagnosticOnly:true,appEdited:false,scope:'Five ORIGINAL timeout suites with a documented atomic-memory adapter plus3 explicit action controls372. Not canonical349/364 green, no real SDK/storage/provider, no weakened original assertions/timeouts.'};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
const files=['concurrencia-tareas-automaticas.test.ts','agentes-autonomos.test.ts','cerebro-publicidad-meta.test.ts','orden-199-el-foco-vuelve-y-la-fecha-del-seguimiento.test.tsx','ia-86-agentes-publicidad-e-intervalo.test.ts'];
let child,log,qa;const additions=[];
try{
 const deadline=Date.now()+3*60*60*1000;
 while(true){
  let state;try{state=JSON.parse(fs.readFileSync(path.join(dir,'367-control.json'),'utf8'));}catch{}
  if(state?.finished)break;if(Date.now()>deadline)throw new Error('Native367 did not close within bounded wait');
  await new Promise(ok=>setTimeout(ok,30000));
 }
 const readyDeadline=Date.now()+15*60*1000;
 while(os.freemem()<2*1024**3&&Date.now()<readyDeadline)await new Promise(ok=>setTimeout(ok,30000));
 assert(os.freemem()>=2*1024**3,'No overlapping or low-memory Jest');
 const prior=JSON.parse(fs.readFileSync(path.join(dir,'364-retest-siete-suites.json'),'utf8'));assert.equal(prior.source,source);qa=prior.qa;record.qa=qa;
 const git=args=>{const r=spawnSync('git',args,{cwd:qa,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
 assert.equal(git(['rev-parse','HEAD']),source);assert.equal(git(['diff','--name-only']),'');
 assert(!fs.readdirSync(qa).some(n=>/^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n)));
 record.originalTestHashes=Object.fromEntries(files.map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync(path.join(qa,'src/__tests__',name))).digest('hex')]));
 const copy=(from,to)=>{assert(!fs.existsSync(to));fs.copyFileSync(from,to);additions.push(to);};
 copy(path.join(dir,'370-atomic-fixture.cjs'),path.join(qa,'.qa370-atomic-fixture.cjs'));
 copy(path.join(dir,'372-ajustes-mock-atomico.test.ts'),path.join(qa,'src/__tests__/qa372-ajustes-mock-atomico.test.ts'));
 const config=path.join(qa,'.qa371-config.cjs');assert(!fs.existsSync(config));
 fs.writeFileSync(config,"const original=require('./jest.config.js');module.exports=async()=>{const base=typeof original==='function'?await original():original;return{...base,setupFilesAfterEnv:[...(base.setupFilesAfterEnv||[]),'<rootDir>/.qa370-atomic-fixture.cjs']};};\n");additions.push(config);
 const safe=Object.fromEntries(['PATH','TEMP','TMP','SYSTEMROOT','WINDIR','COMSPEC','PATHEXT','LOCALAPPDATA'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
 const home=path.join(qa,'.qa371-home');fs.mkdirSync(path.join(home,'config'),{recursive:true});
 const env={...safe,HOME:home,USERPROFILE:home,APPDATA:path.join(home,'config'),XDG_CONFIG_HOME:path.join(home,'config'),NODE_ENV:'test',GOOGLE_APPLICATION_CREDENTIALS:'',NODE_OPTIONS:'--max-old-space-size=1536 --require "'+path.join(dir,'323-egress-unit-canonico.cjs').replaceAll('\\','/')+'"'};
 const report=path.join(dir,'371-jest-resultados.json'),file=path.join(dir,'371-jest.log');log=fs.createWriteStream(file);
 const tests=[...files.map(name=>'src/__tests__/'+name),'src/__tests__/qa372-ajustes-mock-atomico.test.ts'];
 child=spawn(process.execPath,['C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules/jest/bin/jest.js','--config','.qa371-config.cjs','--runTestsByPath',...tests,'--maxWorkers=1','--workerIdleMemoryLimit=512MB','--no-cache','--json','--outputFile',report],{cwd:qa,env,stdio:['ignore','pipe','pipe']});
 record.pid=child.pid;record.phase='running';save();child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
 record.exitCode=await new Promise((ok,no)=>{child.once('exit',ok);child.once('error',no);});
 await new Promise(ok=>log.end(ok));log=null;fs.writeFileSync(file+'.gz',gzipSync(fs.readFileSync(file)));
 if(fs.existsSync(report)){const r=JSON.parse(fs.readFileSync(report,'utf8'));record.summary={suites:r.numTotalTestSuites,total:r.numTotalTests,pass:r.numPassedTests,fail:r.numFailedTests,pending:r.numPendingTests};}
 record.phase='finished';if(record.exitCode!==0)process.exitCode=1;
}catch(error){record.phase='qa-setup-or-diagnostic-error';record.error=String(error.stack||error);process.exitCode=2;}
finally{
 if(child&&child.exitCode===null){const done=new Promise(ok=>child.once('exit',ok));child.kill();await Promise.race([done,new Promise(ok=>setTimeout(ok,5000))]);}
 if(log)await new Promise(ok=>log.end(ok));
 for(const file of additions){assert(path.resolve(file).startsWith(path.resolve(qa)+path.sep));if(fs.existsSync(file))fs.unlinkSync(file);}
 if(qa){const r=spawnSync('git',['diff','--name-only'],{cwd:qa,encoding:'utf8'});record.sourceDiff=r.stdout.trim();if(record.sourceDiff)process.exitCode=2;}
 record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));
}
