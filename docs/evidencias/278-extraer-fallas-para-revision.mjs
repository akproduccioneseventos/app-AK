import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const target=new URL('279-fallas-para-revision.json',import.meta.url);assert(!fs.existsSync(target));
const data=JSON.parse(fs.readFileSync(new URL('277-conciliacion-nativa.json',import.meta.url),'utf8'));
const cases=data.cases.filter(c=>['failed','timedOut'].includes(c.lastExecutedStatus)).map(c=>{
 const last=c.attempts.filter(a=>['failed','timedOut','passed'].includes(a.status)).at(-1);
 const messages=last.errors.map(e=>e.message||e.value||String(e));const text=messages.join('\n');
 return {id:crypto.createHash('sha256').update(c.identity).digest('hex').slice(0,12),file:c.file,title:c.title,project:c.project,run:last.run,status:last.status,reportedOutcome:last.reportedOutcome,expectedStatus:last.expectedStatus,
 sensitive:/contab|factura|presupuesto|cuota|se[nñ]a|contrat|pag[oas]|saldo|cost/i.test(c.file+' '+c.title),
 triageOnly:/Tearing down.*context|teardown/i.test(text)?'teardown-timeout':/screenshot.*Timeout|element.*stable/is.test(text)?'capture-timeout':/timeout|timed out/i.test(text)?'timeout-unclassified':'assertion-or-code-unclassified',
 errors:messages,source:data.source,appDefectConfirmed:false};
});
fs.writeFileSync(target,JSON.stringify({source:data.source,cases,scope:'46 latest unexpected raw cases for manual triage, NOT46appbugs. Financial/auth final decisions principal; never hide earlier results.'},null,2)+'\n');
console.log(JSON.stringify({file:fileURLToPath(target),count:cases.length,sensitive:cases.filter(c=>c.sensitive).length,triage:cases.reduce((a,c)=>(a[c.triageOnly]=(a[c.triageOnly]||0)+1,a),{})}));
