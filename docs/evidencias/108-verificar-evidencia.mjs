import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const read=file=>JSON.parse(fs.readFileSync('docs/evidencias/'+file,'utf8'));
const sourceSha='8fa5b56a2833938541a657dcd15ef88130d24b0e';
const runtime=read('108-start-execution.json');
assert.equal(runtime.applicationSourceSha,sourceSha);
assert.equal(execFileSync('git',['diff',sourceSha,'HEAD','--name-only','--','src','package.json','package-lock.json'],{encoding:'utf8'}).trim(),'');
const cases=read('108-limites-finales.json');
const panels=cases.filter(r=>!r.session);
const sessions=cases.filter(r=>r.session);
assert.equal(panels.length,4);
assert.equal(sessions.length,8);
for(const r of panels){
  assert.equal(r.initialCuts,1);
  if(r.route.includes('sincronizaciones')){
    assert.ok(r.firstFailure.includes('TOTAL PLATAFORMAS\n0'));
    assert.ok(!r.firstFailure.includes('Error al cargar'));
    assert.equal(r.refreshCuts,1);
    assert.ok(r.refreshFailure.includes('Google Calendar y Workspace'));
  }else{
    assert.ok(r.firstFailure.includes('Failed to fetch'));
    assert.ok(!r.afterDismiss.includes('Failed to fetch'));
    assert.ok(!r.afterDismiss.includes('No se pudieron cargar'));
    assert.ok(r.afterDismiss.includes('No hay publicaciones'));
    assert.ok(!r.failureButtons.some(text=>/reintentar/i.test(text)));
  }
}
for(const r of sessions){assert.equal(new URL(r.url).pathname,'/login');assert.ok(r.body.includes('Acceso Protegido'));}
const rpc=read('108-rpc-control.json');
assert.equal(rpc.length,6);
for(const r of rpc){
  if(r.session==='valid')assert.equal(r.status,200);
  else{assert.ok(!r.body.includes('QA108_PRIVATE_POST'));assert.ok(!r.body.includes('google-calendar'));}
}
const initial=read('108-paneles-inicial.json');
assert.equal(initial.length,4);
for(const r of initial.filter(r=>r.label==='Conexiones')){
  assert.ok(r.body.includes('Sincronización en curso'));
  assert.ok(r.body.includes('Falta vincular cuenta de Instagram'));
}
const files=fs.readdirSync('docs/evidencias').filter(file=>/^108-.*\.(json|png)$/.test(file)&&file!=='108-resultado.json').sort();
const report={sourceSha,head:runtime.head,criteria:{connectionsLoad:'FAIL',socialErrorAfterDismiss:'FAIL',instagramNotStarted:'FAIL',browserSessionRedirects:{passed:8},rpcReadIsolation:{passed:6}},
  artifacts:files.map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync('docs/evidencias/'+file)).digest('hex')})),
  limits:['Orden154 sin programar','No cuentas/publicacion/entrega reales','No perfiles completos ni cero errores globales']};
fs.writeFileSync('docs/evidencias/108-resultado.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({sourceSha,criteria:report.criteria}));
