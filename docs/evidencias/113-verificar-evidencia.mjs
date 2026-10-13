import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
const dir='docs/evidencias',read=n=>JSON.parse(fs.readFileSync(dir+'/'+n));
const main=read('113-costos-resultado.json'),consumer=read('113-costos-consumer-resultado.json'),matrix=new Map();
for(const row of main.results)matrix.set(row.viewport+'/'+row.name,{...row,evidence:'113-costos-resultado.json'});
for(const row of consumer.results){const key=row.viewport+'/'+row.name;if(!matrix.has(key)||matrix.get(key).status!=='NOT_ACCEPTED'||row.status!=='PASS')throw Error('Invalid consumer reconciliation');matrix.set(key,{...row,evidence:'113-costos-consumer-resultado.json'});}
const results=[...matrix.values()],pass=results.filter(r=>r.status==='PASS'),fail=results.filter(r=>r.status==='FAIL');
if(results.length!==14||pass.length!==10||fail.length!==4)throw Error('Unexpected acceptance count');
for(const r of[main,consumer])if(r.applicationSourceSha!=='8fa5b56a2833938541a657dcd15ef88130d24b0e'||r.cleanup.documentsRemaining!==0||!r.cleanup.bytesRestored)throw Error('Cleanup/source invalid');
const stopped=read('113-entorno-detenido.json');if(stopped.listeners.length||stopped.appFailure)throw Error('Lifecycle invalid');
for(const name of fs.readdirSync(dir).filter(n=>/^113-.*\.log$/.test(n)))fs.writeFileSync(dir+'/'+name+'.gz',zlib.gzipSync(fs.readFileSync(dir+'/'+name)));
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const evidence=fs.readdirSync(dir).filter(n=>n.startsWith('113-')&&!n.endsWith('.log')&&n!=='113-resultado.json').sort().map(n=>({file:dir+'/'+n,sha256:sha256(fs.readFileSync(dir+'/'+n))}));
const source=['src/app/actions/insumos.ts','src/app/actions/menus-catering.ts','src/app/(app)/empresa/insumos/page.tsx','src/components/catering/MenuForm.tsx'].map(file=>({file,sha256:sha256(fs.readFileSync(file))}));
const report={headAudited:'0122997c0a7780e786fb1c818e912a5137b443fa',applicationSourceSha:main.applicationSourceSha,mainCompared:'99faf4eb061fa46341cfdde6f81b93b3bfb9c73c',privateClaudeBatch:'NOT_CONTRASTED',functionalAcceptance:'FAIL_TWO_P1_FAMILIES_PENDING_ORDER_160',counts:{criteria:14,pass:10,fail:4},results,excludedAttempts:['113-sdk-discovery-execution.json: wrong dialog role','113-costos-inicial.json: rounding/selector mistakes','113-costos-resultado.json: two consumer NOT_ACCEPTED replaced only by two final consumers','113-costos-consumer-inicial.json: names are card text, not input'],cleanup:{main:main.cleanup,consumer:consumer.cleanup,lifecycle:stopped},source,evidence};
fs.writeFileSync(dir+'/113-resultado.json',JSON.stringify(report,null,2)+'\n');execFileSync('git',['diff','--check'],{stdio:'inherit'});
console.log(JSON.stringify({evidenceIntegrity:'PASS',functionalAcceptance:report.functionalAcceptance,counts:report.counts,files:evidence.length}));
