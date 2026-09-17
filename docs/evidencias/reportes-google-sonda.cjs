const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require(process.env.AUDIT_TYPESCRIPT || 'typescript');
const root = process.argv[2];
function run(file, names, scope, expression) {
  const s = ts.createSourceFile(file, fs.readFileSync(path.join(root,file),'utf8'),ts.ScriptTarget.Latest,true);
  const found=[];
  s.forEachChild(n=>{if(ts.isFunctionDeclaration(n)&&n.name&&names.includes(n.name.text))found.push(n.getText(s).replace(/^export\s+/,''));});
  if(found.length!==names.length)throw Error('Missing production symbol');
  return vm.runInNewContext(ts.transpileModule(found.join('\n')+'\n'+expression,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,scope);
}
async function report(date, from, to, expected) {
  const scope={console,verifySession:async()=>({success:true}),getInvoices:async()=>[],getPresupuestos:async()=>[{id:'p',estado:'Aceptado',pagosCliente:[{id:'x',fecha:date,monto:1000}]}],getAllFiestas:async()=>[],getRoles:async()=>[],getGastosGenerales:async()=>[],isConfirmedClientPayment:()=>true,isFirmSalesInvoice:()=>true,getReconciledSalePayments:()=>[],range:{from:new Date(from),to:new Date(to)}};
  const r=await run('reportes.ts',['roundMoney','inRange','isFirmBudgetStatus','getProfitAndLossData'],scope,'getProfitAndLossData(range)');
  return {case:date,success:r.success,total:r.data?.ingresos.total,expected,passed:r.data?.ingresos.total===expected};
}
async function gmail(concurrent) {
  let saved=[],sends=0;
  const scope={requireAppSession:async()=>{},getFiestaById:async()=>({id:'f',invitados:[{id:'g',contacto:'synthetic@example.invalid'}]}),readSyncRecords:async()=>structuredClone(saved),writeSyncRecords:async r=>{saved=structuredClone(r);},getCompanyGoogleAccountForSend:async()=>({account:{id:'synthetic'},warnings:[]}),getGuestEmail:i=>i.contacto,buildClientEventCalendarEvent:()=>({}),buildGoogleCalendarTemplateUrl:()=>'',getFiestaTitle:()=>'',buildGuestInvitationEmailHtml:()=>'',sendCompanyEmail:async()=>{sends++;await Promise.resolve();return {success:true,warnings:[]};}};
  const call=run('google-extended.ts',['getRecord','upsertRecord','notifyGuestsWithCalendarLinks'],scope,'notifyGuestsWithCalendarLinks');
  if(concurrent)await Promise.all([call('f'),call('f')]);else {await call('f');await call('f');}
  return {case:concurrent?'gmail-concurrent':'gmail-sequential',sends,passed:sends===1};
}
(async()=>{
  const from='2026-09-01T00:00:00-03:00',to='2026-09-16T00:00:00-03:00';
  const results=[await report('2026-09-15T12:00:00-03:00',from,to,1000),await report('2026-09-16T12:00:00-03:00',from,to,1000),await report('2026-09-17T12:00:00-03:00',from,to,0),await gmail(false),await gmail(true)];
  console.log(JSON.stringify(results,null,2));process.exitCode=results.every(x=>x.passed)?0:1;
})();

