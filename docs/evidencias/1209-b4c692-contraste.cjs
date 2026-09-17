const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ts=require(process.env.AUDIT_TYPESCRIPT||'typescript');
const root=process.argv[2];
function code(file,names){const s=ts.createSourceFile(file,fs.readFileSync(path.join(root,file),'utf8'),ts.ScriptTarget.Latest,true);const a=[];s.forEachChild(n=>{if(ts.isFunctionDeclaration(n)&&names.includes(n.name?.text))a.push(n.getText(s).replace(/^export\s+/,''));});return a.join('\n');}
function evaluate(src,scope){return vm.runInNewContext(ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,scope);}
(async()=>{
  const range=code('range.ts',['diaCalendario','inRange']);
  const dates=evaluate(range+`\n[ inRange('2026-09-16T12:00:00-03:00',new Date('2026-09-16T03:00:00Z'),new Date('2026-09-16T03:00:00Z')), inRange('2026-09-17T01:00:00Z',new Date('2026-09-16T03:00:00Z'),new Date('2026-09-16T03:00:00Z')) ];`,{Date});
  const requests=[];let saved;
  const scope={POSTS_FILE:'posts',CONNECTIONS_FILE:'connections',logger:{info:()=>{},warn:()=>{},error:()=>{}},setTimeout:fn=>{fn();return 1;},
    readData:async f=>f==='posts'?[{id:'p',status:'Programado',platform:'TikTok',text:'synthetic',mediaUrl:'https://example.invalid/test.mp4'}]:[{platform:'TikTok',accessToken:'synthetic'}],writeData:async(f,d)=>{saved=d;},
    fetch:async url=>{requests.push(url);return {ok:true,json:async()=>url.includes('/init/')?{error:{code:'ok'},data:{publish_id:'pending'}}:{error:{code:'ok'},data:{status:'PROCESSING_UPLOAD'}}};}};
  const result=await evaluate(code('tiktok.ts',['publishToTikTok'])+'\n'+code('publisher.ts',['publishPostInternal'])+"\npublishPostInternal('p');",scope);
  const checks=[{case:'ultimo-dia-local',actual:dates[0],expected:true,passed:dates[0]===true},{case:'instante-UTC-dentro-dia-Uruguay',actual:dates[1],expected:true,passed:dates[1]===true},{case:'TikTok-procesando-no-publicado',actual:saved?.[0]?.status,expected:'no Publicado',passed:saved?.[0]?.status!=='Publicado',requests:requests.length,success:result.success}];
  console.log(JSON.stringify(checks,null,2));process.exitCode=checks.every(x=>x.passed)?0:1;
})();

