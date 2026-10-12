import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const repo=process.cwd(),cwd=path.join(os.tmpdir(),'ak-codex88','ak-entorno-aislado-101');
if(!process.argv.includes('--child')){
  const keys=['PATH','HOME','TEMP','TMP','SYSTEMROOT','USERPROFILE','WINDIR','APPDATA','LOCALAPPDATA','PROGRAMDATA','COMSPEC','PATHEXT'];
  const env=Object.fromEntries(keys.filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
  Object.assign(env,{NODE_ENV:'development',NEXT_TELEMETRY_DISABLED:'1',AK_ENTORNO_AISLADO:'true',GOOGLE_API_KEY:'dummy',GEMINI_API_KEY:'dummy',NODE_OPTIONS:'--max-old-space-size=1024'});
  execFileSync(process.execPath,[path.join(repo,'docs/evidencias/101-sonda-empaquetado.mjs'),'--child'],{cwd:repo,env,stdio:'inherit'});
}else{
  const sha='99faf4eb061fa46341cfdde6f81b93b3bfb9c73c';
  if(execFileSync('git',['-C',cwd,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==sha||process.env.AK_ENTORNO_AISLADO!=='true')throw new Error('Source mismatch');
  const require=createRequire(path.join(cwd,'package.json')),webpack=require('webpack'),next=require(path.join(cwd,'next.config.js'));
  const entry=path.join(cwd,'qa101-nodesdk.cjs'),out=path.join(cwd,'qa101-webpack');
  fs.copyFileSync(path.join(repo,'docs/evidencias/101-nodesdk-entry.cjs'),entry);
  const native=require(entry),result={sha,webpack:webpack.version,native,variants:[]};
  for(const control of [false,true]){
    let cfg={mode:'development',target:'node',context:cwd,entry,output:{path:out,filename:control?'control.cjs':'actual.cjs',library:{type:'commonjs2'}},
      resolve:{alias:{}},plugins:[],externals:[({request},done)=>{
        if(request==='@opentelemetry/sdk-node'||request?.startsWith('.')||path.isAbsolute(request||''))done();else done(null,'commonjs '+request);
      }]};
    cfg=await next.webpack(cfg,{webpack,isServer:true,dev:true,buildId:'qa101',config:next,dir:cwd});
    const original=cfg.resolve.alias['@opentelemetry/sdk-node'];
    if(control)delete cfg.resolve.alias['@opentelemetry/sdk-node'];
    const stats=await new Promise((resolve,reject)=>{const compiler=webpack(cfg);compiler.run((err,stats)=>compiler.close(closeErr=>err||closeErr?reject(err||closeErr):resolve(stats)));});
    if(stats.hasErrors())throw new Error(stats.toString({all:false,errors:true}));
    const observed=require(path.join(out,control?'control.cjs':'actual.cjs'));
    result.variants.push({control,actualAlias:original,observed});
  }
  fs.writeFileSync(path.join(repo,'docs/evidencias/101-empaquetado.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
  if(!result.variants[0].observed.constructed||!result.variants[1].observed.constructed)throw new Error('SDK construction still fails');
}
