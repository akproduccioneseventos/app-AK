// Executes the exact TSX handler initializer, extracted via TypeScript AST.
// State/window/action boundaries are controlled; this is not a browser rendering test.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process'),crypto=require('node:crypto');
const ts=require(process.env.AK_QA_TYPESCRIPT||'C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules/typescript');
const sha='b58abab75d94a732daf79b32aff54ec253ccf63c';
const file='src/app/(app)/centro-de-control/page.tsx';
const text=cp.execFileSync('git',['show',`${sha}:${file}`],{cwd:path.resolve(__dirname,'../..'),encoding:'utf8'});
const ast=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let initializer;
function visit(n){if(ts.isVariableDeclaration(n)&&n.name.getText(ast)==='handleAprobar')initializer=n.initializer;ts.forEachChild(n,visit);}
visit(ast);if(!initializer)throw new Error('handler missing');
const body=initializer.getText(ast);
const line=ast.getLineAndCharacterOfPosition(initializer.pos).line+1;
async function run(kind){
  const item={id:'qa-message',origen:'mensaje',tipoTarea:'mandar_mensajes_clientes',texto:'OLD',enlaceWhatsapp:'https://api.whatsapp.com/send?phone=59800000000&text=OLD'};
  let items=[item];const opened=[],calls=[];const exports={};
  vm.runInNewContext(ts.transpileModule(`export const handle=${body}`,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
    exports,window:{open:(...args)=>opened.push(args)},setProcesandoId(){},setEditandoId(){},
    setItemsOK:fn=>{items=fn(items);},console:{error(){}},
    aprobarItemOK:async(...args)=>{calls.push(args);if(kind==='throw')throw new Error('QA_OFFLINE');return {success:kind!=='reject',error:kind==='reject'?'QA_REJECTED':undefined};},
  },{filename:`${sha}/${file}:handleAprobar`,timeout:3000});
  await exports.handle(item,'CORRECTED');
  const pass=kind==='edit'?new URL(opened[0][0]).searchParams.get('text')==='CORRECTED':items.some(x=>x.id===item.id);
  return {id:kind,status:pass?'PASS':'FAIL',opened,calls,remaining:items.map(x=>x.id)};
}
(async()=>{
  const results=[];for(const kind of ['edit','reject','throw'])results.push(await run(kind));
  const report={sha,file,line,sourceSha256:crypto.createHash('sha256').update(text).digest('hex'),method:'Exact TS AST initializer only; no rendered browser, no network, no real window.open.',results};
  fs.writeFileSync(path.join(__dirname,'699-consumidor-centro-resultados.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));process.exitCode=results.some(r=>r.status==='FAIL')?1:0;
})();
