import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url));
let code=fs.readFileSync(path.join(dir,'499-perfiles-firma-y-guardia.mjs'),'utf8');
const start=code.indexOf('const cases=[];');assert(start>0);code=code.slice(0,start)+`
const actionFile=path.join(qa,'src/app/actions/fiestas-historicas.ts');
const actionSource=fs.readFileSync(actionFile,'utf8'),tree=ts.createSourceFile(actionFile,actionSource,ts.ScriptTarget.Latest,true);
const node=tree.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='resetAllFiestasHistoricas');assert(node);
let dbReads=0,deleted=[],commits=0;
const db={collection:name=>{assert.equal(name,'fiestas_historicas');dbReads++;return{get:async()=>({size:1,docs:[{ref:{id:'qa506-fictitious-only'}}]})};},batch:()=>({delete:ref=>deleted.push(ref.id),commit:async()=>{commits++;}})};
const compiled=ts.transpileModule(node.getText(tree),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const actionModule={exports:{}};
vm.runInNewContext('(function(require,module,exports,requireAdminSession){'+compiled+'\\n})',{console:{info:()=>{},error:()=>{}},Promise},{filename:actionFile})(id=>{assert.equal(id,'@/lib/firebase/server');return{dbAdmin:db};},actionModule,actionModule.exports,guard.requireAdminSession);
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
fs.writeFileSync(path.join(dir,'506-consumidor-admin.json'),JSON.stringify(result,null,2)+'\\n');console.log(JSON.stringify({source,pass:result.pass,fail:result.fail}));
`;
const output=path.join(dir,'506-consumidor-admin-generado.mjs');assert(!fs.existsSync(output));fs.writeFileSync(output,code);await import(new URL('./506-consumidor-admin-generado.mjs',import.meta.url));
