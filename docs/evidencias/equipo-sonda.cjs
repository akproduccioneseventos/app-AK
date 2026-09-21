const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require(process.env.AUDIT_TYPESCRIPT||'typescript');
const root=process.argv[2],results=[];
function make(file,names,scope,expr){const s=ts.createSourceFile(file,fs.readFileSync(path.join(root,file),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),parts=[];function visit(n){if(ts.isFunctionDeclaration(n)&&names.includes(n.name?.text))parts.push(n.getText(s).replace(/^export\s+/,''));else if(ts.isVariableDeclaration(n)&&names.includes(n.name.getText(s)))parts.push('const '+n.getText(s)+';');ts.forEachChild(n,visit);}visit(s);if(parts.length!==names.length)throw Error('Symbols '+names);return vm.runInNewContext(ts.transpileModule(parts.join('\n')+'\n'+expr,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,scope);}
for(const [name,states,expected] of [['paid',['pagado','firmado_subido'],200],['pending',['pendiente'],0],['mixed',['pagado','pendiente'],100]]){
const rows=states.map((s,i)=>({fiestaId:String(i),montoBase:100}));const editable=Object.fromEntries(states.map((s,i)=>[String(i),{estado:s,monto:100}]));const total=make('historial.tsx',['totalCobrado'],{useMemo:f=>f(),filteredRows:rows,editableByFiesta:editable},'totalCobrado');results.push({case:'receipts-'+name,total,expected,passed:total===expected});}
async function provider(kind){
 let db={id:'p',token:'t',activo:kind!=='inactive',estadoActual:'Pendiente',tareas:[{id:'a',completada:false},{id:'b',completada:false}],notas:''},writes=0;
 const api=make('provider.ts',['persistProvider','getProveedorByToken','toggleTareaProveedor','confirmarLlegada','addNotaProveedor'],{DATA_PATH:'test',DATA_COLLECTION:'test',readData:async()=>[structuredClone(db)],updateDataItem:async(_p,_c,_id,data)=>{if(kind==='write-failure')throw Error('offline');writes++;db={...db,...structuredClone(data)};return db;}},'({toggleTareaProveedor,confirmarLlegada,addNotaProveedor})');
 let out;
 if(kind==='concurrent-tasks')out=await Promise.all([api.toggleTareaProveedor('t','a'),api.toggleTareaProveedor('t','b')]);
 else if(kind==='arrival-note')out=await Promise.all([api.confirmarLlegada('t'),api.addNotaProveedor('t','Llegamos')]);
 else if(kind==='sequential'){out=[await api.toggleTareaProveedor('t','a'),await api.toggleTareaProveedor('t','b')];}
 else out=[await api.toggleTareaProveedor('t',kind==='missing-task'?'missing':'a')];
 const done=db.tareas.filter(x=>x.completada).length;
 const rejected=['inactive','missing-task','write-failure'].includes(kind);
 const passed=rejected?out.every(x=>!x.success)&&writes===0:kind==='arrival-note'?db.estadoActual==='Llegó'&&db.notas==='Llegamos':out.every(x=>x.success)&&done===(['sequential','concurrent-tasks'].includes(kind)?2:1);
 results.push({case:'provider-'+kind,success:out.map(x=>x.success),done,state:db.estadoActual,note:db.notas,writes,passed});
}
(async()=>{for(const k of ['normal','inactive','missing-task','write-failure','sequential','concurrent-tasks','arrival-note'])await provider(k);console.log(JSON.stringify({total:results.length,pass:results.filter(x=>x.passed).length,fail:results.filter(x=>!x.passed).length,results},null,2));})().catch(e=>{console.error(e);process.exit(1)});

