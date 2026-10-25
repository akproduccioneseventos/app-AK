import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');
const source='108e17b4387237fc921ea12e8d1eb65b20f62ac9';
const record=JSON.parse(fs.readFileSync(path.join(dir,'166-entorno.json'),'utf8'));
assert.equal(record.source,source);assert.equal(record.buildExit,0);
const mobileOnly=process.argv[2]==='mobile';
const prefix=mobileOnly?'166-mobile':'166-native';
const receiptFile=path.join(dir,`${prefix}-execution.json`);assert.equal(fs.existsSync(receiptFile),false,'Preserve receipt');
const safe=Object.fromEntries(['PATH','TEMP','TMP','SYSTEMROOT','WINDIR','PROGRAMDATA','PROGRAMFILES','COMSPEC','PATHEXT','LOCALAPPDATA'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
const git=args=>{const p=spawnSync('git',args,{cwd:record.qa,env:safe,encoding:'utf8'});assert.equal(p.status,0,p.stderr);return p.stdout.trim();};
assert.equal(git(['rev-parse','HEAD']),source);assert.equal(git(['diff','--name-only']),'');
assert.equal(fs.readdirSync(record.qa).some(n=>/^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n)),false);
assert.ok(os.freemem()>=512*1024**2,'No browser below512MiB');
const envResult=spawnSync(process.execPath,['scripts/entorno-de-pruebas.mjs'],{cwd:root,env:{...safe,AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE:'true'},encoding:'utf8'});
assert.equal(envResult.status,0,envResult.stderr);
const home=path.join(record.qa,'.qa166-home');fs.mkdirSync(path.join(home,'config'),{recursive:true});
const env={...safe,...JSON.parse(envResult.stdout).forzadas,HOME:home,USERPROFILE:home,APPDATA:path.join(home,'config'),XDG_CONFIG_HOME:path.join(home,'config'),
  AK_DISABLE_STANDALONE:'true',COMMIT_SHA:source,NODE_ENV:'production',PLAYWRIGHT_BASE_URL:'http://127.0.0.1:3300',AK_QA_RESULTS:path.join(dir,`${prefix}-results.json`)};
const inside=file=>{const r=path.resolve(file);assert.ok(r.startsWith(path.resolve(record.qa)+path.sep),'Own QA only');return r;};
const jsonFiles=()=>{const files=[];const walk=folder=>{if(!fs.existsSync(folder))return;for(const e of fs.readdirSync(folder,{withFileTypes:true})){
  const file=inside(path.join(folder,e.name));if(e.isDirectory()&&!e.isSymbolicLink())walk(file);else if(e.isFile()&&e.name.endsWith('.json'))files.push(file);
}};for(const f of ['data','src/data'])walk(path.join(record.qa,f));return files;};
const snapshots=new Map(jsonFiles().map(f=>[f,fs.readFileSync(f)])),copies=new Map();
const fixture={fotos:['uno','dos'].map((name,i)=>({id:`e2e_166_foto_${name}`,tipo:'foto',url:`https://qa.invalid/166-${name}.jpg`,
  titulo:`Prueba nativa galería 166 foto ${name}`,categoria:'Eventos',destacada:true,orden:-100+i,createdAt:`2026-10-21T00:00:0${i}.000Z`})),videos:[]};
for(const folder of ['data','src/data']){const p=inside(path.join(record.qa,folder,'galeria-publica.json'));fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(fixture));}
for(const [from,to] of [['166-galeria-nativa.spec.ts','tests/e2e/166-galeria-nativa.spec.ts'],['166-galeria-config.ts','166-galeria-config.ts']]){
  const dest=inside(path.join(record.qa,to));copies.set(dest,fs.existsSync(dest)?fs.readFileSync(dest):null);fs.copyFileSync(path.join(dir,from),dest);
}
const receipt={source,buildFinished:record.finished,started:new Date().toISOString(),testSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'166-galeria-nativa.spec.ts'))).digest('hex'),realServices:false};
let server,child;
const serveFile=path.join(dir,`${prefix}-serve.log`),testFile=path.join(dir,`${prefix}.log`);
const serveLog=fs.createWriteStream(serveFile),testLog=fs.createWriteStream(testFile);
try{
  const listener=net.createServer();await new Promise((yes,no)=>{listener.once('error',no);listener.listen(3300,'127.0.0.1',yes);});await new Promise(yes=>listener.close(yes));
  server=spawn(process.execPath,[path.join(root,'../ak-react19-candidato-103/node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','3300'],{cwd:record.qa,env,stdio:['ignore','pipe','pipe']});
  receipt.serverPid=server.pid;server.stdout.pipe(serveLog,{end:false});server.stderr.pipe(serveLog,{end:false});
  const end=Date.now()+90000;
  while(!receipt.health){try{
    const h=await(await fetch('http://127.0.0.1:3300/api/health',{signal:AbortSignal.timeout(10000)})).json();
    assert.ok(h.version?.startsWith(source));assert.ok(Object.values(h.services).every(v=>v===false));receipt.health=h;
  }catch(error){if(Date.now()>=end)throw error;await new Promise(r=>setTimeout(r,1000));}}
  // Home is SSG with300s revalidation: allow the frozen build cache to expire before seeding is observed.
  const ttlWait=Math.max(0,Date.parse(record.finished)+305000-Date.now());receipt.cacheExpiryWaitMs=ttlWait;
  if(ttlWait)await new Promise(r=>setTimeout(r,ttlWait));
  await fetch('http://127.0.0.1:3300/',{signal:AbortSignal.timeout(60000)});
  await new Promise(r=>setTimeout(r,2000));
  child=spawn(process.execPath,[path.join(root,'../ak-react19-candidato-103/node_modules/@playwright/test/cli.js'),'test','--config','166-galeria-config.ts','166-galeria-nativa.spec.ts',...(mobileOnly?['--project=chromium-mobile']:[]),'--output',path.join(dir,`${prefix}-artifacts`)],
    {cwd:record.qa,env,stdio:['ignore','pipe','pipe']});
  receipt.testPid=child.pid;child.stdout.pipe(testLog,{end:false});child.stderr.pipe(testLog,{end:false});
  receipt.exitCode=await new Promise((yes,no)=>{child.once('exit',yes);child.once('error',no);});
  if(receipt.exitCode!==0)process.exitCode=1;
}catch(error){receipt.error=String(error);process.exitCode=1;}
finally{
  for(const p of [child,server])if(p&&p.exitCode===null){const ended=new Promise(r=>p.once('exit',r));p.kill();await Promise.race([ended,new Promise(r=>setTimeout(r,5000))]);}
  await new Promise(r=>testLog.end(r));await new Promise(r=>serveLog.end(r));
  for(const [f,bytes]of copies){if(bytes===null)fs.unlinkSync(inside(f));else fs.writeFileSync(inside(f),bytes);}
  for(const f of jsonFiles())if(!snapshots.has(f))fs.unlinkSync(inside(f));for(const[f,bytes]of snapshots)fs.writeFileSync(inside(f),bytes);
  receipt.snapshotCount=snapshots.size;receipt.sourceDiff=git(['diff','--name-only']);receipt.finished=new Date().toISOString();
  fs.writeFileSync(receiptFile,JSON.stringify(receipt,null,2)+'\n');
  for(const file of [serveFile,testFile])fs.writeFileSync(file+'.gz',gzipSync(fs.readFileSync(file)));
  if(receipt.sourceDiff)process.exitCode=1;console.log(JSON.stringify(receipt));
}
