// Real summary module; explicit provider doubles, no external calls.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process'),crypto=require('node:crypto');
const ts=require(process.env.AK_QA_TYPESCRIPT||'C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules/typescript');
const sha='c0add57f6237f666db97e7e902ef75f6c8d97479',file='src/lib/feedback/resumen-feedback.ts';
const source=cp.execFileSync('git',['show',`${sha}:${file}`],{cwd:path.resolve(__dirname,'../..'),encoding:'utf8'});
const input=[{id:'qa707',fiestaId:'qa-fiesta',fiestaNombre:'QA',clientName:'QA Cliente',enjoyedMost:'',generalComments:'Falta estacionamiento.',toImprove:'Estacionamiento.',timestamp:'2026-10-27T12:00:00.000Z',npsScore:2,ratingComida:2}];
async function run(mode,rows){
  const exports={},calls={model:0,testimonial:0};
  const deps={
    '@/ai/flows/generate-testimonial-flow':{generateTestimonialFlow:async()=>{calls.testimonial++;throw new Error('unexpected testimonial');}},
    '@/lib/ai/consumo-servidor':{hayPresupuestoParaIA:async()=>mode!=='disabled',registrarConsumoIA:async()=>{}},
    '@/ai/genkit':{getGeminiModelForAgent:()=> 'qa-model',generateWithGeminiFallback:async()=>{calls.model++;if(mode==='throws')throw new Error('QA_PROVIDER_DOWN');return {text:JSON.stringify({temasRepetidos:['Estacionamiento'],mejorasPropuestas:['Revisar estacionamiento.']})};}},
  };
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:id=>{if(!(id in deps))throw new Error(`UNMOCKED ${id}`);return deps[id];},console:{warn(){}}},{timeout:3000});
  return {result:await exports.generarResumenFeedbackMensual(rows),calls};
}
(async()=>{
  const noAI=await run('disabled',input),failure=await run('throws',input),empty=await run('enabled',[]),valid=await run('enabled',input);
  const cases=[
    {id:'budget_disabled_no_invented_themes',status:noAI.result.temasRepetidos.length===0?'PASS':'FAIL',observed:noAI},
    {id:'provider_failed_no_invented_themes',status:failure.result.temasRepetidos.length===0?'PASS':'FAIL',observed:failure},
    {id:'empty_no_model_control',status:empty.result===null&&empty.calls.model===0?'PASS':'FAIL',observed:empty},
    {id:'valid_model_control',status:valid.result.temasRepetidos[0]==='Estacionamiento'?'PASS':'FAIL',observed:valid},
    {id:'deterministic_average_control',status:noAI.result.areasNotaBaja.some(a=>a.area==='comida'&&a.promedio===2&&a.cantidad===1)?'PASS':'FAIL'},
  ];
  const report={sha,file,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),method:'Exact summary module with provider/budget doubles; tests absent-analysis fallback, not AI accuracy or rendered UI.',input,cases};
  fs.writeFileSync(path.join(__dirname,'707-feedback-respaldo-resultados.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(cases.map(({id,status})=>({id,status})),null,2));process.exitCode=cases.some(c=>c.status==='FAIL')?1:0;
})();
