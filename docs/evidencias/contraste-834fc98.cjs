const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require(process.env.AUDIT_TYPESCRIPT||'typescript');
const root=process.argv[2],file='src/app/actions/fiesta/barra-tecnologica.actions.ts';
const s=ts.createSourceFile(file,fs.readFileSync(path.join(root,file),'utf8'),ts.ScriptTarget.Latest,true);
function get(names,scope,expr){const parts=[];function visit(n){if(ts.isFunctionDeclaration(n)&&names.includes(n.name?.text))parts.push(n.getText(s));else if(ts.isVariableDeclaration(n)&&names.includes(n.name.getText(s)))parts.push('let '+n.getText(s)+';');ts.forEachChild(n,visit);}visit(s);if(parts.length!==names.length)throw Error('Missing symbol');return vm.runInNewContext(ts.transpileModule(parts.join('\n')+'\n'+expr,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,scope);}
(async()=>{
 const results=[];
 const queue=get(['stockPromiseChain','enLaColaDeStock'],{},'enLaColaDeStock');let calls=0,failed=false;
 try{await queue(async()=>{calls++;throw Error('temporary');});}catch{failed=true;}
 await queue(async()=>{calls++;});results.push({case:'BAR02-next-operation-after-failure',passed:failed&&calls===2,calls});
 let persisted=[{pedido:'fixture',movimientos:[{insumoId:'i',cantidad:1}]}],release,started;
 const entered=new Promise(r=>started=r);const blocked=new Promise(r=>release=r);
 const retry=get(['reintentarDevolucionesPendientes'],{getDb:async()=>({}),DEVOLUCIONES_PENDIENTES_FILE:'fixture',mutateGenericJsonArray:async(_f,mutate)=>{const next=mutate(structuredClone(persisted));if(next)persisted=next;},reponerStock:async()=>{started();await blocked;},anotarDevolucionPendiente:async()=>{},logger:{info(){},warn(){},error(){}}},'reintentarDevolucionesPendientes');
 const active=retry();await entered;
 results.push({case:'BAR01-durable-record-before-stock-commit',passed:persisted.length===1,pendingRecords:persisted.length,stockCommitted:false,note:'Observation at await boundary; process crash not executed.'});
 release();await active;
 console.log(JSON.stringify({sha:'834fc98e312d657f0486993138e10028bbe49308',scope:'AST isolated; simulated persistence; not Firebase/E2E',results},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});

