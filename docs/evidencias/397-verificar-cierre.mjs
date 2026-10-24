import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');
const read=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
const git=(args,cwd=root)=>{const r=spawnSync('git',args,{cwd,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
const current=read('385-delta-publico.json');assert.equal(current.phase,'finished');
assert.deepEqual([current.canonical.suites,current.canonical.total,current.canonical.pass,current.canonical.fail,current.canonical.pending],[862,5243,5243,0,0]);
assert.deepEqual([current.invoiceState.pass,current.invoiceState.fail],[2,1]);
const reminders=read('388-recordatorios-motor.json');assert.equal(reminders.source,current.source);assert.deepEqual(reminders.summary,{total:10,pass:10,fail:0});
const native=read('390-conciliacion-final.json');assert.deepEqual(native.counts,{total:210,passed:159,failedOrTimedOut:17,skipped:34,other:0});
const build=read('392-entorno.json');assert.equal(build.phase,'qa-setup-or-build-error');assert(!build.buildPid&&!Object.hasOwn(build,'buildExit'),'Do not report missing compilation as executed');
assert.equal(read('394-no-ejecutado.json').state,'NOT_EXECUTED_NO_CURRENT_BUILD');
const qa=[];for(const name of['364-retest-siete-suites.json','366-entorno.json','385-delta-publico.json','392-entorno.json']){const r=read(name);assert(r.finished,'Active receipt '+name);if(r.qa&&fs.existsSync(r.qa)){const diff=git(['diff','--name-only'],r.qa);assert.equal(diff,'',name+' QA source changed');qa.push({receipt:name,qa:r.qa,head:git(['rev-parse','HEAD'],r.qa),sourceDiff:diff});}}
const state=fs.readFileSync(path.join(root,'ESTADO-ACTUAL.md'),'utf8').trimEnd().split(/\r?\n/);assert(state.length<=40,'ESTADO limit '+state.length);
const allowed=git(['diff','--name-only']).split(/\r?\n/).filter(Boolean);assert(allowed.every(n=>n==='ESTADO-ACTUAL.md'||n.startsWith('docs/')),'App edits forbidden');
assert(!/VER RECIBO392 AL CIERRE|TODO|TBD/.test(fs.readFileSync(path.join(dir,'400-informe-final.md'),'utf8')),'Unfinished report marker');
const syntax=[];for(const name of fs.readdirSync(dir).filter(n=>/^(36[2-9]|3[7-9]\d)-.*\.(mjs|cjs)$/.test(n))){const r=spawnSync(process.execPath,['--check',path.join(dir,name)],{encoding:'utf8',timeout:15000});assert.equal(r.status,0,name+' '+r.stderr);syntax.push(name);}
const diff=spawnSync('git',['diff','--check'],{cwd:root,encoding:'utf8'});assert.equal(diff.status,0,diff.stdout+diff.stderr);
const result={at:new Date().toISOString(),kind:'DOCUMENTATION_AND_RECEIPT_CONSISTENCY_NOT_ANOTHER_APP_TEST',source:current.source,canonical:current.canonical,additionalInvoice:current.invoiceState,reminders:reminders.summary,nativeCounts:native.counts,buildNotStarted:true,native393394NotExecuted:true,qa,stateLines:state.length,allowedTrackedChanges:allowed,qaScriptsSyntaxChecked:syntax,bookkeepingAdjustment:'First check rejected41-line ESTADO; one blank line removed to comply40. No app tests were rerun or changed.',appEdited:false};
const target=path.join(dir,'397-controles-cierre.json');assert(!fs.existsSync(target));fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({stateLines:state.length,qa:qa.length,syntax:syntax.length,appEdited:false}));
