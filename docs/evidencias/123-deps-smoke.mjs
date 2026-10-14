import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const require=createRequire(import.meta.url),results=[];
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
async function check(name,fn){const details=await fn();results.push({name,status:'PASS',details});console.log(name+' PASS');}
await check('fflate-prod-pdf-and-three-roundtrip',()=>{
  for(const dir of ['node_modules/fflate','node_modules/three-stdlib/node_modules/fflate']){
    const mod=require(path.resolve(dir));const content=mod.strToU8('QA123 ZIP ficticio');
    assert.equal(mod.strFromU8(mod.unzipSync(mod.zipSync({'ficticio.txt':content}))['ficticio.txt']),'QA123 ZIP ficticio');
  }return{copies:2,originalDataUsed:false};
});
await check('jspdf-two-pages',()=>{
  const {jsPDF}=require('jspdf');const pdf=new jsPDF();pdf.text('Presupuesto QA123',20,20);pdf.addPage();pdf.text('Pagina 2',20,20);
  assert.equal(pdf.getNumberOfPages(),2);const bytes=Buffer.from(pdf.output('arraybuffer'));assert(bytes.toString('ascii',0,8).startsWith('%PDF-'));assert(bytes.length>1000);return{pages:2,bytes:bytes.length};
});
await check('dompurify-dangerous-markup',()=>{
  const {JSDOM}=require('jsdom'),dom=new JSDOM('');const clean=require('dompurify')(dom.window).sanitize('<img src=x onerror=alert(1)><script>alert(1)</script>');
  assert(!/onerror|script/i.test(clean));dom.window.close();return{scriptRemoved:true};
});
await check('yaml-major-lines',()=>{
  for(const p of ['node_modules/js-yaml','node_modules/firebase-tools/node_modules/js-yaml','node_modules/@istanbuljs/load-nyc-config/node_modules/js-yaml']){
    const m=require(path.resolve(p));assert.deepEqual(m.load('servicio: DJ\nmonto: 1000\n'),{servicio:'DJ',monto:1000});
  }return{copies:3};
});
await check('query-and-shell-input',()=>{
  assert.deepEqual(require('qs').parse('evento=QA123&servicios[]=DJ&servicios[]=Foto'),{evento:'QA123',servicios:['DJ','Foto']});
  const shell=require('shell-quote'),tokens=['QA123','nombre con espacios','comillas " dobles'];assert.deepEqual(shell.parse(shell.quote(tokens)),tokens);return{roundtrip:true};
});
await check('glob-major-lines',()=>{
  const lock=JSON.parse(fs.readFileSync('package-lock.json'));
  for(const [p,data]of Object.entries(lock.packages).filter(([p])=>p.endsWith('/brace-expansion'))){const m=require(path.resolve(p)),expand=m.expand||m.default||m;assert.deepEqual(expand('foto{1,2}'),['foto1','foto2']);assert(['1','2','5'].includes(data.version.split('.')[0]));}
  return{sameMajorLines:true};
});
await check('grpc-client-closes-without-network-call',()=>{
  const g=require('@grpc/grpc-js'),client=new g.Client('127.0.0.1:9',g.credentials.createInsecure());client.close();return{rpcCalls:0};
});
await check('hono-and-mcp-imports',async()=>{
  const {Hono}=await import('hono');const h=new Hono();h.get('/qa',c=>c.text('QA123'));assert.equal(await(await h.request('/qa')).text(),'QA123');
  assert.equal(typeof(await import('@modelcontextprotocol/sdk/client/index.js')).Client,'function');return{inProcessOnly:true};
});
await check('three-stdlib-and-undici-imports',()=>{assert.equal(typeof require('three-stdlib').OrbitControls,'function');assert.equal(typeof require('undici').fetch,'function');return{imports:true,sceneNotCertifiedByImport:true};});
fs.writeFileSync('docs/evidencias/123-deps-smoke.json',JSON.stringify({applicationSourceSha:sha,results,allDependencySecurityCertified:false},null,2)+'\n');
