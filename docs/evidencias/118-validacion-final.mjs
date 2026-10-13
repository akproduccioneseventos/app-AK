import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
const read=p=>{
  const file='docs/evidencias/'+p;
  return JSON.parse(fs.existsSync(file)?fs.readFileSync(file,'utf8'):zlib.gunzipSync(fs.readFileSync(file+'.gz')).toString('utf8'));
};
const source='662f123d41c59f6e802384322b10049b913fb416';
if (execFileSync('git',['diff','--name-only',source,'--','src','public','package.json','package-lock.json'],{encoding:'utf8'}).trim()) throw new Error('Production source changed');
for(const mode of ['build','jest','acentos','probe']) {
  const result=read(`117-${mode}-execution.json`);
  if(result.applicationSourceSha!==source || result.exitCode!==0 || result.status!=='finished') throw new Error('Missing current success: '+mode);
}
const jest=read('117-jest.json'), manifest=read('118-jest-inventario.json');
if(manifest.sourceSha!==source || jest.numTotalTestSuites!==manifest.count || jest.numPassedTestSuites!==manifest.count || jest.numFailedTestSuites || jest.numPendingTestSuites || jest.numFailedTests || jest.numPendingTests || jest.numPassedTests!==jest.numTotalTests) throw new Error('Jest incomplete');
const raw=read('117-configurador-resultados.json');
if(raw.applicationSourceSha!==source || raw.results.length!==8 || raw.results.some(r=>r.status!=='PASS') || !raw.cleanup.bytesRestored) throw new Error('Native collection incomplete');
for(const viewport of ['desktop','mobile']) {
  const rows=raw.results.filter(r=>r.viewport===viewport);
  const find=name=>rows.find(r=>r.name===name)?.details;
  const retry=find('failed-save-retry-one-budget-and-destination');
  const ack=find('lost-ack-retry-does-not-create-second-budget');
  const quote=find('new-quote-same-phone-keeps-distinct-budget');
  const ackProof=read(`117-ack-${viewport}.json`);
  if(retry?.count!==1 || retry.total!==850 || !retry.documentVisibleAfterReload || !/\/ver$/.test(retry.destination)) throw new Error('Real document missing: '+viewport);
  if(ack?.before!==2 || ack.after!==2 || ackProof.expected!==2 || !ackProof.noRepeatedCrmTimeline) throw new Error('Retry not idempotent: '+viewport);
  if(viewport==='mobile' && !ack.reloadedBeforeRetry) throw new Error('Reload case absent');
  if(quote?.count!==3 || quote.legitimateQuotesSamePhone!==2 || !quote.documentVisible || new Set(quote.numbers).size!==3) throw new Error('Legitimate new quote collapsed: '+viewport);
}
const sdk=read('117-limpieza-sdk.json'), stopped=read('117-entorno-detenido.json');
if(sdk.total!==0 || stopped.listeners.length || stopped.stopped.length!==2) throw new Error('Own QA not cleaned');
const expected='f125e01bdf62a2c6251a4410abe37916082b820b30b105edbe9ee918e814f1e5';
if(crypto.createHash('sha256').update(fs.readFileSync('src/data/marketing-checklist.json')).digest('hex')!==expected) throw new Error('Foreign file changed');
const graph=read('118-graphify.json'); if(graph.sourceSha!==source || graph.llmCalls!==0) throw new Error('Graph source differs');
const result={applicationSourceSha:source,evidenceHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),outcome:'PASS_ORDER_161_ONLY',
  jest:{suites:jest.numPassedTestSuites,tests:jest.numPassedTests,failed:0,omitted:0},
  buildTypesLint:true,acentos:true,native:{workflowCases:6,observations:2,realDocumentAfterReload:true,crmTimelineNotRepeated:true,newQuotesRemainAvailable:true},
  existingFriction152:raw.results.filter(r=>r.details?.fullyUncovered===false).map(r=>({viewport:r.viewport,hitbox:r.details.hitbox,keyboardFocus:r.details.keyboardFocus})),
  cleanup:{sdkDocuments:0,listeners:[],bytesRestored:true},graph,
  privateClaude:'NO_CONTRASTADO',publishedCertified:false,allAppCertified:false,
  oldFailuresPreserved:['117-configurador-antes-arreglo.json','118-focal-prototipo-fallos.json','117-types-inicial-execution.json'],
};
fs.writeFileSync('docs/evidencias/118-aceptacion.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({outcome:result.outcome,source,jest:result.jest,native:result.native,friction152:result.existingFriction152.length}));
