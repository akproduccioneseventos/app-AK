import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';
import{spawn,spawnSync}from'node:child_process';import{gzipSync}from'node:zlib';import{fileURLToPath}from'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),source='cce8299c18237d9dd432120751d39d4154b7e58b';
const target=path.join(dir,'669-entorno.json');assert(!fs.existsSync(target));
const deps='C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules';
const safe=Object.fromEntries(['PATH','TEMP','TMP','SYSTEMROOT','WINDIR','PROGRAMDATA','PROGRAMFILES','COMSPEC','PATHEXT','LOCALAPPDATA'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
const git=(args,cwd=root)=>{const r=spawnSync('git',args,{cwd,env:safe,encoding:'utf8',maxBuffer:20*1024**2});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
const record={source,started:new Date().toISOString(),phase:'waiting-resources',appEdited:false,realServices:false,foreignProcessesStopped:false,probes:[]};const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
async function resources(){const until=Date.now()+60*60000;while(true){const p=spawnSync('powershell.exe',['-NoProfile','-Command',"@(Get-CimInstance Win32_Process | Where-Object { $_.Name -match '^(node|python|graphify|uv)(\\.exe)?$' -and $_.CommandLine -match 'next[\\\\/]dist[\\\\/]bin[\\\\/]next.*build|build-next-with-memory|jest[\\\\/]bin|graphify' } | Select-Object ProcessId,CommandLine) | ConvertTo-Json -Compress"],{encoding:'utf8',timeout:30000,windowsHide:true});const q=JSON.parse(p.stdout.trim()||'[]'),list=Array.isArray(q)?q:[q];const probe={at:new Date().toISOString(),free:os.freemem(),busy:list};if(!record.probes.length||JSON.stringify(record.probes.at(-1).busy)!==JSON.stringify(list))record.probes.push(probe);save();if(p.status===0&&list.length===0&&probe.free>=2*1024**3)return;assert(Date.now()<until,'No safe window for isolated validation');await new Promise(ok=>setTimeout(ok,30000));}}
let env,qa,originals=new Map();
const files=()=>{const out=[];for(const name of['data','src/data']){const walk=d=>{if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory()&&!e.isSymbolicLink())walk(p);else if(e.isFile()&&p.endsWith('.json'))out.push(p);}};walk(path.join(qa,name));}return out;};
const restore=()=>{if(!qa)return;for(const p of files())if(!originals.has(p))fs.unlinkSync(p);for(const[p,b]of originals)fs.writeFileSync(p,b);};
async function run(name,args){const file=path.join(dir,'669-'+name+'.log'),log=fs.createWriteStream(file),child=spawn(process.execPath,args,{cwd:qa,env,stdio:['ignore','pipe','pipe']});record.phase=name;record.pid=child.pid;save();child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});const exit=await new Promise((ok,no)=>{child.once('exit',ok);child.once('error',no);});await new Promise(ok=>log.end(ok));fs.writeFileSync(file+'.gz',gzipSync(fs.readFileSync(file)));record[name+'Exit']=exit;save();return exit;}
try{
 await resources();assert.equal(git(['rev-parse','HEAD']),source);assert.equal(git(['diff','--name-only','--','src','package.json','package-lock.json','next.config.ts']),'');
 qa='C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-658-final-NJUXsp';record.qa=qa;record.cacheFrom='660 cache reused; NEW source requires new build';save();assert.equal(git(['rev-parse','HEAD'],qa),source);assert.equal(git(['diff','--name-only'],qa),'');
 assert(fs.existsSync(path.join(qa,'node_modules')));
 assert(!fs.readdirSync(qa).some(n=>/^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n)));
 const lock=JSON.parse(fs.readFileSync(path.join(qa,'package-lock.json'),'utf8'));record.dependencyLimit={installedEstree:JSON.parse(fs.readFileSync(path.join(deps,'@types/estree/package.json'),'utf8')).version,lockedEstree:lock.packages['node_modules/@types/estree'].version,cleanNpmCi:false};
 const publicFiles=new Set(['servicios-empresa.json','menus-catering.json','insumos.json','budget-display-settings.json','armado-rapido-config.json','invoice-template-settings.json','crm-stages.json','blog-posts.json','employee-roles.json','galeria-publica.json','catalogo-fotos.json','testimonials.json']);
 for(const p of files()){const b=fs.readFileSync(p);originals.set(p,b);if(!publicFiles.has(path.basename(p))){const j=JSON.parse(b);fs.writeFileSync(p,JSON.stringify(Array.isArray(j)?[]:{})+'\n');}}
 const e=spawnSync(process.execPath,['scripts/entorno-de-pruebas.mjs'],{cwd:qa,env:{...safe,AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE:'true'},encoding:'utf8'});assert.equal(e.status,0,e.stderr);
 const home=path.join(qa,'.qa669-home');fs.mkdirSync(path.join(home,'config'),{recursive:true});
 const guard='C:/Users/Usuario/Documents/Codex/ak-codex88/ak-auditoria267-cierre/docs/evidencias/208-egress-guard.cjs';
 env={...safe,...JSON.parse(e.stdout).forzadas,HOME:home,USERPROFILE:home,APPDATA:path.join(home,'config'),XDG_CONFIG_HOME:path.join(home,'config'),GOOGLE_APPLICATION_CREDENTIALS:'',COMMIT_SHA:source,AK_DISABLE_STANDALONE:'true',NODE_OPTIONS:'--require "'+guard+'"'};
 assert.equal(await run('acentos',['scripts/check-acentos.mjs']),0,'Accent validation');
 assert.equal(await run('build',['scripts/build-next-with-memory.mjs']),0,'Frozen source build');
 record.phase='built';

}catch(error){record.error=String(error.stack||error);record.phase='validation-not-accepted';process.exitCode=1;}
finally{restore();if(qa)record.sourceDiff=git(['diff','--name-only'],qa);record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
