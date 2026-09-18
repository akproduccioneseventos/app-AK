const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),ts=require(process.env.AUDIT_TYPESCRIPT||'typescript');
const source=ts.createSourceFile('actions.ts',fs.readFileSync(process.argv[2],'utf8'),ts.ScriptTarget.Latest,true);
function get(name,scope){const n=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);if(!n)throw Error(name);return vm.runInNewContext(ts.transpileModule(n.getText(source).replace(/^export\s+/,'')+'\n'+name,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,scope);}
(async()=>{
 const results=[];
 for(const number of [50,51]){
  let uploads=0;
  const save=get('saveLifeStoryVideoPhoto',{path,Buffer,VIDEO_VIDA_STORAGE_PREFIX:'test',uploadToStorage:async()=>{uploads++;return 'https://example.invalid/photo';},getFiestaById:async()=>({videoVida:{photoCount:100,photosUploaded:true}}),console});
  const data={file:{name:'photo.jpg',type:'image/jpeg',arrayBuffer:async()=>new ArrayBuffer(0)},fiestaId:'synthetic',photoNumber:String(number)};
  const result=await save({get:key=>data[key]});
  results.push({case:'configured-100-photo-'+number,result,uploads,passed:result.success});
 }
 for(const fail of [false,true]){
  let removed=false;
  const remove=get('deleteAllVideoVidaPhotos',{require:()=>({requireAppSession:async()=>{}}),admin:{apps:[{}],storage:()=>({bucket:()=>({getFiles:async()=>[[{delete:async()=>{if(fail)throw Error('denied');removed=true;}}]]})})},STORAGE_BUCKET:'test',VIDEO_VIDA_STORAGE_PREFIX:'test'});
  const result=await remove('synthetic');results.push({case:fail?'delete-rejected':'delete-ok',result,removed,passed:fail?!result.success:result.success&&removed});
 }
 console.log(JSON.stringify(results,null,2));process.exitCode=results.every(x=>x.passed)?0:1;
})();

