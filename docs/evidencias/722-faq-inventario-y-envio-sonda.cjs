const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),vm=require('node:vm'),crypto=require('node:crypto');
const ts=require(process.env.AK_QA_TYPESCRIPT||'C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules/typescript');
const sha='c0add57f6237f666db97e7e902ef75f6c8d97479',repo=path.resolve(__dirname,'../..'),sources={};
function source(file){return sources[file] ||= cp.execFileSync('git',['show',`${sha}:${file}`],{cwd:repo,encoding:'utf8'});}
function init(file,name){const a=ts.createSourceFile(file,source(file),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let value;function walk(n){if(ts.isVariableDeclaration(n)&&n.name.getText(a)===name)value=n.initializer.getText(a);ts.forEachChild(n,walk);}walk(a);if(!value)throw new Error('Missing '+name);return value;}
function evaluate(code,scope={}){const exports={};vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,...scope},{timeout:3000});return exports;}
const landing=evaluate('export const data='+init('src/types/landing-editor.ts','defaultLandingSettings')+';').data;
const fallback=evaluate('export const data='+init('src/components/landing/FAQSection.tsx','DEFAULT_FAQS')+';').data;
const page='src/app/portal-cliente/[id]/faq/page.tsx';
const portal=evaluate('export const data='+init(page,'CLIENT_PRELOADED_FAQS')+';').data;
const contract=evaluate(source('src/data/preguntas-frecuentes-contrato.ts')).PREGUNTAS_FRECUENTES_DEL_CONTRATO;
const contractText=source('src/lib/contract-template.ts');
async function scenario(mode){
  let questions=[],text='QA pregunta',ended=0;const toasts=[];
  const ui=evaluate('export const run='+init(page,'handleAskQuestion')+';',{
    require(id){if(id!=='@/app/actions/social-gallery')throw new Error('UNMOCKED '+id);return {addChatMessage:async()=>{if(mode==='throw')throw Error('QA red');return mode==='reject'?{success:false,error:'QA rechazo controlado'}:{success:true};}};},
    newQuestion:text,params:{id:'qa722'},obtenerIntento:async()=> 'qa722-intento',terminarIntento(){ended++;},
    setIsSubmitting(){},setUserQuestions:fn=>{questions=fn(questions);},setNewQuestion:v=>{text=v;},toast:v=>toasts.push(v),
  });
  await ui.run({preventDefault(){}});return {questions,text,ended,toasts};
}
(async()=>{
  const reject=await scenario('reject'),success=await scenario('success'),thrown=await scenario('throw');
  const payment=portal.find(q=>q.id==='c_faq_5');
  const canonical=contract.find(q=>q.pregunta==='¿Cómo pago?');
  const cases=[
    {id:'failed_send_not_reported_sent',status:!reject.questions.length&&!reject.toasts.some(t=>String(t.title).includes('Consulta enviada'))?'PASS':'FAIL'},
    {id:'failed_send_visible',status:reject.toasts.some(t=>t.variant==='destructive'&&String(t.description).includes('QA rechazo controlado'))?'PASS':'FAIL'},
    {id:'success_control',status:success.questions.length===1&&success.ended===1?'PASS':'FAIL'},
    {id:'thrown_control',status:!thrown.questions.length&&thrown.toasts.some(t=>t.variant==='destructive')?'PASS':'FAIL'},
    {id:'payment_copy_consistent',status:!payment.answer.includes('5 días hábiles')?'PASS':'FAIL',portal:payment.answer,canonical:canonical.respuesta,contractClausePresent:contractText.includes('treinta (30) días antes del evento')},
  ];
  const report={sha,scope:'Default source inventory, not production landing-settings. Actual callback AST with local action/state doubles. Copy comparison, not legal validity or account audit.',counts:{landingBase:landing.faqs.length,componentFallback:fallback.length,portalDedicated:portal.length,contractShared:contract.length},cases,reject,success,thrown,sources:Object.fromEntries(Object.entries(sources).map(([f,s])=>[f,crypto.createHash('sha256').update(s).digest('hex')]))};
  fs.writeFileSync(path.join(__dirname,'722-faq-inventario-y-envio-resultados.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({sha,counts:report.counts,cases},null,2));process.exitCode=cases.some(c=>c.status==='FAIL')?1:0;
})();
