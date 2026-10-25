import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');
const source='894d01603e0e03cebc8f90a6ccf869ef86bbe1de';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const git=args=>{const p=spawnSync('git',args,{cwd:root,encoding:'utf8'});assert.equal(p.status,0,p.stderr);return p.stdout.trim();};
assert.equal(git(['diff','--name-only',source,'--','src','package.json','package-lock.json','scripts']),'');
assert.equal(git(['diff','--name-only',source,'16a9407c486abb060f8d719ca820e1a8b2b38fd7','--','src','package.json','package-lock.json','scripts']),'');
assert.ok(fs.readFileSync(path.join(root,'ESTADO-ACTUAL.md'),'utf8').trimEnd().split(/\r?\n/).length<=40);
const names=fs.readdirSync(dir).filter(n=>/^15[6-9]-/.test(n)&&fs.statSync(path.join(dir,n)).isFile());let scripts=0,json=0;
for(const name of names){const file=path.join(dir,name);if(name.endsWith('.mjs')){const p=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});assert.equal(p.status,0,`${name}:${p.stderr}`);scripts++;}
 if(name.endsWith('.json')){JSON.parse(fs.readFileSync(file,'utf8'));json++;}}
for(const [script,receipt]of[['156-portales-cruzados.mjs','156-portales-cruzados-final.json'],['157-invitados-estaciones.mjs','157-invitados-estaciones.json'],['158-tareas-respuesta-publica.mjs','158-tareas-respuesta-publica.json'],['159-fecha-seguimiento.mjs','159-fecha-seguimiento.json']]){
 const r=JSON.parse(fs.readFileSync(path.join(dir,receipt),'utf8'));assert.equal(r.source,source);assert.equal(r.testSha256,hash(fs.readFileSync(path.join(dir,script))));}
const ts=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const publicSource=git(['show',`${source}:src/lib/auth/public-paths.ts`]);const exports={};
vm.runInNewContext(ts.transpileModule(publicSource,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports},{timeout:2000});
const routes=['/api/cron/prospectos-seguimiento','/api/cron/fiesta-proxima-revision'];
for(const route of routes)assert.equal(exports.isPublicPathPrefix(route),true);
assert.equal(exports.isPublicPathPrefix('/portal/mesas'),false);
const result={source,checkedAt:new Date().toISOString(),scriptsSyntaxPass:scripts,jsonParsed:json,caseReceiptsMatchExecutedSources:4,
 publicPathGate:{routes,bothPublic:true,protectedControl:'/portal/mesas',protectedControlPublic:false},
 noAppEdits:true,claude16aAppDiff:'',stateAtMost40Lines:true,scope:'Delivery integrity and actual path gate; not a new end-to-end audit'};
fs.writeFileSync(path.join(dir,'159-entrega-validacion.json'),JSON.stringify(result,null,2)+'\n');
const files=fs.readdirSync(dir).filter(n=>/^15[6-9]-/.test(n)&&n!=='159-entrega-manifest.json'&&fs.statSync(path.join(dir,n)).isFile()).sort().map(file=>{const bytes=fs.readFileSync(path.join(dir,file));return{file,bytes:bytes.length,sha256:hash(bytes)};});
fs.writeFileSync(path.join(dir,'159-entrega-manifest.json'),JSON.stringify({source,files},null,2)+'\n');console.log(JSON.stringify({...result,manifestFiles:files.length}));
