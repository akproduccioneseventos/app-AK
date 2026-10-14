import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
const read=name=>{
  const file='docs/evidencias/'+name;
  return JSON.parse(fs.existsSync(file)?fs.readFileSync(file,'utf8'):zlib.gunzipSync(fs.readFileSync(file+'.gz')).toString('utf8'));
};
const source='a638c8508997fd9b55ed20962d9d4a7284d6cfc3';
if(execFileSync('git',['diff','--name-only',source,'--','src','public','package.json','package-lock.json'],{encoding:'utf8'}).trim()) throw new Error('Production source changed');
for(const mode of ['build','jest','acentos','probe']) {
  const run=read(`119-${mode}-execution.json`);
  if(run.applicationSourceSha!==source||run.exitCode!==0||run.status!=='finished') throw new Error('Missing current success: '+mode);
  if(['build','jest'].includes(mode)&&!run.cleanup?.bytesRestored) throw new Error('Fixture bytes not restored: '+mode);
}
const tests=read('119-jest.json'), manifest=read('119-jest-inventario.json');
if(manifest.sourceSha!==source||tests.numTotalTestSuites!==manifest.count||tests.numPassedTestSuites!==manifest.count||tests.numFailedTestSuites||tests.numPendingTestSuites||tests.numFailedTests||tests.numPendingTests||tests.numPassedTests!==tests.numTotalTests) throw new Error('Incomplete Jest');
const native=read('119-manual-resultados.json');
if(native.applicationSourceSha!==source||native.results.length!==6||native.results.some(r=>r.status!=='PASS')||!native.cleanup.bytesRestored) throw new Error('Native cases incomplete');
for(const viewport of ['desktop','mobile']) {
  const find=name=>native.results.find(r=>r.viewport===viewport&&r.name===name)?.details;
  const before=find('before-send-error-retry-one-manual-budget');
  const ack=find('lost-ack-reload-retry-one-manual-budget');
  const fresh=find('deliberate-identical-quote-remains-a-new-budget');
  if(before?.count!==1||before.total!==900||!before.documentVisibleAfterReload) throw new Error('Pre-send retry missing');
  if(ack?.before?.length!==2||ack.after?.length!==2||JSON.stringify(ack.before)!==JSON.stringify(ack.after)||!ack.reloadedBeforeRetry||!ack.noRepeatedCrmTimeline||!ack.documentVisibleAfterReload) throw new Error('Lost ACK retry missing');
  if(fresh?.count!==3||fresh.distinctNumbers!==3||fresh.legitimateIdenticalQuotes!==2||!fresh.documentVisibleAfterReload) throw new Error('New quotes missing');
}
const cleanup=read('119-limpieza-sdk.json'), stopped=read('119-entorno-detenido.json');
if(cleanup.total!==0||stopped.listeners.length||stopped.stopped.length!==2) throw new Error('QA services/data not cleaned');
const hash=crypto.createHash('sha256').update(fs.readFileSync('src/data/marketing-checklist.json')).digest('hex');
if(hash!=='f125e01bdf62a2c6251a4410abe37916082b820b30b105edbe9ee918e814f1e5') throw new Error('Foreign bytes changed');
const before=read('119-manual-ack-antes-arreglo.json');
if(before.before.length!==1||before.after.length!==2||before.expected!==1) throw new Error('Original failure not preserved');
const graph=read('119-graphify.json');
if(graph.sourceSha!==source||graph.llmCalls!==0) throw new Error('Graph source differs');
const acceptance={applicationSourceSha:source,evidenceHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),outcome:'PASS_MANUAL_ACK_ONLY',
  jest:{suites:tests.numPassedTestSuites,tests:tests.numPassedTests,failed:0,omitted:0},buildTypesLint:true,acentos:true,
  native:{cases:6,viewports:['desktop','Pixel7'],lostAckAfterReload:'2->2',crmTimelineNotRepeated:true,newQuotesSamePhone:true,documentVisibleAfterReload:true},
  cleanup:{sdkDocuments:0,listeners:[],bytesRestored:true,foreignHash:hash},graph,
  privateClaude:'NO_CONTRASTADO',publishedCertified:false,allAppCertified:false,
  notCovered:['AI tool retries','coupon real provider','event linking failure','Hosting','OAuth','19 originals','hardware'],
  historicalFailure:'119-manual-ack-antes-arreglo.json',
};
fs.writeFileSync('docs/evidencias/119-aceptacion.json',JSON.stringify(acceptance,null,2)+'\n');
console.log(JSON.stringify(acceptance));
