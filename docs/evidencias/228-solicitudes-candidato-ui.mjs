import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const baseUrl = new URL('194-portal-controles-version-nueva.mjs',import.meta.url);
const target = new URL('228-solicitudes-candidato-ui.json',import.meta.url);
assert.equal(fs.existsSync(target),false,'Preserve receipt');
const raw = fs.readFileSync(baseUrl,'utf8');
const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const ast = ts.createSourceFile('base.mjs',raw,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const start = ast.statements.find(node=>ts.isTryStatement(node));assert.ok(start);
let bootstrap = raw.slice(0,start.getStart(ast));
function replaceOnce(before,after){assert.equal(bootstrap.split(before).length,2,before);bootstrap=bootstrap.replace(before,after);}
replaceOnce("'194-portal-controles-version-nueva.json'","'228-solicitudes-candidato-ui.json'");
replaceOnce("'fa3b492b8f1d6a77433a92f4d63b665cfea3747c'","'b91bdbeff7d3db7489fabdadd599776376c0577a'");
replaceOnce("actualizarFiesta: mutate","actualizarFiesta: async (...args) => saveReject ? { success: false, error: 'QA189_SAVE_FAILED' } : mutate(...args)");
replaceOnce("getServiciosEmpresaPublicos: async () => []","getServiciosEmpresaPublicos: async () => [{ id: 'qa201-extra', nombre: 'Extra ficticio QA201', precioVenta: 200, calculationMethod: 'fijo' }]");
replaceOnce("['MUSIC_LIST_KEYS','normalizeClientPaymentAmount'","['createRequestId','submitClientMenuChangeRequest','submitClientServiceAddRequest','MUSIC_LIST_KEYS','normalizeClientPaymentAmount'");
replaceOnce("['submitClientMenuChangeRequest','submitClientServiceAddRequest','checkDateAvailability'","['checkDateAvailability'");
bootstrap=bootstrap.replaceAll('import.meta.url',JSON.stringify(import.meta.url));
const scenarios = String.raw`
const section = title => [...document.querySelectorAll('p')].find(item=>item.textContent.trim()===title)?.closest('.border');
const inputFromLabel = name => [...document.querySelectorAll('label')].find(item=>item.textContent.startsWith(name))?.querySelector('input');
async function setInput(input,value){assert.ok(input);await act(async()=>{await user.clear(input);if(value)await user.type(input,String(value));});}
try {
  fixture.clientPortalSettings.accessPhase='organizacion';fixture.clientPortalSettings.menu={visible:true};
  reset();await renderPage();
  const catalogue=section('Agregar servicio del catalogo');assert.ok(catalogue);
  check('catalogue-extra-visible-positive',!!catalogue.querySelector('select option[value="qa201-extra"]'),{});
  await click(button('Enviar solicitud'));
  check('empty-increase-does-not-create-request',!store.clientMenuChangeRequests?.length&&body().includes('Agregá al menos una persona'),{});
  await setInput(inputFromLabel('Adultos a agregar'),2);await click(button('Enviar solicitud'));
  const guest=store.clientMenuChangeRequests?.at(-1);
  check('explicit-zero-adjustment-keeps-guest-estimate-zero',guest?.adultosDelta===2&&guest.montoAdicional===80&&guest.nuevoTotalEstimado===1080,{request:guest,configuredPercentage:budget.ajusteAnualPorcentaje,uiHas15:body().includes('ajuste anual de 15%')});
  check('guest-request-only-pending-not-budget-rewrite',guest?.status==='pendiente'&&budget.totalConDescuento===1000&&document.querySelector('input[type="number"]').value==='0',{request:guest,budgetTotal:budget.totalConDescuento});
  await click(button('Solicitar servicio'));
  const extra=store.clientServiceChangeRequests?.at(-1);
  check('explicit-zero-adjustment-keeps-extra-at-catalogue-price',extra?.precioBase===200&&extra.ajustePorcentaje===0&&extra.montoAdicional===200,{request:extra,configuredPercentage:budget.ajusteAnualPorcentaje});
  budget.ajusteAnualPorcentaje=10;reset();await renderPage();await click(button('Solicitar servicio'));
  const ten=store.clientServiceChangeRequests?.at(-1);
  check('explicit-ten-percent-positive-control',ten?.ajustePorcentaje===10&&ten.montoAdicional===220,{request:ten});
  const note=document.querySelector('textarea[placeholder="Nota para AK sobre este servicio"]');await setInput(note,'Conservar nota QA201');saveReject=true;await click(button('Solicitar servicio'));saveReject=false;
  check('extra-save-error-visible-and-keeps-note',body().includes('QA189_SAVE_FAILED')&&note.value==='Conservar nota QA201'&&!button('Solicitar servicio').disabled&&store.clientServiceChangeRequests.length===1,{note:note.value,requests:store.clientServiceChangeRequests.length});
  await setInput(inputFromLabel('Adultos a agregar'),3);saveReject=true;await click(button('Enviar solicitud'));saveReject=false;
  check('guest-save-error-visible-and-keeps-increase',body().includes('QA189_SAVE_FAILED')&&inputFromLabel('Adultos a agregar').value==='3'&&!store.clientMenuChangeRequests?.length&&!button('Enviar solicitud').disabled,{});
} catch(error){observedErrors.push('QA_HARNESS_OR_UNEXPECTED_ERROR:'+String(error.stack||error));process.exitCode=2;}
finally {
  await unmount();dom.window.close();
  const receipt={source,checkedAt:new Date().toISOString(),hashes,cases,summary:{total:cases.length,pass:cases.filter(item=>item.pass).length,fail:cases.filter(item=>!item.pass).length},observedErrors,
  appEdited:false,realServices:false,limits:'Actual active page/React handlers and request actions, portal JWT and controlled store/read/notifications. Catalog fixture200 and25guests. No NextHTTP, Firestore, formal budget approval or real charge. Zero configuration and ten-percent positive controls; not a new pricing policy.'};
  fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify({source,summary:receipt.summary,errors:observedErrors.filter(item=>item.startsWith('QA_HARNESS')),failures:cases.filter(item=>!item.pass)}));
}
`;
const program = bootstrap+scenarios;
const result=spawnSync(process.execPath,['--max-old-space-size=256','--input-type=module'],{cwd:fileURLToPath(new URL('../../',import.meta.url)),input:program,encoding:'utf8',maxBuffer:4*1024**2,timeout:120000});
process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
assert.equal(result.error,undefined,String(result.error));
assert.ok(fs.existsSync(target),'Scenario did not produce receipt');
const receipt=JSON.parse(fs.readFileSync(target,'utf8'));
receipt.generator={baseFile:baseUrl.pathname,baseSha256:crypto.createHash('sha256').update(raw).digest('hex'),programSha256:crypto.createHash('sha256').update(program).digest('hex'),childExit:result.status};
fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n');
process.exitCode=result.status||0;
