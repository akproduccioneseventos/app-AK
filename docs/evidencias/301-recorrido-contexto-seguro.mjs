import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),source='3e45a4ac6b479f89605163168e31b37dc84f2d0f';
const original=fs.readFileSync(path.join(dir,'209-ejecutar-bateria.mjs'),'utf8');let code=original;
const ignore="testIgnore:['**/ak207-recorrido-de-pantallas.spec.ts']";
const configCopy=[
 "const configDest=inside(path.join(qa,'208-config.ts'));assert(!fs.existsSync(configDest));",
 "const configSource=fs.readFileSync(path.join(dir,'208-config.ts'),'utf8');",
 `assert(configSource.includes(${JSON.stringify(ignore)}));`,
 `fs.writeFileSync(configDest,configSource.replace(${JSON.stringify(ignore)},'testIgnore:[]'));copied.push(configDest);`,
].join('\n');
const beforeCookies='await context.addCookies([';
const guard="await context.route('**/*',async route=>{const u=new URL(route.request().url());if(/^https?:$/.test(u.protocol)&&!['127.0.0.1','localhost','[::1]'].includes(u.hostname))await route.abort('blockedbyclient');else await route.continue();});\n    ";
const writeTest=`let content=hook+raw;if(entry.name==='recorrido-de-pantallas.spec.ts'){assert(content.includes(${JSON.stringify(beforeCookies)}));content=content.replace(${JSON.stringify(beforeCookies)},${JSON.stringify(guard+beforeCookies)});}fs.writeFileSync(dest,content);copied.push(dest);`;
const changes=[
 ["const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');",`const root=${JSON.stringify(root)},dir=path.join(root,'docs/evidencias');`],
 ['fa3b492b8f1d6a77433a92f4d63b665cfea3747c',source],['206-entorno.json','291-entorno.json'],['ak-qa-206-','ak-qa-280-'],
 ["const runId=process.env.AK_AUDIT_RUN_ID||'209';","const runId='297';"],
 [".filter(file=>!file.includes('recorrido-de-pantallas'))",''],
 ["const runEnv={...env,AK_QA_RESULTS:","const runEnv={...env,AK_RECORRIDO_CARRILES:'1',AK_QA_RESULTS:"],
 ["copy(path.join(dir,'208-config.ts'),path.join(qa,'208-config.ts'));",configCopy],
 ["fs.writeFileSync(dest,hook+raw);copied.push(dest);",writeTest],
 ['instrumentedSha256:hash(hook+raw)','instrumentedSha256:hash(fs.readFileSync(dest))'],
 ["'test','--config','208-config.ts'","'test','--project','chromium-desktop','--config','208-config.ts'"],
 ["walkTests(path.join(qa,'tests/e2e'));","walkTests(path.join(qa,'tests/e2e'));assert.equal(manifest.length,1);"],
];
for(const[from,to]of changes){assert(code.includes(from),from);code=code.replaceAll(from,to);}
const check=spawnSync(process.execPath,['--check','--input-type=module'],{input:code,encoding:'utf8'});assert.equal(check.status,0,check.stderr);
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
if(process.argv.includes('--dry-run'))console.log(JSON.stringify({syntax:'PASS',source,driverSha256:sha(code),qaTouched:false}));
else{
 process.env.AK_AUDIT_SPEC_FILTER='recorrido-de-pantallas.spec.ts';process.env.AK_AUDIT_SKIP_PORTAL='true';process.env.AK_AUDIT_BATCH_SIZE='0';
 fs.writeFileSync(path.join(dir,'297-seleccion-y-adaptacion.json'),JSON.stringify({source,changes,driverSha256:sha(code),originalSha256:sha(original),assertionsChanged:false,scope:'Original route walk, one desktop project/one lane, original assertions/timeouts. Remove both previous QA exclusions; guard separate browser context too. Native route results do not accept every action or role. Initial301 nested-generator SyntaxError preserved; this checks generated syntax before any QA mutation.'},null,2)+'\n');
 fs.writeFileSync(path.join(dir,'297-driver-materializado.mjs.gz'),gzipSync(code));
 await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
}
