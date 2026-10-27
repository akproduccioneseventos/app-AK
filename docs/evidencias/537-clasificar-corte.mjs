import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url));
const all=JSON.parse(fs.readFileSync(path.join(dir,'516-nativos-consolidado.json'),'utf8')),state=JSON.parse(fs.readFileSync(path.join(dir,'512-ejecucion.json'),'utf8'));
const cutoff=Date.parse('2026-10-25T05:05:21.000Z');
const affected=new Set(state.batches.filter(b=>Date.parse(b.finished)>=cutoff).flatMap(b=>b.files));
const prior=all.rows.filter(r=>!affected.has(r.file));
const failures=prior.filter(r=>!['passed','skipped'].includes(r.status));
const result={source:all.source,created:new Date().toISOString(),cutoffUTC:new Date(cutoff).toISOString(),beforeCutoff:{rows:prior.length,pass:prior.filter(r=>r.status==='passed').length,skipped:prior.filter(r=>r.status==='skipped').length,nonPass:failures.length},afterCutoff:{rows:all.rows.filter(r=>affected.has(r.file)).length,files:[...affected],classification:'INCONCLUSIVE_EMULATOR_OOM_NOT_APP_DEFECTS_OR_ACCEPTANCE'},failures:failures.map(r=>({...r,attachments:r.attachments.filter(a=>a.path?.endsWith('error-context.md')||a.name==='trace')})),scope:'Triage input only, not accepted independent bugs. Bridge errors/latency/stale persistence oracles require source and UI evidence. Subsequent recovery preserves originals.'};
fs.writeFileSync(path.join(dir,'537-triage-pendientes.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,failures:result.failures.map(r=>({file:r.file,title:r.title,project:r.project,status:r.status,error:r.error.slice(0,200)}))}));
