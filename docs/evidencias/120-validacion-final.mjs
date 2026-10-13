import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
const source='3a3bc1c673476b75065e8063358c48797c071700';
const read=name=>{const f='docs/evidencias/'+name;return JSON.parse(fs.existsSync(f)?fs.readFileSync(f,'utf8'):zlib.gunzipSync(fs.readFileSync(f+'.gz')).toString('utf8'));};
if(execFileSync('git',['diff','--name-only',source,'--','src','public','package.json','package-lock.json'],{encoding:'utf8'}).trim()) throw new Error('Production source changed');
for(const mode of ['build','jest','acentos','probe']){
  const r=read(`120-${mode}-execution.json`);
  if(r.applicationSourceSha!==source||r.status!=='finished'||r.exitCode!==0)throw new Error('Current proof missing: '+mode);
  if(['build','jest'].includes(mode)&&!r.cleanup?.bytesRestored)throw new Error('Bytes not restored: '+mode);
}
const tests=read('120-jest.json'),manifest=read('120-jest-inventario.json');
if(manifest.sourceSha!==source||tests.numTotalTestSuites!==manifest.count||tests.numPassedTestSuites!==manifest.count||tests.numFailedTestSuites||tests.numPendingTestSuites||tests.numFailedTests||tests.numPendingTests||tests.numPassedTests!==tests.numTotalTests)throw new Error('Jest incomplete');
const before=read('120-antes-arreglo.json');if(before.numFailedTests!==5||before.numPassedTests!==2)throw new Error('Baseline failures not preserved');
const native=read('120-encargado-resultados.json');
if(native.applicationSourceSha!==source||native.provider!=='LOCAL_PROTOCOL_DOUBLE_NO_EXTERNAL_CALLS'||native.results.length!==6||native.results.some(r=>r.status!=='PASS')||!native.cleanup.bytesRestored)throw new Error('Native collection incomplete');
for(const viewport of ['desktop','mobile']){
  const find=name=>native.results.find(r=>r.viewport===viewport&&r.name===name)?.details;
  const down=find('provider-down-no-false-completion'),good=find('real-budget-does-not-repeat-false-model-summary'),empty=find('empty-catalog-proposal-not-saved');
  if(down?.success!==false||!down.noWrites||!down.responseVisible||down.providerRequests<1)throw new Error('Provider failure not observed');
  if(good?.success!==true||good.total!==1000||!good.budgetId||!good.modelSummaryDiscarded||!good.responseVisible||good.providerRequests!==2)throw new Error('Persisted budget missing');
  if(empty?.success!==false||empty.countStill!==1||!empty.responseVisible||empty.providerRequests!==1)throw new Error('Empty guard missing');
}
const sdk=read('120-limpieza-sdk.json'),stopped=read('120-entorno-detenido.json');
if(sdk.total!==0||stopped.listeners.length||stopped.stopped.length!==2)throw new Error('QA not cleaned');
const foreignHash=crypto.createHash('sha256').update(fs.readFileSync('src/data/marketing-checklist.json')).digest('hex');
if(foreignHash!=='f125e01bdf62a2c6251a4410abe37916082b820b30b105edbe9ee918e814f1e5')throw new Error('Foreign bytes changed');
const graph=read('120-graphify.json');if(graph.sourceSha!==source||graph.llmCalls!==0)throw new Error('Graph source differs');
const result={applicationSourceSha:source,evidenceHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),outcome:'PASS_ENCARGADO_TRUTHFUL_RESULTS_ONLY',
  jest:{suites:tests.numPassedTestSuites,tests:tests.numPassedTests,failed:0,omitted:0},buildTypesLint:true,acentos:true,
  native:{cases:6,viewports:['desktop','Pixel7'],realWidgetApiAndFirestore:true,provider:'LOCAL_PROTOCOL_DOUBLE',externalModelCertified:false},
  cleanup:{sdkDocuments:0,servicesStopped:2,bytesRestored:true,foreignHash},graph,
  privateClaude:'NO_CONTRASTADO',allAppCertified:false,publishedCertified:false,
  notCovered:['financial ACK retry in chat','other agent roles','real Gemini API','microphone and voice provider','19 original quotes','Hosting and OAuth','hardware'],
  oldFailuresPreserved:['120-antes-arreglo.json','120-prototipo-prueba-antigua.json','120-prototipo-lecturas-fallos.json']};
fs.writeFileSync('docs/evidencias/120-aceptacion.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
