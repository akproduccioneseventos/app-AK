const fs=require('node:fs'),vm=require('node:vm'),ts=require(process.env.AUDIT_TYPESCRIPT||'typescript');
const s=ts.createSourceFile('actions.ts',fs.readFileSync(process.argv[2],'utf8'),ts.ScriptTarget.Latest,true);
const n=s.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='applyPlaybookToFiesta');if(!n)throw Error('missing action');
const js=ts.transpileModule(n.getText(s).replace(/^export\s+/,'')+'\napplyPlaybookToFiesta',{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
(async()=>{const results=[];for(const failFirst of [false,true]){let stored={configuracion:{fechaEvento:'2026-10-10'},tareas:[]};let logCalls=0;const apply=vm.runInNewContext(js,{requireAppSession:async()=>{},verifySession:async()=>({success:true,user:{email:'test@example.invalid'}}),getPlaybookById:async()=>({tareas:[{titulo:'Confirmar armado',diasAntesEvento:-1}],documentos:[]}),getFiestaById:async()=>structuredClone(stored),saveFiesta:async x=>{stored=structuredClone(x);return {success:true};},getPlaybookAplicaciones:async()=>[],writeData:async()=>{if(failFirst&&logCalls++===0)throw Error('log unavailable');},APLICACIONES_FILE:'test'});
const first=await apply('pb','party');const afterFirst=stored.tareas.length;let retry;if(failFirst)retry=await apply('pb','party');results.push({case:failFirst?'log-failure-and-retry':'normal',first,afterFirst,retry,finalTasks:stored.tareas.length,passed:failFirst?stored.tareas.length===1:first.success&&stored.tareas.length===1});}
console.log(JSON.stringify(results,null,2));process.exitCode=results.every(x=>x.passed)?0:1;})();

