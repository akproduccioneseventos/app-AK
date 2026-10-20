import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const source='894d01603e0e03cebc8f90a6ccf869ef86bbe1de';
const files=['156-portales-cruzados-final.json','157-invitados-estaciones.json','158-tareas-respuesta-publica.json','159-fecha-seguimiento.json'];
const receipts=files.map(file=>{const bytes=fs.readFileSync(new URL(file,import.meta.url));const r=JSON.parse(bytes);assert.equal(r.source,source);return {file,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),summary:r.summary,scope:r.scope,limits:r.limits};});
const summary={cases:receipts.reduce((n,r)=>n+r.summary.pass+r.summary.fail,0),pass:receipts.reduce((n,r)=>n+r.summary.pass,0),fail:receipts.reduce((n,r)=>n+r.summary.fail,0)};
assert.equal(summary.cases,102);assert.equal(summary.pass,95);assert.equal(summary.fail,7);
const result={source,receipts,summary,
  findings:[{id:'AK-CODEX-156-PERSONAL-LECTURAS-PREVIAS',order:200,responsible:'Claude',status:'P1 reproduced, not implemented',failedAssertions:3},
    {id:'AK-CODEX-158-CRON-RESPUESTA',order:201,responsible:'Claude',status:'P1 conditional no-CRON_SECRET QA, production configuration unverified',failedAssertions:2},
    {id:'AK-CODEX-159-SEGUIMIENTO-FECHA-CIVIL',order:193,responsible:'Gemini',status:'Existing civil-date family, new consumer reproduced',failedAssertions:2}],
  reused:'151-155 accepted scopes preserved; no full build or broad Jest repeated',
  notCertified:['All controls, roles, pages and failure/concurrency combinations','Native UI in these batches','Real integrations, original19budgets, hardware and production business data'],
  overallAuditClosed:false,zeroErrorsCertified:false,appEdited:false,merged:false};
fs.writeFileSync(new URL('159-consolidado.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({source,summary,findings:result.findings}));
