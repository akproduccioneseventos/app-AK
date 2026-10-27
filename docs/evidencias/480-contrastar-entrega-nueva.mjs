import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync,execFileSync} from 'node:child_process';import {gzipSync} from 'node:zlib';import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),repo=path.resolve(dir,'../..'),source='978af7d65a60bd287f3ee3cc05037a29566074f4';
assert(JSON.parse(fs.readFileSync(path.join(dir,'477-ejecucion.json'),'utf8')).finished);
const target=path.join(dir,'480-delta-nuevo.json');assert(!fs.existsSync(target));
const base='C:/Users/Usuario/Documents/Codex/ak-codex88',qa=fs.mkdtempSync(path.join(base,'.qa-480-delta-'));
const record={source,previous:'917a98e32c63fe2f832f5cdc16db87f4fc722b6c',qa,started:new Date().toISOString(),scope:'Five exact changed official Jest suites. No build/native proof of978; runtime917 never reused for new code. No appedit/real services.',phase:'preparing'};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
const safe=Object.fromEntries(['PATH','TEMP','TMP','SYSTEMROOT','WINDIR','COMSPEC','PATHEXT','LOCALAPPDATA'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
const original=new Map();let result;
try{
 execFileSync('git',['worktree','add','--detach',qa,source],{cwd:repo,env:safe,stdio:'pipe'});
 fs.symlinkSync(path.join(base,'ak-react19-candidato-103/node_modules'),path.join(qa,'node_modules'),'junction');
 for(const name of['.env','.env.local','.env.production','.env.production.local'])assert(!fs.existsSync(path.join(qa,name)),name+' must not inherit secrets');
 fs.copyFileSync(path.join(dir,'208-egress-guard.cjs'),path.join(qa,'208-egress-guard.cjs'));
 const shown=spawnSync(process.execPath,['scripts/entorno-de-pruebas.mjs'],{cwd:qa,env:{...safe,AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE:'true'},encoding:'utf8'});assert.equal(shown.status,0,shown.stderr);
 const forced=JSON.parse(shown.stdout).forzadas;const home=path.join(qa,'.qa-home');fs.mkdirSync(home,{recursive:true});
 const walk=folder=>{if(!fs.existsSync(folder))return;for(const e of fs.readdirSync(folder,{withFileTypes:true})){const p=path.join(folder,e.name);if(e.isDirectory()&&!e.isSymbolicLink())walk(p);else if(e.isFile()&&p.endsWith('.json'))original.set(p,fs.readFileSync(p));}};walk(path.join(qa,'data'));walk(path.join(qa,'src/data'));
 const tests=['387-factura-error-no-es-ausencia.test.tsx','el-pin-del-cliente-sigue-pidiendose.test.ts','factura-ausente-no-queda-cargando.test.tsx','los-efectos-reaccionan-a-la-cara.test.ts','una-falla-de-lectura-no-dice-que-no-existe.test.tsx'].map(n=>'src/__tests__/'+n);
 record.tests=tests;record.phase='running';save();
 result=spawnSync(process.execPath,[path.join(qa,'node_modules/jest/bin/jest.js'),'--runInBand','--watch=false','--json','--outputFile='+path.join(dir,'480-jest-resultados.json'),'--runTestsByPath',...tests],{cwd:qa,env:{...safe,...forced,HOME:home,USERPROFILE:home,NODE_OPTIONS:'--max-old-space-size=1536 --require "'+path.join(qa,'208-egress-guard.cjs').replaceAll('\\','/')+'"'},encoding:'utf8',timeout:180000,maxBuffer:8*1024**2});
 fs.writeFileSync(path.join(dir,'480-jest.log'),(result.stdout||'')+'\n'+(result.stderr||''));record.exitCode=result.status;record.error=result.error?String(result.error):undefined;
 if(fs.existsSync(path.join(dir,'480-jest-resultados.json'))){const r=JSON.parse(fs.readFileSync(path.join(dir,'480-jest-resultados.json'),'utf8'));record.stats={suites:r.numTotalTestSuites,total:r.numTotalTests,pass:r.numPassedTests,fail:r.numFailedTests,pending:r.numPendingTests};}
 record.relevantUnchanged=execFileSync('git',['diff','--name-only',record.previous+'..'+source,'--','src/lib/buzon','src/app/evento/buzon','src/app/evento/galeria','src/lib/caras'],{cwd:repo,encoding:'utf8'}).trim()==='';
}catch(error){record.setupError=String(error.stack||error);process.exitCode=1;}
finally{for(const[p,b]of original)fs.writeFileSync(p,b);record.sourceDiff=execFileSync('git',['diff','--name-only'],{cwd:qa,encoding:'utf8'}).trim();record.phase='finished';record.finished=new Date().toISOString();save();if(fs.existsSync(path.join(dir,'480-jest.log')))fs.writeFileSync(path.join(dir,'480-jest.log.gz'),gzipSync(fs.readFileSync(path.join(dir,'480-jest.log'))));console.log(JSON.stringify(record));}
