import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),source='3f9460185143ef034dcd713e975d2a0af5e20f1a';
const target=path.join(dir,'354-jest-final.json');assert(!fs.existsSync(target));assert(os.freemem()>=2*1024**3);
const build=JSON.parse(fs.readFileSync(path.join(dir,'347-entorno.json'),'utf8'));assert.equal(build.source,source);assert.equal(build.phase,'built');
const qa=path.resolve(build.qa);assert.match(qa.replaceAll('\\','/'),/\/Temp\/ak-qa-347-[^/]+$/);
const git=args=>{const r=spawnSync('git',args,{cwd:qa,encoding:'utf8',maxBuffer:4*1024**2});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
assert.equal(git(['rev-parse','HEAD']),source);assert.equal(git(['diff','--name-only']),'');
assert(!fs.readdirSync(qa).some(n=>/^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n)));
const files=JSON.parse(fs.readFileSync(path.join(dir,'349-jest-resultados.json'),'utf8')).testResults.filter(x=>x.status==='failed').map(x=>x.name);
assert.equal(files.length,7);
const inside=file=>{const p=path.resolve(file);assert(p.startsWith(qa+path.sep));return p;};
const jsonFiles=()=>{const out=[];const walk=folder=>{if(!fs.existsSync(folder))return;for(const entry of fs.readdirSync(folder,{withFileTypes:true})){const file=inside(path.join(folder,entry.name));if(entry.isDirectory()&&!entry.isSymbolicLink())walk(file);else if(entry.isFile()&&file.endsWith('.json'))out.push(file);}};for(const folder of['data','src/data'])walk(path.join(qa,folder));return out;};
const snapshots=new Map(jsonFiles().map(file=>[file,fs.readFileSync(file)]));
const safe=Object.fromEntries(['PATH','TEMP','TMP','SYSTEMROOT','WINDIR','COMSPEC','PATHEXT','LOCALAPPDATA'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
const home=fs.mkdtempSync(path.join(os.tmpdir(),'ak-qa-354-home-'));fs.mkdirSync(path.join(home,'config'));
const env={...safe,HOME:home,USERPROFILE:home,APPDATA:path.join(home,'config'),XDG_CONFIG_HOME:path.join(home,'config'),NODE_ENV:'test',GOOGLE_APPLICATION_CREDENTIALS:'',NODE_OPTIONS:'--max-old-space-size=1536 --require "'+path.join(dir,'323-egress-unit-canonico.cjs').replaceAll('\\','/')+'"'};
const report=path.join(dir,'354-jest-resultados.json'),file=path.join(dir,'354-jest.log'),log=fs.createWriteStream(file);
const receipt={source,qa,started:new Date().toISOString(),phase:'running',scope:'FOCUSED rerun exactly seven failing349 suites, SAME source3f, ORIGINAL timeout/assertions and official environment. No app/test edits. Prior wrapper syntax error occurred before test execution.',dependencyLimit:build.dependencyLimit,appEdited:false,files};
const save=()=>fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n');save();let child;
try{
 child=spawn(process.execPath,['C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules/jest/bin/jest.js','--runTestsByPath',...files,'--maxWorkers=1','--workerIdleMemoryLimit=512MB','--no-cache','--json','--outputFile',report],{cwd:qa,env,stdio:['ignore','pipe','pipe']});
 receipt.pid=child.pid;save();child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
 receipt.exitCode=await new Promise((yes,no)=>{child.once('exit',yes);child.once('error',no);});if(receipt.exitCode!==0)process.exitCode=1;
 if(fs.existsSync(report)){const r=JSON.parse(fs.readFileSync(report,'utf8'));receipt.summary={suites:r.numTotalTestSuites,total:r.numTotalTests,passed:r.numPassedTests,failed:r.numFailedTests,pending:r.numPendingTests,failedSuites:r.numFailedTestSuites};}
}catch(error){receipt.error=String(error.stack||error);process.exitCode=1;}
finally{
 if(child&&child.exitCode===null){const done=new Promise(yes=>child.once('exit',yes));child.kill();await Promise.race([done,new Promise(yes=>setTimeout(yes,5000))]);}
 await new Promise(yes=>log.end(yes));fs.writeFileSync(file+'.gz',gzipSync(fs.readFileSync(file)));
 for(const file of jsonFiles())if(!snapshots.has(file))fs.unlinkSync(inside(file));for(const[file,bytes]of snapshots)fs.writeFileSync(inside(file),bytes);
 receipt.snapshotCount=snapshots.size;receipt.sourceDiff=git(['diff','--name-only']);receipt.phase='finished';receipt.finished=new Date().toISOString();save();console.log(JSON.stringify(receipt));if(receipt.sourceDiff)process.exitCode=1;
}
