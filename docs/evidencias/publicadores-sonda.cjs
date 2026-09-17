const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ts=require(process.env.AUDIT_TYPESCRIPT||'typescript');
function get(file,name){const s=ts.createSourceFile(file,fs.readFileSync(path.join(process.argv[2],file),'utf8'),ts.ScriptTarget.Latest,true);let code; s.forEachChild(n=>{if(ts.isFunctionDeclaration(n)&&n.name?.text===name)code=n.getText(s).replace(/^export\s+/,'');});if(!code)throw Error(name);return code;}
async function probe(platform,payload,ok=true){
  const requests=[];let written;
  const scope={POSTS_FILE:'posts',CONNECTIONS_FILE:'connections',logger:{info:()=>{},warn:()=>{},error:()=>{}},
    readData:async f=>f==='posts'?[{id:'p',status:'Programado',platform,text:'synthetic',mediaUrl:'https://example.invalid/video.mp4'}]:[{platform,accessToken:'synthetic'}],
    writeData:async(f,data)=>{written=data;},fetch:async(url,init)=>{requests.push({url,body:init.body});return {ok,status:ok?200:400,json:async()=>payload};}};
  const code=get('youtube.ts','publishToYouTube')+'\n'+get('tiktok.ts','publishToTikTok')+'\n'+get('publisher.ts','publishPostInternal')+"\npublishPostInternal('p');";
  const result=await vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,scope);
  return {platform,response:payload,success:result.success,status:written?.[0]?.status,requests:requests.map(x=>x.url),passed:!result.success&&written?.[0]?.status!=='Publicado'};
}
(async()=>{const results=[await probe('YouTube',{error:{message:'missing media'}},false),await probe('YouTube',{}),await probe('TikTok',{error:{code:'ok'},data:{publish_id:'pending-job'}})];console.log(JSON.stringify(results,null,2));process.exitCode=results.every(r=>r.passed)?0:1;})();

