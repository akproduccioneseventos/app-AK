import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),build=JSON.parse(fs.readFileSync(path.join(dir,'486-entorno.json'),'utf8')),qa=build.qa,source=build.source;
assert.equal(source,'978af7d65a60bd287f3ee3cc05037a29566074f4');
const req=createRequire(path.join(qa,'package.json')),ts=req('typescript'),cache=new Map();let cookie;
const secret='qa499-only-fictitious-session-secret-not-production';
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;assert(file.startsWith(path.resolve(qa,'src')+path.sep));
 const text=fs.readFileSync(file,'utf8'),compiled=ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
 const module={exports:{}};cache.set(file,module);const local=id=>{
  if(id==='next/headers')return{cookies:async()=>({get:name=>name==='ak_session'&&cookie?{value:cookie}:undefined})};
  if(id.startsWith('@/'))return load(path.join(qa,'src',id.slice(2)+'.ts'));
  if(id.startsWith('.'))return load(path.resolve(path.dirname(file),id+'.ts'));
  if(id==='crypto'||id==='node:crypto')return req('node:crypto');throw Error('Unexpected dependency '+id);
 };
 vm.runInNewContext('(function(require,module,exports){'+compiled+'\n})',{console,process:{env:{AK_SESSION_SECRET:secret,NODE_ENV:'production'}},Date,JSON,Buffer,URL,encodeURIComponent,decodeURIComponent},{filename:file})(local,module,module.exports);return module.exports;
}
const session=load(path.join(qa,'src/lib/auth/session-token.ts')),guard=load(path.join(qa,'src/lib/auth/require-session.ts')),profiles=load(path.join(qa,'src/lib/auth/perfiles.ts'));

const actionFile=path.join(qa,'src/app/actions/fiestas-historicas.ts');
const actionSource=fs.readFileSync(actionFile,'utf8'),tree=ts.createSourceFile(actionFile,actionSource,ts.ScriptTarget.Latest,true);
const node=tree.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='resetAllFiestasHistoricas');assert(node);
let dbReads=0,deleted=[],commits=0;
const db={collection:name=>{assert.equal(name,'fiestas_historicas');dbReads++;return{get:async()=>({size:1,docs:[{ref:{id:'qa506-fictitious-only'}}]})};},batch:()=>({delete:ref=>deleted.push(ref.id),commit:async()=>{commits++;}})};
const compiled=ts.transpileModule(node.getText(tree),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const actionModule={exports:{}};
vm.runInNewContext('(function(require,module,exports,requireAdminSession){'+compiled+'\n})',{console:{info:()=>{},error:()=>{}},Promise},{filename:actionFile})(id=>{assert.equal(id,'@/lib/firebase/server');return{dbAdmin:db};},actionModule,actionModule.exports,guard.requireAdminSession);
const cases=[];
for(const perfil of ['dueno','secretaria','operador','personal','cliente','prospecto','invitado']){
 cookie=await session.createSignedSessionToken({email:'qa506.'+perfil+'@example.invalid',userId:'qa506-'+perfil,role:'admin',perfil},60);
 dbReads=0;deleted=[];commits=0;
 const value=await actionModule.exports.resetAllFiestasHistoricas();
 const expectedAllowed=perfil==='dueno',actualAllowed=value.success===true&&commits===1;
 cases.push({perfil,legacyRole:'admin',expectedAllowed,actualAllowed,dbReads,deleted,commits,result:JSON.parse(JSON.stringify(value)),pass:expectedAllowed===actualAllowed&&(!expectedAllowed?dbReads===0:true)});
}
cookie=undefined;dbReads=0;deleted=[];commits=0;const anonymous=await actionModule.exports.resetAllFiestasHistoricas();cases.push({control:'anonymous',result:anonymous,pass:anonymous.success===false&&dbReads===0});
const result={source,created:new Date().toISOString(),scope:'Exact exported resetAllFiestasHistoricas function body + actual signed session/verification/admin guard; ONLY cookie transport and DB are controlled doubles. Synthetic deletion ledger only, NOT live HTTP/real records/Firestore mutation.',issuer:'auth.ts writeSessionCookie copies role:data.role and independently validated perfil:data.perfil',cases,pass:cases.filter(c=>c.pass).length,fail:cases.filter(c=>!c.pass).length};
fs.writeFileSync(path.join(dir,'506-consumidor-admin.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({source,pass:result.pass,fail:result.fail}));
