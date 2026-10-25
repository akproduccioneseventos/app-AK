import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {normalizeReport} from './276-normalizar-casos.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),source='3e45a4ac6b479f89605163168e31b37dc84f2d0f';
const target=path.join(dir,'318-conciliacion-cierre.json');assert(!fs.existsSync(target));
const read=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
for(const name of['311-continuidad.json','315-continuidad-final.json','320-continuidad-recorrido.json','322-continuidad-canonica.json','328-continuidad-control.json','330-continuidad-normal.json','332-continuidad-restantes.json','334-contexto-continuidad.json','337-excepciones-continuidad.json','340-excepciones-continuidad.json','344-excepciones-continuidad.json']){const r=read(name);assert.equal(r.source,source);assert.equal(r.phase,'finished');}
const reports=[];
for(const id of['296','310']){const run=read(id+'-ejecucion.json');assert.equal(run.source,source);for(const batch of run.batches||[])reports.push({file:batch.report,run:id,scope:'Original selected native cases',producer:batch.stats});}
for(const id of['304','307','327']){const run=read(id+'-ejecucion.json');assert.equal(run.source,source);assert.equal(run.phase,'finished');reports.push({file:id+'-resultados.json',run:id,scope:id==='304'?'SDK-only video reader/mirror cases':id==='307'?'Real-click showcase state':'Normal-fixture control, localFIS double only',producer:run.stats});}
const histories=new Map(),producer={expected:0,unexpected:0,skipped:0,flaky:0};
for(const report of reports){
 const native=read(report.file);const normalized=normalizeReport(native,report.run);assert.equal(normalized.length,native.stats.expected+native.stats.unexpected+native.stats.skipped+native.stats.flaky,'Every producer case accounted');
 for(const key of Object.keys(producer))producer[key]+=native.stats[key]||0;
 report.count=normalized.length;report.stats=native.stats;
 for(const test of normalized){const entry=histories.get(test.identity)||[];entry.push({...test,report:report.file,source});histories.set(test.identity,entry);}
}
const cases=[...histories].map(([identity,attempts])=>({identity,attempts,latest:attempts.at(-1)}));
const counts={unique:cases.length,reportedAttempts:reports.reduce((sum,r)=>sum+r.count,0),executed:0,passed:0,failedOrTimedOut:0,skippedOrFixme:0,other:0};
for(const {latest:test}of cases){if(test.executed)counts.executed++;if(test.status==='passed')counts.passed++;else if(test.status==='failed'||test.status==='timedOut')counts.failedOrTimedOut++;else if(test.status==='skipped')counts.skippedOrFixme++;else counts.other++;}
let inventory=null,deniedNetworkInventory=null;
for(const id of['297','331'])if(fs.existsSync(path.join(dir,id+'-recorrido-resultados.json'))){const routes=read(id+'-recorrido-resultados.json');assert(Array.isArray(routes));const value={reportedRoutes:routes.length,states:routes.reduce((a,r)=>{a[r.estado]=(a[r.estado]||0)+1;return a},{}),scope:id==='331'?'Normal fixture, localFIS double, single desktop actor. Opening routes/photos NEVER accepts every control/role.':'Denied-network original route walk; SDK errors contaminate generic console assertion. NOT normal navigation acceptance.',routes};if(id==='331')inventory=value;else deniedNetworkInventory=value;}
for(const file of['332-recorrido-consolidado.json','334-recorrido-consolidado.json'])if(fs.existsSync(path.join(dir,file))){const r=read(file);assert.equal(r.source,source);inventory={reportedRoutes:r.reviewedUnique,totalTemplates:r.totalTemplates,unvisited:r.unvisited,states:r.states,scope:r.scope,routes:r.routes};}
const jest=read('321-jest-final.json');assert.equal(jest.source,source);assert.equal(jest.phase,'finished');
const result={source,finished:new Date().toISOString(),appEdited:false,reports,producer,counts,cases,inventory,deniedNetworkInventory,jest:{summary:jest.summary,exitCode:jest.exitCode,error:jest.error,sourceDiff:jest.sourceDiff},noncanonicalUnitRun:{receipt:'314-jest-final.json',reason:'Browser/demo variables incorrectly forced globally; original72failures preserved, not72appbugs.'},closures:{payment218:read('285-aprobacion-sdk.json'),contract219:read('286-contrato-guardado-sdk.json')},limits:'Actual frozen-source3e only. Baseline725/277 NOT silently promoted or added. Interrupted296 retains only completed producer report, partial second batch remains interrupted. All original attempts retained, failures/skips never become PASS by counting. Jest/SDK/native/route counts are separate evidence classes, not summed into business-feature counts. No every-action/role/external-provider/zero-error certificate.'};
fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,cases:undefined,reports:undefined,closures:undefined,inventory:inventory?{reportedRoutes:inventory.reportedRoutes,states:inventory.states}:null,deniedNetworkInventory:deniedNetworkInventory?{reportedRoutes:deniedNetworkInventory.reportedRoutes,states:deniedNetworkInventory.states}:null}));
