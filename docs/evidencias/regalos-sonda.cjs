const fs=require('node:fs'),vm=require('node:vm'),ts=require(process.env.AUDIT_TYPESCRIPT||'typescript');
const s=ts.createSourceFile('page.tsx',fs.readFileSync(process.argv[2],'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let n;
function visit(x){if(ts.isVariableDeclaration(x)&&x.name.getText(s)==='loadData')n=x;ts.forEachChild(x,visit);}visit(s);
if(!n)throw Error('loadData missing');
const js=ts.transpileModule('const '+n.getText(s)+';\nloadData',{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
(async()=>{const results=[];for(const items of [[{id:'saved',name:'Elegido'}],[]]){let actual;const load=vm.runInNewContext(js,{useCallback:f=>f,fiestaId:'test',setIsLoading(){},setFiesta(){},setGiftList:x=>{actual=x;},getFiestaById:async()=>({invitacionDigital:{regalos:{items}}}),defaultGiftItems:[{name:'Ejemplo'}],toast(){}});await load();results.push({case:items.length?'saved-list':'intentionally-empty',expected:items.length,actual:actual.length,passed:actual.length===items.length});}console.log(JSON.stringify(results,null,2));process.exitCode=results.every(x=>x.passed)?0:1;})();

