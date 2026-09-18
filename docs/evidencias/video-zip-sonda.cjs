const fs=require('node:fs'),vm=require('node:vm'),ts=require(process.env.AUDIT_TYPESCRIPT||'typescript');
const s=ts.createSourceFile('route.ts',fs.readFileSync(process.argv[2],'utf8'),ts.ScriptTarget.Latest,true);
const parts=s.statements.filter(n=>ts.isFunctionDeclaration(n)&&['GET','isUrlAllowed'].includes(n.name?.text)).map(n=>n.getText(s).replace(/^export\s+/,''));
const js=ts.transpileModule(parts.join('\n')+'\nGET',{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
(async()=>{
 const results=[];
 for(const oks of [[true,true],[true,false],[false,false]]){
  const files=[];let i=0;
  class Zip{file(name){files.push(name);}async generateAsync(){return Buffer.from('mock-zip');}}
  class Response{constructor(body,options){this.body=body;Object.assign(this,options);}static json(body,options){return new Response(body,options);}}
  const get=vm.runInNewContext(js,{NextResponse:Response,JSZip:Zip,Headers,URL,Buffer,process:{env:{NODE_ENV:'production'}},MAX_TOTAL_SIZE:50*1024*1024,ALLOWED_DOMAINS:['storage.googleapis.com'],hasAppSession:async()=>true,getLifeStoryVideoPhotos:async()=>['https://storage.googleapis.com/b/a.jpg','https://storage.googleapis.com/b/b.jpg'],fetch:async()=>({ok:oks[i++],arrayBuffer:async()=>new ArrayBuffer(2)}),console});
  const result=await get({}, {params:Promise.resolve({fiestaId:'synthetic'})});
  const complete=oks.every(Boolean);
  results.push({case:complete?'complete':oks.some(Boolean)?'one-http-failure':'all-http-failures',status:result.status,files,passed:complete?result.status===200&&files.length===2:result.status!==200||files.some(x=>/incomplet|manifest/i.test(x))});
 }
 console.log(JSON.stringify(results,null,2));process.exitCode=results.every(x=>x.passed)?0:1;
})();

