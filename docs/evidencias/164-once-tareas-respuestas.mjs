import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const source = '9b7ee982c5d6ff1377fccc0490abc85a9cfd8419';
const target = new URL('164-once-tareas-respuestas.json', import.meta.url);
assert.equal(fs.existsSync(target), false, 'Preserve receipt');
const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const hashes = {}, cases = [];
const load = (file, context) => {
  const p = spawnSync('git',['show',`${source}:${file}`],{cwd:root,encoding:'utf8'}); assert.equal(p.status,0,p.stderr);
  hashes[file] = crypto.createHash('sha256').update(p.stdout).digest('hex');
  const ast = ts.createSourceFile(file,p.stdout,ts.ScriptTarget.Latest,true);
  const code = ts.transpileModule(ast.statements.filter(n => !ts.isImportDeclaration(n) && !ts.isExportDeclaration(n)).map(n => n.getText(ast)).join('\n'),
    {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports = {}; vm.runInNewContext(code,{exports,Date,URL,Request,Response,Math,console:{log(){},warn(){},error(){}},...context},{filename:file,timeout:3000}); return exports;
};
const tasks = ['asistente-proactivo','avisos-al-cliente','fiesta-proxima-revision','generate-blog-post','metricas-de-redes',
  'posicionamiento-diario','prospectos-seguimiento','publicar-programados','recordar-invitacion-no-abierta','recordatorio-a-los-invitados','recordatorios-de-pago'];
const marker = 'QA164_PRIVATE_NOT_PUBLIC';
for (const task of tasks) for (const method of task === 'asistente-proactivo' ? ['GET'] : ['GET','POST']) {
  for (const variant of ['anonymous','key','wrong-key','throttled']) {
    let calls = 0, marks = 0;
    const gate = load('src/lib/automatico/puerta-de-las-tareas.ts',{
      process:{env:variant === 'key' || variant === 'wrong-key' ? {CRON_SECRET:'qa164-secret'} : {}},
      enforcePublicRateLimit:async()=>{if(variant === 'throttled')throw new Error('QA throttle');},
    });
    const response = {success:true,ok:true,resultado:marker,guardado:true,fecha:marker,triggeredCount:1,errors:[]};
    const backend = async () => {calls++;return structuredClone(response);};
    const context = {
      ...gate,NextResponse:{json:(body,init={})=>new Response(JSON.stringify(body),{...init,headers:{'content-type':'application/json'}})},
      marcarCorrida:async()=>{marks++;},WHATSAPP_AUTOMATION_INTERNAL_TOKEN:'qa164-internal',
      correrTareaAvisosAlCliente:backend,ejecutarVigilanteFiestas:backend,runMarketingAutomation:backend,
      guardarMetricasDelDia:backend,syncMetaPublicHistory:backend,syncYouTubePublicHistory:backend,
      syncOtherPublicHistory:backend,syncCommentsFromNetworks:backend,DEFAULT_EARLIEST_DATE:'2019-09-01',
      ejecutarRevisionPosicionamiento:backend,ejecutarPerseguidorPresupuestos:backend,
      intentarAdquirirLock:async()=>{calls++;return 'qa164-lock';},liberarLock:async()=>{},procesarPosteosProgramados:backend,
      correrTareaRecordarInvitacionNoAbierta:backend,ejecutarEscaneoDeRecordatorios:backend,
      leerFiestasCrudas:async()=>{calls++;return [];},saveScheduledMessage:backend,diasHastaEnUruguay:()=>0,
      getHoraUruguay:()=>12,readDataConDetalle:async()=>{calls++;return {huboFalla:false,valor:[]};},
      ejecutarAgentesAutonomos:async()=>[],detectarErroresHumanos:()=>[],getParteDeLaManana:async()=>null,
      detectarAlertasClimaFiestas:async()=>[],obtenerProximasFechasComerciales:()=>[],
      agregarPropuestasDeduplicadas:async()=>({agregadas:[{titulo:marker}],ignoradas:0}),
      guardarResumenMientrasNoEstabas:async()=>{},avisarAlDuenio:async()=>({detalle:marker}),
    };
    try {
      const route = load(`src/app/api/cron/${task}/route.ts`,context); assert.equal(typeof route[method],'function');
      const headers = variant === 'key' ? {Authorization:'Bearer qa164-secret'} : variant === 'wrong-key' ? {Authorization:'Bearer wrong'} : {};
      const r = await route[method](new Request(`https://qa.invalid/api/cron/${task}`,{method,headers}));
      const body = await r.json(); const status = variant === 'wrong-key' ? 401 : variant === 'throttled' ? 429 : 200;
      const denied = status !== 200;
      const pass = r.status === status && (denied ? calls === 0 && marks === 0 : marks === 1) &&
        (variant === 'anonymous' ? JSON.stringify(body) === '{"ok":true,"recortada":true}' : variant === 'key' ? !body.recortada && Object.keys(body).length > 1 : true);
      cases.push({task,method,variant,pass,status:r.status,calls,marks,body});
    } catch(error) {cases.push({task,method,variant,pass:false,error:String(error.message||error)});}
  }
}
assert.equal(cases.length,84);
const result = {source,testSha256:crypto.createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'),hashes,cases,
  summary:{total:cases.length,pass:cases.filter(c=>c.pass).length,fail:cases.filter(c=>!c.pass).length},
  scope:'Eleven actual cron handlers, all21 exported HTTP method bodies, actual key/throttle/redaction gate; success/wrong-key/throttle/anonymous',
  limits:['All business engines, network/model/provider/push/WhatsApp/lock/backends are controlled doubles; no external delivery or concurrency certified',
    'In-process Request/Response/NextResponse.json adapter, not Next middleware/cookies/HTTP or deployed CRON_SECRET',
    'The two engine compositions are tested separately in160; this84case breadth is handler-contract acceptance only'],appEdited:false};
fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({source,summary:result.summary,failed:cases.filter(c=>!c.pass)}));
if(result.summary.fail)process.exitCode=1;
