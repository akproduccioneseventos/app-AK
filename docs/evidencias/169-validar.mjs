import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');
const source='108e17b4387237fc921ea12e8d1eb65b20f62ac9',base='9b7ee982c5d6ff1377fccc0490abc85a9cfd8419';
const target=path.join(dir,'169-validacion.json');assert.equal(fs.existsSync(target),false,'Preserve receipt');
const json=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const git=args=>{const p=spawnSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});assert.equal(p.status,0,p.stderr);return p.stdout.trim();};
const build=json('166-entorno.json'),wide=json('167-regresion-execution.json'),sdk=json('168-proveedor-sdk.json'),sdkRun=json('168-ejecucion.json');
for(const r of [build,wide,sdk,sdkRun])assert.equal(r.source,source);
assert.equal(build.buildExit,0);assert.equal(wide.exitCode,0);assert.equal(sdk.actualSdk,true);assert.equal(sdk.remainingDemoDocuments,0);
assert.deepEqual(wide.summary,{suites:805,passedSuites:805,failedSuites:0,tests:5010,pass:5010,fail:0,pending:0,todo:0});
assert.deepEqual(sdk.summary,{total:10,pass:4,fail:6});assert.equal(sdkRun.exitCode,1);assert.equal(sdkRun.cleanupStatus,200);
assert.equal(sdk.testSha256,hash(path.join(dir,'168-proveedor-sdk.mjs')));
for(const r of [build,wide,sdkRun])assert.equal(r.sourceDiff,'');
const nativeRun=json('166-native-execution.json'),mobileRun=json('166-mobile-execution.json');
for(const r of [nativeRun,mobileRun]){
  assert.equal(r.source,source);assert.equal(r.sourceDiff,'');assert.ok(r.health.version.startsWith(source));
  assert.ok(Object.values(r.health.services).every(v=>v===false));assert.equal(r.snapshotCount,76);
}
assert.equal(nativeRun.testSha256,hash(path.join(dir,'166-galeria-nativa-inicial.spec.ts')));
assert.equal(mobileRun.testSha256,hash(path.join(dir,'166-galeria-nativa.spec.ts')));
const allTests=r=>{const result=[];const walk=s=>{for(const spec of s.specs||[])for(const t of spec.tests||[])for(const run of t.results||[])result.push({title:spec.title,project:t.projectName,...run});for(const child of s.suites||[])walk(child);};walk(r);return result;};
const initial=allTests(json('166-native-results.json')),mobile=allTests(json('166-mobile-results.json'));
assert.equal(initial.length,2);assert.equal(mobile.length,1);assert.equal(mobile[0].status,'passed');
const desktop=initial.find(t=>t.project==='chromium-desktop'),initialMobile=initial.find(t=>t.project==='chromium-mobile');
assert.equal(desktop.status,'failed');assert.ok(desktop.errors.every(e=>/Tab nativo/.test(e.message)));
assert.equal(initialMobile.status,'failed');assert.ok(initialMobile.errors.some(e=>/strict mode violation/.test(e.message)));
const observation=t=>{const a=t.attachments.find(a=>a.name==='166-observed.json');assert.ok(a?.body);return JSON.parse(Buffer.from(a.body,'base64'));};
const observed={source,desktop:observation(desktop),mobile:observation(mobile[0]),initialMobileQaError:initialMobile.errors.map(e=>e.message)};
assert.equal(observed.desktop.nativeTabContainment,false);assert.equal(observed.mobile.escapeAndReturn,true);
fs.writeFileSync(path.join(dir,'169-native-observed.json'),JSON.stringify(observed,null,2)+'\n');
assert.equal(git(['diff','--name-only',base,'--','src','scripts','package.json','package-lock.json']),'');
assert.equal(git(['diff','--check']),'');
const stateLines=fs.readFileSync(path.join(root,'ESTADO-ACTUAL.md'),'utf8').trimEnd().split(/\r?\n/).length;assert.ok(stateLines<=40);
const stableFiles=['src/app/actions/google-workspace.ts','src/lib/automatico/puerta-de-las-tareas.ts','src/app/actions/provider-portal.ts','src/lib/data-service.ts'];
const equalBlobFiles=stableFiles.map(file=>{const main=git(['rev-parse',`${base}:${file}`]),candidate=git(['rev-parse',`${source}:${file}`]);assert.equal(main,candidate);return{file,blob:main};});
let scripts=0,plainJson=0;
for(const name of fs.readdirSync(dir).filter(n=>/^16[0-9]-/.test(n))){
  if(name.endsWith('.mjs')){const p=spawnSync(process.execPath,['--check',path.join(dir,name)],{encoding:'utf8'});assert.equal(p.status,0,`${name}: ${p.stderr}`);scripts++;}
  if(name.endsWith('.json')){json(name);plainJson++;}
}
for(const name of ['166-native-results.json','166-mobile-results.json','168-emulator.log','168-sdk.log'])fs.writeFileSync(path.join(dir,name+'.gz'),gzipSync(fs.readFileSync(path.join(dir,name))));
const result={checkedAt:new Date().toISOString(),source,base,build:{exit:0,typesLint:true},wide:wide.summary,
  native:{desktop:'FAIL same199 focus containment',mobile:'PASS',initialMobile:'QA selector ambiguity, not product defect'},
  sdk:{...sdk.summary,remaining:0,cleanupStatus:200,actualSdk:true},
  focal:json('165-validacion.json').summary,distinctPendingCauses:2,equalBlobFiles,scriptSyntaxPass:scripts,jsonParsed:plainJson,stateLines,
  appDiff:'',whitespacePass:true,allAppCertified:false,scope:'Tanda160-169 with reusable prior evidence, NOT complete per-control/state/role or production acceptance'};
fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');
const status=spawnSync('git',['status','--porcelain=v1','--untracked-files=all'],{cwd:root,encoding:'utf8'});assert.equal(status.status,0,status.stderr);
const paths=status.stdout.trimEnd().split('\n').map(s=>s.slice(3).replace(/^"|"$/g,''));
const allowed=p=>p==='ESTADO-ACTUAL.md'||p==='docs/YA-RESUELTO.md'||/^docs\/ordenes\/(193|199|200|201|204)-/.test(p)||/^docs\/evidencias\/16[0-9]-/.test(p);
assert.ok(paths.every(allowed),'Unexpected files, do not stage');
const excluded=paths.filter(p=>p.endsWith('.log')||/(?:166-(?:native|mobile)|167-regresion)-results\.json$/.test(p)||p.endsWith('/.last-run.json'));
const members=paths.filter(p=>!excluded.includes(p)&&p!=='docs/evidencias/169-manifest.json').map(p=>({path:p,bytes:fs.statSync(path.join(root,p)).size,sha256:hash(path.join(root,p))}));
fs.writeFileSync(path.join(dir,'169-manifest.json'),JSON.stringify({source,base,members,excludedLocalArtifacts:excluded},null,2)+'\n');
console.log(JSON.stringify({...result,deliveryFiles:members.length}));
