// Exact UI callback and server action, isolated before the 2000ms autosave boundary.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process'),crypto=require('node:crypto');
const ts=(()=>{try{return require('typescript');}catch{return require(process.env.AK_QA_TYPESCRIPT||'C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules/typescript');}})();

const repo=path.resolve(__dirname,'../..'),clone=x=>structuredClone(x);
const targetSha=process.argv[2]||process.env.AK_QA_SHA;
const currentCommit=(()=>{try{return cp.execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();}catch{return 'c0add57f6237f666db97e7e902ef75f6c8d97479';}})();
const sha=targetSha||currentCommit,sources={};

function source(file){
  if(sources[file])return sources[file];
  if(!targetSha&&fs.existsSync(path.join(repo,file))){
    return (sources[file]=fs.readFileSync(path.join(repo,file),'utf8'));
  }
  return (sources[file]=cp.execFileSync('git',['show',`${sha}:${file}`],{cwd:repo,encoding:'utf8'}));
}
function evaluate(text,deps,extra={}){
  const exports={};
  vm.runInNewContext(ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{
    exports,require(id){if(!(id in deps))throw new Error(`UNMOCKED ${id}`);return deps[id];},console:{warn(){},error(){}},...extra,
  },{timeout:3000});return exports;
}
const page='src/app/(app)/fiestas/nueva/pagina-web/page.tsx';
const ast=ts.createSourceFile(page,source(page),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;
function find(n){if(ts.isVariableDeclaration(n)&&n.name.getText(ast)==='handleCrearTresPropuestas')callback=n.initializer.arguments[0];ts.forEachChild(n,find);}
find(ast);if(!callback)throw new Error('missing callback');
const defaults=evaluate(source('src/lib/invitacion-digital-defaults.ts'),{});
const initial={nombreHomenajeada:'QA nombre anterior',fechaEvento:'2027-01-10',nombreSalon:'QA salon anterior',colorPrincipal:'#112233'};
async function scenario(values){
  let stored={id:'qa704',invitacionConfig:clone(initial)},local=clone(initial),fiesta=clone(stored),input=null;
  const trace=[],toasts=[];
  const actions=evaluate(source('src/app/actions/fiesta/armar-web-con-ia.actions.ts'),{
    '@/app/actions/fiesta/fiesta.actions':{
      requireFiestaWriteAccess:async()=>{trace.push('permission');},
      getFiestaById:async()=>{trace.push('read_stored_event');return clone(stored);},
      saveFiesta:async value=>{trace.push('save_generated_proposals');stored=clone(value);return {success:true};},
    },
    '@/ai/flows/armar-web-del-evento-flow':{generarTresPropuestasFlow:async value=>{trace.push('generator_input');input=clone(value);return [{id:'qa-one'},{id:'qa-two'},{id:'qa-three'}];}},
    '@/lib/invitacion-digital-defaults':defaults,'@/lib/security/portal-session':{},'@/lib/notifications/create-notification':{},
  });
  const ui=evaluate(`export const run=${callback.getText(ast)};`,{}, {
    fiestaId:'qa704',propuestasNombre:values.nombreHomenajeada,propuestasFecha:values.fechaEvento,
    propuestasSalon:values.nombreSalon,propuestasColor:values.colorPrincipal,
    setIsCreandoTresPropuestas(){},setTresPropuestasDialogOpen(){},
    setInvitacionConfig:fn=>{trace.push('local_state_only');local=fn(local);},
    crearTresPropuestasDeWeb:actions.crearTresPropuestasDeWeb,
    setFiesta:fn=>{fiesta=fn(fiesta);},toast:value=>toasts.push(clone(value)),
  });
  await ui.run();
  return {local,generatorInput:input,stored,trace,toasts};
}
(async()=>{
  const changed={nombreHomenajeada:'QA nombre nuevo',fechaEvento:'2028-09-20',nombreSalon:'QA salon nuevo',colorPrincipal:'#445566'};
  const actual=await scenario(changed),control=await scenario(initial);
  const cases=['nombreHomenajeada','fechaEvento','nombreSalon'].map(field=>({id:field,status:actual.generatorInput.fiesta.invitacionConfig[field]===changed[field]?'PASS':'FAIL',expected:changed[field],observed:actual.generatorInput.fiesta.invitacionConfig[field]}));
  cases.push({id:'color',status:actual.generatorInput.colorBase===changed.colorPrincipal?'PASS':'FAIL'});
  cases.push({id:'unchanged_control',status:Object.keys(initial).every(k=>control.generatorInput.fiesta.invitacionConfig[k]===initial[k])?'PASS':'FAIL'});
  const report={sha,method:'Exact callback AST and complete action; in-memory event store and controlled generator. No model, browser rendering, full autosave hook, SDK, HTTP or real data. Executes the immediate callback before its separate 2000ms autosave.',callbackLine:ast.getLineAndCharacterOfPosition(callback.pos).line+1,sources:Object.fromEntries(Object.entries(sources).map(([k,v])=>[k,crypto.createHash('sha256').update(v).digest('hex')])),actual,control,cases};
  fs.writeFileSync(path.join(__dirname,'704-propuestas-datos-resultados.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({sha,cases,trace:actual.trace},null,2));process.exitCode=cases.some(c=>c.status==='FAIL')?1:0;
})();

