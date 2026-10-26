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
const cases=[];for(const perfil of Object.keys(profiles.PERMISOS_POR_PERFIL)){
 const user={email:'qa499.'+perfil+'@example.invalid',userId:'qa499-'+perfil,role:'admin',perfil};cookie=await session.createSignedSessionToken(user,60);
 const verified=await session.verifySession();assert(verified.success&&verified.user.perfil===perfil);
 const policy=profiles.puede(verified.user,profiles.PERMISOS.ADMINISTRACION),actual=await guard.requireAdminSession();
 cases.push({perfil,legacyRole:'admin',validRealSignature:true,expectedAdminByExplicitProfile:policy,actualAdmin:actual.ok,pass:policy===actual.ok});
}
cookie=undefined;cases.push({control:'anonymous',pass:!(await guard.requireAdminSession()).ok});
cookie=(await session.createSignedSessionToken({email:'qa499@example.invalid',userId:'qa499',role:'admin',perfil:'dueno'},60))+'tampered';cases.push({control:'invalid-signature',pass:!(await guard.requireAdminSession()).ok});
const result={source,created:new Date().toISOString(),scope:'Real session issuer/verifier/HMAC, profile policy and requireAdminSession; only next/headers cookie transport is doubled. No HTTP/user DB mutation or real accounts. Conflicting legacy-role/explicit-profile must be assessed against legitimate issuer/consumers before ordering.',cases,pass:cases.filter(c=>c.pass).length,fail:cases.filter(c=>!c.pass).length};
fs.writeFileSync(path.join(dir,'499-perfiles-guardia.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({source,pass:result.pass,fail:result.fail,cases}));
