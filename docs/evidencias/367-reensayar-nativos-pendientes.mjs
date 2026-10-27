import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');
const target=path.join(dir,'367-control.json'),source='3e45a4ac6b479f89605163168e31b37dc84f2d0f';
assert(!fs.existsSync(target),'Preserve controller');
const record={source,phase:'waiting-build366',started:new Date().toISOString(),appEdited:false,scope:'ONLY the27 failed/timedout native criteria from318. Project-specific grep, original assertions/timeouts, local FIS double; no replay of149PASS or374routes.'};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
try{
 const deadline=Date.now()+100*60*1000;let build;
 do{
  try{build=JSON.parse(fs.readFileSync(path.join(dir,'366-entorno.json'),'utf8'));}catch{}
  if(build?.finished)break;if(Date.now()>deadline)throw new Error('No completed build366 within bounded wait');
  await new Promise(ok=>setTimeout(ok,30000));
 }while(true);
 assert.equal(build.source,source);assert.equal(build.phase,'built');assert.equal(build.sourceDiff,'');
 const failing=JSON.parse(fs.readFileSync(path.join(dir,'365-nativos-para-conciliar.json'),'utf8'));assert.equal(failing.source,source);assert.equal(failing.cases.length,27);
 const selected=[...new Set(failing.cases.map(x=>x.file))];
 const escape=s=>s.replace(/[.*+?^{}()|[\]\\]/g,'\\$&').replaceAll('$','\\$');
 const byProject={};
 for(const item of failing.cases){
  const title=item.title.split(' › ').slice(1).map(escape).join('\\s+');
  (byProject[item.project]??=[]).push(escape('ak207-'+item.file)+'.*'+title);
 }
 const config=[
 "import {defineConfig} from '@playwright/test';",
 "import base from './208-config';",
 'const patterns='+JSON.stringify(byProject)+';',
 "export default defineConfig({...base,projects:base.projects?.map(p=>({...p,grep:new RegExp((patterns as Record<string,string[]>)[p.name]?.join('|')||'(?!)')}))});"
 ].join('\n');
 const configFile=path.join(dir,'367-config.ts');assert(!fs.existsSync(configFile));fs.writeFileSync(configFile,config);
 let code=fs.readFileSync(path.join(dir,'209-ejecutar-bateria.mjs'),'utf8');
 code=code.replace("const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');",'const root='+JSON.stringify(root)+",dir=path.join(root,'docs/evidencias');")
  .replaceAll('fa3b492b8f1d6a77433a92f4d63b665cfea3747c',source)
  .replaceAll('206-entorno.json','366-entorno.json')
  .replace("const runId=process.env.AK_AUDIT_RUN_ID||'209';","const runId='368';");
 code=code.split('\n').map(line=>line.includes('assert.match(qa.replaceAll')?"assert.ok(qa.replaceAll('\\\\','/').startsWith('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-366-main-'),'Own stable QA366 only');":line).join('\n');
 const ts=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
 const ast=ts.createSourceFile('driver.mjs',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 const hookDeclaration=ast.statements.filter(ts.isVariableStatement).flatMap(n=>[...n.declarationList.declarations]).find(n=>n.name.getText(ast)==='hook');
 assert(hookDeclaration?.initializer);
 const hook=[
 "import {test as __akAudit207} from '@playwright/test';",
 "__akAudit207.beforeEach(async({context},info)=>{",
 " await context.route('**/*',async r=>{const u=new URL(r.request().url());if(/^https?:$/.test(u.protocol)&&!['127.0.0.1','localhost','[::1]'].includes(u.hostname)){await info.attach('qa-egress-blocked',{contentType:'text/plain',body:u.origin+u.pathname});await r.abort('blockedbyclient');}else await r.continue();});",
 " await context.route('https://firebaseinstallations.googleapis.com/**',async r=>{const u=new URL(r.request().url());const body=u.pathname.endsWith('authTokens:generate')?{token:'qa368-fis-only',expiresIn:'604800s'}:{fid:'c'+'a'.repeat(21),refreshToken:'qa368-fis-refresh-only',authToken:{token:'qa368-fis-only',expiresIn:'604800s'}};await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});});",
 " await info.attach('qa-fis-mode',{contentType:'text/plain',body:'LOCAL DOUBLE only; no Firebase provider acceptance'});",
 "});"
 ].join('\n')+'\n';
 code=code.slice(0,hookDeclaration.initializer.getStart(ast))+JSON.stringify(hook)+code.slice(hookDeclaration.initializer.end);
 const copyLine="copy(path.join(dir,'208-config.ts'),path.join(qa,'208-config.ts'));";
 assert(code.includes(copyLine));code=code.replace(copyLine,copyLine+"\ncopy(path.join(dir,'367-config.ts'),path.join(qa,'368-config.ts'));");
 code=code.replaceAll("'--config','208-config.ts'","'--config','368-config.ts'");
 const beforeRecord='const record={source,qa,started:';
 assert(code.includes(beforeRecord));
 const dry=[
 "const dry=spawnSync(process.execPath,['C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules/@playwright/test/cli.js','test','--config','368-config.ts','--list','--reporter=json'],{cwd:qa,env,encoding:'utf8',timeout:120000,maxBuffer:6*1024**2});",
 "fs.writeFileSync(path.join(dir,'368-lista.stdout.log'),dry.stdout||'');fs.writeFileSync(path.join(dir,'368-lista.stderr.log'),dry.stderr||'');",
 "assert.equal(dry.status,0,dry.stderr);const listed=JSON.parse(dry.stdout);const flatten=s=>(s.specs||[]).flatMap(x=>x.tests||[]).concat((s.suites||[]).flatMap(flatten));",
 "const list=flatten(listed);fs.writeFileSync(path.join(dir,'368-seleccion-comprobada.json'),JSON.stringify({source,expected:27,listed:list.length,projects:list.map(t=>t.projectName)},null,2)+'\\n');assert.equal(list.length,27,'Only27 previously inconclusive project/case pairs');"
 ].join('\n');
 code=code.replace(beforeRecord,dry+'\n'+beforeRecord);
 code=code.replace(">=512*1024**2,'No browser under512MiB'",">=1024**3,'No browser under1GiB'");
 const check=spawnSync(process.execPath,['--check','--input-type=module'],{input:code,encoding:'utf8'});assert.equal(check.status,0,check.stderr);
 fs.writeFileSync(path.join(dir,'368-driver.mjs.gz'),gzipSync(code));
 fs.writeFileSync(path.join(dir,'368-adaptacion.json'),JSON.stringify({source,selected,byProject,expectedPairs:27,originalDriver:'209-ejecutar-bateria.mjs',driverSha256:crypto.createHash('sha256').update(code).digest('hex'),assertionsChanged:false,provider:'LOCAL FIS registration only',build:366},null,2)+'\n');
 process.env.AK_AUDIT_SPEC_FILTER=selected.join(',');process.env.AK_AUDIT_SKIP_PORTAL='true';process.env.AK_AUDIT_BATCH_SIZE='1';
 record.phase='native-driver-running';save();
 await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 record.phase='finished';record.execution=JSON.parse(fs.readFileSync(path.join(dir,'368-ejecucion.json'),'utf8')).phase;
}catch(error){record.phase='controller-or-selection-error';record.error=String(error.stack||error);process.exitCode=2;}
finally{record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
