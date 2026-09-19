const fs=require('node:fs'),vm=require('node:vm'),ts=require(process.env.AUDIT_TYPESCRIPT||'typescript');
const s=ts.createSourceFile('actions.ts',fs.readFileSync(process.argv[2],'utf8'),ts.ScriptTarget.Latest,true);
const n=s.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='applyPlaybookToFiesta');
if(!n)throw Error('missing action');
const js=ts.transpileModule(n.getText(s).replace(/^export\s+/,'')+'\napplyPlaybookToFiesta',{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
(async()=>{const results=[];for(const count of [0,2]){const persisted=[];let saved;
const docs=Array.from({length:count},(_,i)=>({nombre:'DOCUMENT_MARKER_'+i,tipo:'Checklist',obligatorio:true}));
const apply=vm.runInNewContext(js,{requireAppSession:async()=>{},verifySession:async()=>({success:true,user:{email:'test@example.invalid'}}),getPlaybookById:async()=>({tareas:[],documentos:docs,compras:[{nombre:'PURCHASE_MARKER'}]}),getFiestaById:async()=>({id:'test',configuracion:{},tareas:[]}),saveFiesta:async x=>{saved=structuredClone(x);persisted.push(x);return {success:true};},getPlaybookAplicaciones:async()=>[],writeData:async(f,x)=>persisted.push(x),APLICACIONES_FILE:'test'});
const result=await apply('pb','test');const serialized=JSON.stringify(persisted);const created=docs.filter(d=>serialized.includes(d.nombre)).length;results.push({case:count?'two-documents-advertised':'no-documents',reported:result.documentosGenerados,documentDefinitionsPersisted:created,purchasePersisted:serialized.includes('PURCHASE_MARKER'),passed:result.documentosGenerados===created});}
console.log(JSON.stringify(results,null,2));process.exitCode=results.every(x=>x.passed)?0:1;})();

