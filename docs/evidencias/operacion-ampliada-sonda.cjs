const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require(process.env.AUDIT_TYPESCRIPT||'typescript');
const root=process.argv[2],results=[];
function make(file,names,scope,expr){
 const s=ts.createSourceFile(file,fs.readFileSync(path.join(root,file),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),parts=[];
 function visit(n){if(ts.isFunctionDeclaration(n)&&names.includes(n.name?.text))parts.push(n.getText(s).replace(/^export\s+/,''));else if(ts.isVariableDeclaration(n)&&names.includes(n.name.getText(s)))parts.push('const '+n.getText(s)+';');ts.forEachChild(n,visit);}visit(s);
 if(parts.length!==names.length)throw Error('Missing/duplicate symbols '+names);
 return vm.runInNewContext(ts.transpileModule(parts.join('\n')+'\n'+expr,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,scope);
}
async function timeline(kind){
 const generate=make('timeline.ts',['generateTimelineAction'],{requireAppSession:async()=>{},generateTimelineFlow:async()=>{if(kind==='throws')throw Error('unavailable');return kind==='empty'?[]:[{hora:kind==='bad-hour'?'29:90':'20:00',titulo:'Entrada',descripcion:'',descripcionCliente:'',icono:'Clock'}];}},'generateTimelineAction');
 const r=await generate('Boda','20:00',8,[]);
 results.push({case:'ai-'+kind,success:r.success,hour:r.data?.[0]?.hora,passed:kind==='normal'?r.success:!r.success});
}
async function emptyTimeline(empty){
 let items=[],writes=0;const load=make('itinerario.tsx',['loadData'],{useCallback:f=>f,fiestaId:'f',toast(){},setIsLoading(){},setError(){},setFiestaInfo(){},setPrograma:x=>items=x,getFiestaById:async()=>({configuracion:{},programa:empty?[]:[{id:'saved'}]}),defaultPrograma:[{titulo:'Suggested',hora:'20:00'}],updateProgramaFiestaActual:async()=>{writes++;return {success:true};}},'loadData');await load();
 results.push({case:empty?'timeline-explicit-empty':'timeline-existing',items:items.length,writes,passed:empty?items.length===0&&writes===0:items.length===1&&writes===0});
}
async function photo(fail){
 let saved=0;const action=make('photo-actions.ts',['updateFiestaData','updateFotografiaYFilmacion'],{getFiestaById:async()=>({id:'f',tareas:[{id:'keep'}]}),saveFiesta:async x=>{saved++;return fail?{success:false,error:'unavailable'}:{success:true,fiesta:x};}},'updateFotografiaYFilmacion');
 const r=await action('f',{servicios:[],notasGenerales:'note'});
 results.push({case:fail?'photo-server-rejects-save':'photo-server-saves',success:r.success,saved,passed:fail?!r.success:r.success&&r.updatedData?.notasGenerales==='note'});
}
async function recorder(kind){
 let tracksStopped=0,live=false,started=false,notices=0;
 const stream={getTracks:()=>[{stop(){tracksStopped++;live=false;}}]};
 class Recorder{static isTypeSupported(){return true;}constructor(){if(kind==='constructor-fails')throw Error('codec unavailable');}start(){started=true;}}
 const ref=()=>({current:null});
 const start=make('recorder.tsx',['startRecording'],{isRecording:false,navigator:{mediaDevices:{getUserMedia:async()=>{if(kind==='permission-denied')throw Error('denied');live=true;return stream;}}},MediaRecorder:Recorder,toast:()=>notices++,setWarnings(){},setAudioBlob(){},audioPreviewUrl:null,setAudioPreviewUrl(){},chunksRef:{current:[]},streamRef:ref(),recorderRef:ref(),startedAtRef:ref(),timerRef:ref(),setInterval:()=>123,setElapsedSeconds(){},setIsRecording(){},startSpeechRecognition(){},URL,Blob},'startRecording');await start();
 results.push({case:'recorder-'+kind,live,started,tracksStopped,notices,passed:kind==='normal'?started:!live&&notices>0});
}
async function intelligence(kind){
 const helpers=['cleanText','normalizeKey','safeId','buildEventContext','normalizeAnalysis','completeChecklist','buildDetectedTasks','mergeTasks','buildLearningFaqs','mergeFaqs','processReunionIntelligence'];
 let saved,syncs=0;
 const action=make('meeting.ts',helpers,{requireAppSession:async()=>{},File:undefined,getFiestaById:async()=>({id:'f',configuracion:{},reuniones:[{id:'r',titulo:'Meeting',notas:'',checklist:[]}],tareas:[],faqPortal:[],clientPortalSettings:{faq:{visible:false}}}),uploadAudioIfPresent:async()=>({}),analyzeMeetingTranscript:async()=>({resumenCliente:'Summary',resumenOrganizador:'Summary',acuerdos:[],decisionesCliente:[],tareasCliente:['Confirmar horario'],tareasOrganizador:[kind==='same-task'?'Confirmar horario':'Revisar proveedor'],preguntasCliente:[],checklistCompletadoIds:[],camposSincronizados:[],alertas:[]}),saveFiesta:async x=>{saved=x;return kind==='save-fails'?{success:false,error:'unavailable'}:{success:true};},syncReunionToGoogleWorkspace:async()=>{syncs++;return {success:true};},console},'processReunionIntelligence');
 const values={fiestaId:'f',reunionId:'r',transcript:'Reunion de prueba sin audio',durationSeconds:'0'};
 const r=await action({get:k=>values[k]});const count=saved?.tareas?.length;
 results.push({case:'intelligence-'+kind,success:r.success,tasks:count,faqVisible:saved?.clientPortalSettings?.faq?.visible,syncs,passed:kind==='save-fails'?!r.success&&syncs===0:kind==='hidden-faq'?saved.clientPortalSettings.faq.visible===false:count===2});
}
(async()=>{
 for(const k of ['normal','empty','throws','bad-hour'])await timeline(k);
 await emptyTimeline(false);await emptyTimeline(true);
 await photo(false);await photo(true);
 for(const k of ['normal','permission-denied','constructor-fails'])await recorder(k);
 for(const k of ['distinct-tasks','same-task','hidden-faq','save-fails'])await intelligence(k);
 console.log(JSON.stringify(results,null,2));console.log(JSON.stringify({total:results.length,pass:results.filter(x=>x.passed).length,fail:results.filter(x=>!x.passed).length}));process.exitCode=results.every(x=>x.passed)?0:1;
})();

