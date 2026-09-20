const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require(process.env.AUDIT_TYPESCRIPT||'typescript');
const root=process.argv[2],results=[];
function make(file,names,scope,expression,property=false){
 const s=ts.createSourceFile(file,fs.readFileSync(path.join(root,file),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),parts=[];
 function visit(n){if(property&&ts.isPropertyAssignment(n)&&names.includes(n.name.getText(s)))parts.push('const '+n.name.getText(s)+' = '+n.initializer.getText(s)+';');else if(!property&&ts.isFunctionDeclaration(n)&&names.includes(n.name?.text))parts.push(n.getText(s).replace(/^export\s+/,''));else if(!property&&ts.isVariableDeclaration(n)&&names.includes(n.name.getText(s)))parts.push('const '+n.getText(s)+';');ts.forEachChild(n,visit);}visit(s);
 if(parts.length!==names.length)throw Error('Symbol count mismatch '+names);
 return vm.runInNewContext(ts.transpileModule(parts.join('\n')+'\n'+expression,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,scope);
}
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
async function photoLoad(kind){
 let data=null,loading=true,error=null;const notices=[];
 const old={id:'sync_catalog_123',nombre:'Foto Fiesta',estado:'Entregado',linkEntrega:'https://example.invalid/album'};
 const load=make('foto.tsx',['loadData'],{useCallback:f=>f,fiestaId:'f',token:undefined,toast:x=>notices.push(x),setIsLoading:x=>loading=x,setAccessError:x=>error=x,setIsExternalProvider(){},setEventDate(){},setFormData:x=>data=x,verifyAccesoPersonalToken:async()=>({authorized:true}),getFiestaById:async()=>{if(kind==='load-fails')throw Error('unavailable');return {configuracion:{fechaEvento:'2026-10-10'},presupuestoId:'p',fotografiaYFilmacion:{servicios:[old]}};},getPresupuestoById:async()=>({itemsPresupuestados:[{idServicioCatalogo:'catalog',nombreServicio:kind==='renamed'?'Fotografia Fiesta Premium':'Foto Fiesta'}]})},'loadData');
 await load();
 const spinner=loading||!data;
 results.push({case:'photo-'+kind,service:data?.servicios?.[0],spinner,error,notices:notices.length,passed:kind==='load-fails'?!spinner:data?.servicios?.[0]?.linkEntrega===old.linkEntrega});
}
async function photoSave(edited){
 let data={notasGenerales:'A'};const d=deferred();
 const save=make('foto.tsx',['onSave'],{fiestaId:'f',updateFotografia:()=>d.promise,setFormData:x=>data=x},'onSave',true);
 const pending=save(data);if(edited)data={notasGenerales:'B'};d.resolve({success:true,updatedData:{notasGenerales:'A'}});await pending;
 results.push({case:edited?'photo-save-late':'photo-save-normal',actual:data.notasGenerales,passed:data.notasGenerales===(edited?'B':'A')});
}
async function timeline(kind){
 let items=[{id:'old'}],busy=false;const notices=[],d=deferred();
 const generate=make('itinerario.tsx',['handleGenerateIA'],{setIsGeneratingIA:x=>busy=x,toast:x=>notices.push(x),fiestaInfo:{tipo:'Boda',inicio:'20:00',servicios:[]},generateTimelineAction:()=>d.promise,setPrograma:x=>items=x},'handleGenerateIA');
 const p=generate();if(kind==='edited')items=[...items,{id:'manual-during-request'}];
 d.resolve(kind==='failure'?{success:false,error:'unavailable'}:{success:true,data:[{id:'generated'}]});await p;
 results.push({case:'timeline-'+kind,items,busy,passed:kind==='edited'?items.some(x=>x.id==='manual-during-request'):kind==='failure'?!busy&&items[0].id==='old'&&notices.some(x=>x.title==='Error'):!busy&&items[0].id==='generated'});
}
async function meeting(kind){
 let stored={reuniones:[{id:'existing',fiestaId:'f',titulo:'Original'}]},syncs=0,writes=0;
 const api=make('reuniones.ts',['updateFiestaReuniones','updateReunion','addReunion'],{requireAppSession:async()=>{},getFiestaById:async()=>structuredClone(stored),updateFiestaPartial:async(id,p)=>{writes++;if(kind.includes('save-fails'))return {success:false,error:'unavailable'};stored={...stored,...p};return {success:true};},syncReunionInBackground:()=>{syncs++;}},'({updateReunion,addReunion})');
 const result=kind==='add-save-fails'?await api.addReunion({fiestaId:'f',titulo:'New'}):await api.updateReunion({id:kind==='missing'?'missing':'existing',fiestaId:'f',titulo:'Changed',fecha:'2026-10-10'});
 results.push({case:'meeting-'+kind,result:result.success,writes,syncs,passed:kind==='missing'?!result.success&&syncs===0:kind.includes('save-fails')?!result.success&&syncs===0:result.success&&syncs===1&&stored.reuniones[0].titulo==='Changed'});
}
(async()=>{for(const x of ['unchanged','renamed','load-fails'])await photoLoad(x);await photoSave(false);await photoSave(true);for(const x of ['normal','failure','edited'])await timeline(x);for(const x of ['existing','missing','save-fails','add-save-fails'])await meeting(x);console.log(JSON.stringify(results,null,2));console.log(JSON.stringify({total:results.length,pass:results.filter(x=>x.passed).length,fail:results.filter(x=>!x.passed).length}));process.exitCode=results.every(x=>x.passed)?0:1;})();

