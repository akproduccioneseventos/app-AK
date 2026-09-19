const fs=require('node:fs'),vm=require('node:vm'),ts=require(process.env.AUDIT_TYPESCRIPT||'typescript');
const s=ts.createSourceFile('actions.ts',fs.readFileSync(process.argv[2],'utf8'),ts.ScriptTarget.Latest,true);
const code=s.statements.filter(n=>ts.isFunctionDeclaration(n)&&['updateFiestaData','claimGift'].includes(n.name?.text)).map(n=>n.getText(s).replace(/^export\s+/,'')).join('\n');
(async()=>{const results=[];for(const state of ['available','claimed','missing']){let stored={invitacionDigital:{regalos:{items:state==='missing'?[]:[{id:'gift',isClaimed:state==='claimed',claimedBy:state==='claimed'?'Ana':undefined}]}}};let writes=0;
const claim=vm.runInNewContext(ts.transpileModule(code+'\nclaimGift',{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,{getFiestaById:async()=>structuredClone(stored),saveFiesta:async x=>{writes++;stored=structuredClone(x);return {success:true};}});
const result=await claim('synthetic','gift','Beto');results.push({case:state,result,writes,owner:stored.invitacionDigital.regalos.items[0]?.claimedBy,passed:state==='available'?result.success&&stored.invitacionDigital.regalos.items[0].claimedBy==='Beto':!result.success});
}console.log(JSON.stringify(results,null,2));process.exitCode=results.every(x=>x.passed)?0:1;})();

