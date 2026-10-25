import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const source = '894d01603e0e03cebc8f90a6ccf869ef86bbe1de';
const file = 'src/lib/agentes/motor-agentes.ts';
const script = fileURLToPath(import.meta.url);
if (process.argv.includes('--child')) {
  const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
  const read = sha => { const p = spawnSync('git',['show',`${sha}:${file}`],{cwd:root,encoding:'utf8'}); assert.equal(p.status,0,p.stderr);
    const ast=ts.createSourceFile(file,p.stdout,ts.ScriptTarget.Latest,true); const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='ejecutarPerseguidorPresupuestos');assert.ok(fn);return fn.getText(ast); };
  const body = read(source), other = read('45a0b1d4783ad58846c2e2d07ad8f318287024bf');
  const code=ts.transpileModule(body,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const cases=[];
  for (const days of [6,15]) {
    const now=new Date('2026-10-20T15:00:00Z');let drafts=[];
    const budget={id:`qa159-${days}`,estado:'Enviado',clienteNombre:'Cliente ficticio QA159',clienteContacto:'00000000',eventoFecha:'2027-08-08',eventoTipo:'Evento ficticio',timestamp:new Date(now.getTime()-days*86400000).toISOString()};
    const exports={};vm.runInNewContext(code,{exports,Date,Math,isNaN,
      readData:async name=>name==='presupuestos.json'?[budget]:drafts,
      writeData:async(name,value)=>{assert.equal(name,'scheduled-messages.json');drafts=structuredClone(value);},
      registrarEjecucionAgente:async()=>{},},{timeout:3000});
    await exports.ejecutarPerseguidorPresupuestos(now);
    assert.equal(drafts.length,1,'A draft must actually be prepared');
    const match=drafts[0].messageText.match(/(?:evento del|fecha del) (\d+)\/(\d+)\/(\d+)/);
    assert.ok(match,'Recognize actual es-UY civil date, no padding assumption');
    const observed={day:Number(match[1]),month:Number(match[2]),year:Number(match[3])};
    cases.push({timezone:process.env.TZ,days,pass:observed.day===8&&observed.month===8&&observed.year===2027,observed,messageText:drafts[0].messageText});
  }
  console.log(JSON.stringify({source,timezone:process.env.TZ,bodySha256:crypto.createHash('sha256').update(body).digest('hex'),sameFunctionIn1337:body===other,cases}));
  process.exitCode=cases.some(c=>!c.pass)?1:0;
} else {
  const target=new URL('159-fecha-seguimiento.json',import.meta.url);assert.equal(fs.existsSync(target),false,'Preserve receipt');
  const base=Object.fromEntries(['PATH','SystemRoot','WINDIR','COMSPEC','TEMP','TMP'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
  const runs=['UTC','America/Montevideo'].map(TZ=>{const p=spawnSync(process.execPath,['--max-old-space-size=192',script,'--child'],{cwd:root,env:{...base,TZ},encoding:'utf8',timeout:60000});
    assert.ok(p.status===0||p.status===1,p.stderr||String(p.error));assert.ok(p.stdout.trim(),'Do not accept zero cases');return {exitCode:p.status,stderr:p.stderr,...JSON.parse(p.stdout)};});
  const cases=runs.flatMap(r=>r.cases);assert.equal(cases.length,4);
  const result={source,testSha256:crypto.createHash('sha256').update(fs.readFileSync(script)).digest('hex'),runs,summary:{pass:cases.filter(c=>c.pass).length,fail:cases.filter(c=>!c.pass).length},
    scope:'Actual followup draft generator, both5-day/14-day branches, civil event date in UTC and Uruguay',
    limits:['Controlled budget/message storage and agent-log sink; no real message, HTTP or SDK','Existing193 date family, new consumer evidence; no date-storage/global-timezone change'],appEdited:false};
  fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));if(result.summary.fail)process.exitCode=1;
}
