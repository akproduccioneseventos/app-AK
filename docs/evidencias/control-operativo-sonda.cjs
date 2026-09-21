const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require(process.env.AUDIT_TYPESCRIPT||'typescript');
process.env.TZ='America/Montevideo';
const root=process.argv[2],results=[];
function make(file,names,scope,expr){const s=ts.createSourceFile(file,fs.readFileSync(path.join(root,file),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),parts=[];function visit(n){if(ts.isFunctionDeclaration(n)&&names.includes(n.name?.text))parts.push(n.getText(s).replace(/^export\s+/,''));else if(ts.isVariableDeclaration(n)&&names.includes(n.name.getText(s)))parts.push('const '+n.getText(s)+';');ts.forEachChild(n,visit);}visit(s);if(parts.length!==names.length)throw Error('Symbols '+names);return vm.runInNewContext(ts.transpileModule(parts.join('\n')+'\n'+expr,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,scope);}
class FixedDate extends Date{constructor(...args){super(...(args.length?args:['2026-09-20T12:00:00-03:00']));}static now(){return new Date('2026-09-20T12:00:00-03:00').getTime();}}
const score=make('score.tsx',['calculateReadinessScore'],{Date:FixedDate},'calculateReadinessScore');
for(const [name,patch,field,expected] of [
 ['normal',{},'tareasVencidas',0],
 ['due-today',{tareas:[{fechaLimite:'2026-09-20',completada:false}]},'tareasVencidas',0],
 ['overdue',{tareas:[{fechaLimite:'2026-09-19',completada:false}]},'tareasVencidas',1],
 ['payment-plan',{planDePagos:{cuotas:[{estado:'pendiente',monto:1000}]}},'pagosPendientes',1],
 ['empty-catering',{modulosContratados:{catering:true}},'cateringStatus','Pendiente de configuración'],
 ['drinks-only',{modulosContratados:{catering:true},bebidas:{categorias:[{activada:false,items:[]}]}},'cateringStatus','Pendiente de configuración']
]){const r=score({id:'f',othersDocumentos:[{id:'doc'}],...patch});results.push({case:'score-'+name,actual:r.detalles[field],expected,score:r.porcentajeReadiness,passed:r.detalles[field]===expected});}
async function shopping(kind){
 let list=[],error=null;const unitMixed=kind==='units-mixed';
 const ingredients=[{name:'Harina',unit:'kg',quantityPerPerson:1,costoUnitario:10,proveedor:'P',origenId:'i1'}];
 if(kind==='same-unit'||unitMixed)ingredients.push({name:'Harina',unit:unitMixed?'g':'kg',quantityPerPerson:unitMixed?500:2,costoUnitario:unitMixed?0.01:10,proveedor:'P',origenId:unitMixed?'i2':'i1'});
 const adults=kind==='zero-adults'?0:2,kids=kind==='zero-adults'?10:0;
 const load=make('resumen-planificacion.tsx',['loadData','parseSafeNumber'],{useCallback:f=>f,fiestaId:'f',setIsLoading(){},setFiesta(){},setEmpleados(){},setRoles(){},setPresupuesto(){},setMenu(){},setShoppingList:x=>list=x,setError:x=>error=x,toast(){},getFiestaById:async()=>({presupuestoId:'p',configuracion:{invitadosEstimados:adults+kids}}),getEmpleados:async()=>[],getRoles:async()=>[],getMenus:async()=>[{items:[{id:'dish_1',name:'Principal',ingredients}]}],getInsumos:async()=>[],getPresupuestoById:async()=>({invitadosAdultos:adults,invitadosNinos:kids,itemsPresupuestados:[{idServicioCatalogo:'dish_1',categoriaServicio:'Plato Principal',nombreServicio:'Principal'}]})},'loadData');await load();
 const qty=list.reduce((a,x)=>a+x.cantidadNecesaria,0),cost=list.reduce((a,x)=>a+x.costoTotalFaltante,0);
 const passed=!error&&(kind==='zero-adults'?qty===0:unitMixed?!(list.length===1&&list[0].unit==='kg'&&qty===1002):kind==='same-unit'?qty===6&&cost===60:qty===2&&cost===20);
 results.push({case:'shopping-'+kind,list:list.map(x=>({qty:x.cantidadNecesaria,unit:x.unit,cost:x.costoTotalFaltante})),error,passed});
}
async function mailbox(kind){
 let messages=[{id:'old'}],refreshing=false;const notices=[];
 const get=make('buzonActions.tsx',['getBuzonMessages'],{BUZON_COLLECTION:'buzon_messages',logger:{warn(){}},requireAppSession:async()=>{if(kind==='denied')throw Error('denied');},getDb:async()=>({collection:()=>({where:()=>({get:async()=>{if(kind==='db-failure')throw Error('unavailable');return {docs:kind==='empty'?[]:[{data:()=>({id:'new',timestamp:'2026-09-20T12:00:00Z'})}]};}})})})},'getBuzonMessages');
 const refresh=make('buzon.tsx',['handleRefresh'],{fiestaId:'f',getBuzonMessages:get,setIsRefreshing:x=>refreshing=x,setMessages:x=>messages=x,toast:x=>notices.push(x),console:{error(){}}},'handleRefresh');await refresh();
 const success=notices.some(x=>x.title==='Sincronizado');const failed=['denied','db-failure'].includes(kind);
 results.push({case:'mailbox-'+kind,ids:messages.map(x=>x.id),success,refreshing,passed:!refreshing&&(failed?!success&&messages[0]?.id==='old':success&&messages.length===(kind==='empty'?0:1))});
}
(async()=>{for(const k of ['normal','same-unit','zero-adults','units-mixed'])await shopping(k);for(const k of ['normal','empty','db-failure','denied'])await mailbox(k);console.log(JSON.stringify({total:results.length,pass:results.filter(x=>x.passed).length,fail:results.filter(x=>!x.passed).length,results},null,2));})().catch(e=>{console.error(e);process.exit(1)});

