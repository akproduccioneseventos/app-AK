const fs=require('node:fs'),vm=require('node:vm'),ts=require(process.env.AUDIT_TYPESCRIPT||'typescript');
const source=ts.createSourceFile('page.tsx',fs.readFileSync(process.argv[2],'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function get(name,scope){let found;function visit(n){if(ts.isVariableDeclaration(n)&&n.name.getText(source)===name)found=n;ts.forEachChild(n,visit);}visit(source);if(!found)throw Error(name);return vm.runInNewContext(ts.transpileModule('const '+found.getText(source)+';\n'+name,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,scope);}
(async()=>{
 const results=[];
 const format=get('formatDate',{Date});
 const date=format('2026-10-10');results.push({case:'calendar-date-Uruguay',actual:date,passed:date==='10 de octubre de 2026'});
 for(const fail of [false,true]){
  const notices=[];let rejectionObserved=false;
  const handler=get('handleShare',{fiesta:{configuracion:{nombreEvento:'Prueba'}},window:{location:{href:'https://example.invalid/internal'}},navigator:{clipboard:{writeText:()=>{const promise=fail?Promise.reject(Error('denied')):Promise.resolve();promise.catch(()=>{rejectionObserved=true;});return promise;}}},toast:x=>notices.push(x)});
  await handler();await Promise.resolve();
  results.push({case:fail?'clipboard-rejected':'clipboard-ok',notices: notices.map(x=>x.title),rejectionObserved,passed:fail?!notices.some(x=>x.title==='Enlace Copiado'):notices.some(x=>x.title==='Enlace Copiado')});
 }
 console.log(JSON.stringify(results,null,2));process.exitCode=results.every(x=>x.passed)?0:1;
})();

