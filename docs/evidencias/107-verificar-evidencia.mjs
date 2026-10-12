import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = 'docs/evidencias';
const raw = JSON.parse(fs.readFileSync(path.join(root,'107-google-focused.json'),'utf8'));
const execution = JSON.parse(fs.readFileSync(path.join(root,'107-probe-execution.json'),'utf8'));
assert.equal(raw.length,2);
assert.equal(execution.status,'finished');
assert.equal(execution.exitCode,0);
const sourceSha = '8fa5b56a2833938541a657dcd15ef88130d24b0e';
assert.equal(execution.applicationSourceSha,sourceSha);
assert.equal(execFileSync('git',['diff',sourceSha,'HEAD','--name-only','--','src','package.json','package-lock.json'],{encoding:'utf8'}).trim(),'');
const cases = raw.map(result => {
  assert.equal(result.injected,1);
  assert.equal(result.retryError,'');
  assert.ok(result.afterRetry.includes('Falta configurar Google antes de conectar.'));
  assert.ok(result.initial.includes('Cuenta de AK\nConectada'));
  assert.ok(result.initial.includes('Personal conectado\n1/14'));
  assert.ok(result.initial.includes('7% del equipo'));
  assert.ok(result.buttons.some(button => button.text === 'Sincronizar fiestas' && button.disabled === false));
  return {context:result.name,statusCriterion:'FAIL',recoveryByRealButton:'PASS',injectedTransportFaults:1};
});
const files = fs.readdirSync(root).filter(file => /^107-google-.*(?:\.json|\.png)$/.test(file)).sort();
const artifacts = files.map(file => ({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')}));
const report = {sourceSha,head:execution.head,fixtureStatus:{company:'needs_reconnect',employee:'error'},
  cases,artifacts,limits:['No OAuth/token/correo real','No nueva compilacion ni cambios de app','Sonda exit0 NO significa estado aprobado','Tanda privada de Claude no contrastada']};
fs.writeFileSync(path.join(root,'107-resultado.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({sourceSha,cases,artifactCount:artifacts.length}));
