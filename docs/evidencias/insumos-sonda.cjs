const fs=require('node:fs'),vm=require('node:vm'),ts=require(process.env.AUDIT_TYPESCRIPT||'typescript');
const source=ts.createSourceFile('insumos.ts',fs.readFileSync(process.argv[2],'utf8'),ts.ScriptTarget.Latest,true);
function get(name,scope){const n=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);if(!n)throw Error(name);return vm.runInNewContext(ts.transpileModule(n.getText(source)+'\n'+name,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,scope);}
(async()=>{
 const results=[];
 for(const fail of [false,true]){
  let written=[],warnings=0;
  const action=get('adjustAllInsumoCostsInterno',{requireAppSession:async()=>{},limpiarCacheInsumos(){},leerInsumosCrudos:async()=>[{id:'a',nombre:'Harina',valorUnitarioEstimado:100}],writeData:async(f,data)=>{written=data;},INSUMOS_FILE:'unused',propagateInsumoChangesToMenus:async()=>({success:!fail,error:fail?'menu unavailable':undefined}),console:{warn(){warnings++;},error(){}}});
  const result=await action(10);
  results.push({case:fail?'menu-save-failed':'all-saved',result,cost:written[0].valorUnitarioEstimado,warnings,passed:fail?!result.success:result.success&&written[0].valorUnitarioEstimado===110});
 }
 const writes=[];
 const propagation=get('propagateInsumoChangesToMenus',{getMenus:async()=>[{id:'linked',items:[{ingredients:[{origenId:'a',costoUnitario:100}]}]},{id:'unrelated',items:[{ingredients:[{origenId:'b',costoUnitario:50}]}]}],saveMenu:async m=>{writes.push(m.id);return {success:true};}});
 await propagation({id:'a',nombre:'Harina',valorUnitarioEstimado:110});
 results.push({case:'only-linked-menu-written',writes,passed:writes.length===1&&writes[0]==='linked'});
 console.log(JSON.stringify(results,null,2));process.exitCode=results.every(x=>x.passed)?0:1;
})();

