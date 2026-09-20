const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require(process.env.AUDIT_TYPESCRIPT||'typescript');
process.env.TZ='America/Montevideo';
const root=process.argv[2],results=[];
function make(file,names,scope,expr){
 const s=ts.createSourceFile(file,fs.readFileSync(path.join(root,file),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),parts=[];
 function visit(n){if(ts.isFunctionDeclaration(n)&&names.includes(n.name?.text))parts.push(n.getText(s).replace(/^export\s+/,''));else if(ts.isVariableDeclaration(n)&&names.includes(n.name.getText(s)))parts.push('const '+n.getText(s)+';');ts.forEachChild(n,visit);}visit(s);
 if(parts.length!==names.length)throw Error('Missing/duplicate symbols '+names);
 return vm.runInNewContext(ts.transpileModule(parts.join('\n')+'\n'+expr,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,scope);
}
async function kit(kind){
 const notices=[];let saving=false,localUpdates=0;
 const ok=async()=>({success:true});
 const save=make('carteleria.tsx',['handleSaveAll'],{fiestaId:'f',fiesta:{configuracion:{}},nombreEventoOverride:'Evento',fechaEventoOverride:'2026-10-10',tipoCelebracionOverride:'Boda',qrSubtitle:'Fotos',cartaTragos:{},menuMesa:{},numerosMesa:{},setIsSaving:x=>saving=x,setFiesta:()=>localUpdates++,toast:x=>notices.push(x),updateCartaTragos:ok,updateMenuMesa:async()=>{if(kind==='throws')throw Error('unavailable');return {success:kind!=='partial',error:'unavailable'};},updateNumerosMesa:ok,updateConfiguracionFiestaActual:ok},'handleSaveAll');await save();
 const success=notices.some(x=>x.title==='¡Kit guardado!');results.push({case:'kit-'+kind,success,saving,localUpdates,passed:!saving&&(kind==='normal'?success:!success)});
}
async function menu(kind){
 const old={titulo:'Anterior'},sent={titulo:'Nuevo'},newer={titulo:'Ultima edicion'};let local=sent,saving=false,resolve;const notices=[];
 const pending=new Promise(r=>resolve=r),ref={current:old};
 const save=make('menu.tsx',['handleSave'],{fiestaId:'f',data:sent,lastSavedDataRef:ref,setIsSaving:x=>saving=x,setData:x=>local=x,toast:x=>notices.push(x),updateMenuMesaAction:async()=>pending},'handleSave');
 const task=save();if(kind==='late-failure')local=newer;resolve({success:kind==='normal',error:'unavailable'});await task;
 results.push({case:'menu-'+kind,local:local.titulo,saving,errorNotice:notices.some(x=>x.variant==='destructive'),passed:!saving&&(kind==='normal'?ref.current===sent:local===(kind==='late-failure'?newer:sent))});
}
async function numbers(kind){
 let count=20,loading=true,fiesta=null;const notices=[];
 const elements=kind==='seats'?[{id:'m',name:'Redonda',type:'element',category:'Mobiliario',seats:8}]:[{id:'m',name:'Mesa redonda',type:'element',category:'Mesas',seats:8}];
 const load=make('numeros.tsx',['loadData','formatDate'],{useCallback:f=>f,fiestaId:'f',router:{replace(){}},toast:x=>notices.push(x),defaultNumerosMesaData:{},setIsLoading:x=>loading=x,setFiesta:x=>fiesta=x,setLogoUrl(){},setData(){},setTableCount:x=>count=x,getInvoiceTemplateSettings:async()=>({}),getFiestaById:async()=>{if(kind==='fails')throw Error('unavailable');return {configuracion:{fechaEvento:'2026-10-10'},decoracion:{salonElements:elements}};}},'loadData');await load();
 results.push({case:'numbers-'+kind,count,spinner:loading||!fiesta,passed:kind==='fails'?!(loading||!fiesta):count===1});
}
(async()=>{
 for(const kind of ['normal','partial','throws'])await kit(kind);
 for(const file of ['carteleria.tsx','numeros.tsx']){
  const format=make(file,['formatDate'],{},'formatDate'),actual=format('2026-10-10');
  results.push({case:'date-'+file,actual,passed:actual.startsWith('10/10/')});
 }
 for(const kind of ['normal','failure','late-failure'])await menu(kind);
 for(const kind of ['category','seats','fails'])await numbers(kind);
 const filter=make('carteleria.tsx',['filterTableElements'],{},'filterTableElements');
 const found=filter([{id:'m',type:'element',name:'Redonda',category:'Mobiliario',seats:8}]);
 results.push({case:'kit-seats',count:found.length,passed:found.length===1});
 console.log(JSON.stringify({total:results.length,pass:results.filter(x=>x.passed).length,fail:results.filter(x=>!x.passed).length,results},null,2));
})().catch(e=>{console.error(e);process.exit(1)});

