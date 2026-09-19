const fs=require('node:fs'),vm=require('node:vm'),ts=require(process.env.AUDIT_TYPESCRIPT||'typescript');
const s=ts.createSourceFile('actions.ts',fs.readFileSync(process.argv[2],'utf8'),ts.ScriptTarget.Latest,true);
const names=['addActualizacionIncidente','resolverIncidente'];
const source=s.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text)).map(n=>n.getText(s).replace(/^export\s+/,'')).join('\n');
(async()=>{const results=[];for(const concurrent of [false,true]){let stored=[{id:'i',estado:'Abierto',actualizaciones:[]}];const api=vm.runInNewContext(ts.transpileModule(source+'\n({addActualizacionIncidente,resolverIncidente})',{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,{requireAppSession:async()=>{},readData:async()=>structuredClone(stored),writeData:async(f,x)=>{stored=structuredClone(x);},INCIDENTES_FILE:'test'});let responses;
if(concurrent)responses=await Promise.all([api.addActualizacionIncidente('i','Equipo reemplazado','Ana'),api.resolverIncidente('i','Llevar repuesto')]);else responses=[await api.addActualizacionIncidente('i','Equipo reemplazado','Ana'),await api.resolverIncidente('i','Llevar repuesto')];
results.push({case:concurrent?'comment-and-resolve-overlap':'comment-then-resolve',responses,state:stored[0].estado,comments:stored[0].actualizaciones.length,passed:stored[0].estado==='Resuelto'&&stored[0].actualizaciones.length===1});}
console.log(JSON.stringify(results,null,2));process.exitCode=results.every(x=>x.passed)?0:1;})();

