import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn,spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');
const source='108e17b4387237fc921ea12e8d1eb65b20f62ac9';
const record=JSON.parse(fs.readFileSync(path.join(dir,'166-entorno.json'),'utf8'));
assert.equal(record.source,source);assert.equal(record.buildExit,0);
const output=path.join(dir,'167-regresion-execution.json');assert.equal(fs.existsSync(output),false,'Preserve receipt');
const safe=Object.fromEntries(['PATH','TEMP','TMP','SYSTEMROOT','WINDIR','PROGRAMDATA','PROGRAMFILES','COMSPEC','PATHEXT','LOCALAPPDATA'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
const git=args=>{const p=spawnSync('git',args,{cwd:record.qa,env:safe,encoding:'utf8'});assert.equal(p.status,0,p.stderr);return p.stdout.trim();};
assert.equal(git(['rev-parse','HEAD']),source);assert.equal(git(['diff','--name-only']),'');
assert.ok(os.freemem()>=2*1024**3,'No broad Jest below2GiB');
assert.equal(fs.readdirSync(record.qa).some(n=>/^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n)),false);
const inside=f=>{const p=path.resolve(f);assert.ok(p.startsWith(path.resolve(record.qa)+path.sep),'Own QA only');return p;};
const files=()=>{const out=[];const walk=folder=>{if(!fs.existsSync(folder))return;for(const e of fs.readdirSync(folder,{withFileTypes:true})){
  const p=inside(path.join(folder,e.name));if(e.isDirectory()&&!e.isSymbolicLink())walk(p);else if(e.isFile()&&e.name.endsWith('.json'))out.push(p);
}};for(const f of ['data','src/data'])walk(path.join(record.qa,f));return out;};
const snapshots=new Map(files().map(f=>[f,fs.readFileSync(f)]));
const receipt={source,started:new Date().toISOString(),snapshotCount:snapshots.size,realServices:false,sourceDiffBefore:'',freeBytesBefore:os.freemem()};
const logFile=path.join(dir,'167-regresion.log'),resultsFile=path.join(dir,'167-regresion-results.json');
const log=fs.createWriteStream(logFile);
try{
  const fixture=inside(path.join(record.qa,'data/blog-posts.json'));
  if(!fs.existsSync(fixture)){
    const p=spawnSync('git',['show',`${source}:data/blog-posts.json`],{cwd:record.qa,env:safe,maxBuffer:16*1024*1024});assert.equal(p.status,0,p.stderr.toString());
    fs.mkdirSync(path.dirname(fixture),{recursive:true});fs.writeFileSync(fixture,p.stdout);
    receipt.canonicalBlogFixture={restoredForTest:true,blob:git(['rev-parse',`${source}:data/blog-posts.json`]),sha256:crypto.createHash('sha256').update(p.stdout).digest('hex')};
  }
  const home=path.join(record.qa,'.qa167-unit-home');fs.mkdirSync(path.join(home,'config'),{recursive:true});
  const sentinel=path.join(home,'no-real-credentials.json');assert.equal(fs.existsSync(sentinel),false);
  const env={...safe,HOME:home,USERPROFILE:home,APPDATA:path.join(home,'config'),XDG_CONFIG_HOME:path.join(home,'config'),
    NODE_ENV:'test',NODE_OPTIONS:'--max-old-space-size=2048',AK_ENTORNO_AISLADO:'true',GOOGLE_APPLICATION_CREDENTIALS:sentinel};
  receipt.environment='Clean unit env, isolated HOME, absent credentials sentinel; no inherited provider variables';
  const child=spawn(process.execPath,[path.join(root,'../ak-react19-candidato-103/node_modules/jest/bin/jest.js'),'--runInBand','--silent','--json','--outputFile',resultsFile],
    {cwd:record.qa,env,stdio:['ignore','pipe','pipe']});
  receipt.pid=child.pid;child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
  receipt.exitCode=await new Promise((yes,no)=>{child.once('exit',yes);child.once('error',no);});
  if(receipt.exitCode!==0)process.exitCode=1;
}catch(error){receipt.error=String(error);process.exitCode=1;}
finally{
  await new Promise(r=>log.end(r));
  for(const f of files())if(!snapshots.has(f))fs.unlinkSync(inside(f));for(const[f,bytes]of snapshots)fs.writeFileSync(f,bytes);
  receipt.sourceDiff=git(['diff','--name-only']);receipt.finished=new Date().toISOString();
  if(fs.existsSync(resultsFile)){
    const r=JSON.parse(fs.readFileSync(resultsFile,'utf8'));
    receipt.summary={suites:r.numTotalTestSuites,passedSuites:r.numPassedTestSuites,failedSuites:r.numFailedTestSuites,
      tests:r.numTotalTests,pass:r.numPassedTests,fail:r.numFailedTests,pending:r.numPendingTests,todo:r.numTodoTests};
    receipt.failures=r.testResults.filter(t=>t.status!=='passed').map(t=>({file:path.relative(record.qa,t.name),message:t.message,
      assertions:t.assertionResults.filter(a=>a.status!=='passed').map(a=>({title:a.fullName,status:a.status,messages:a.failureMessages}))}));
    fs.writeFileSync(resultsFile+'.gz',gzipSync(fs.readFileSync(resultsFile)));
  }
  fs.writeFileSync(logFile+'.gz',gzipSync(fs.readFileSync(logFile)));
  fs.writeFileSync(output,JSON.stringify(receipt,null,2)+'\n');
  if(receipt.sourceDiff)process.exitCode=1;console.log(JSON.stringify(receipt));
}
