import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{spawn}from'node:child_process';import{gzipSync}from'node:zlib';
export async function runOfficialTitle({qa,dir,env,req,baseURL,source}){
 const config=path.join(qa,'.qa683-playwright.config.cjs'),report=path.join(dir,'683-playwright-resultados.json'),logFile=path.join(dir,'683-playwright.log');
 assert(!fs.existsSync(config));assert(!fs.existsSync(report));
 const body=`const {defineConfig,devices}=require('@playwright/test');module.exports=defineConfig({testDir:${JSON.stringify(path.join(qa,'tests/e2e'))},testMatch:'buzon-titulo-legible.spec.ts',timeout:30000,workers:1,fullyParallel:false,reporter:[['json',{outputFile:${JSON.stringify(report)}}]],use:{baseURL:${JSON.stringify(baseURL)},headless:true,trace:'off',screenshot:'off',launchOptions:{args:['--proxy-server=http://127.0.0.1:9','--proxy-bypass-list=127.0.0.1;localhost','--disable-quic']}},projects:[{name:'pc',use:{viewport:{width:1280,height:900},deviceScaleFactor:1}},{name:'pixel7',use:{...devices['Pixel 7']}}]});`;
 fs.writeFileSync(config,body);const log=fs.createWriteStream(logFile);
 try{
  const child=spawn(process.execPath,[path.join(path.dirname(req.resolve('playwright/package.json')),'cli.js'),'test','--config',config],{cwd:qa,env:{...env,CI:'true'},stdio:['ignore','pipe','pipe']});child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});const exit=await new Promise((ok,no)=>{child.once('exit',ok);child.once('error',no);});await new Promise(ok=>log.end(ok));fs.writeFileSync(logFile+'.gz',gzipSync(fs.readFileSync(logFile)));
  const result=JSON.parse(fs.readFileSync(report,'utf8')),tests=[];const walk=s=>{for(const spec of s.specs||[])for(const test of spec.tests||[])tests.push({name:'official-buzon-'+test.projectName+': '+spec.title,pass:test.results?.at(-1)?.status==='passed',status:test.results?.at(-1)?.status,error:test.results?.at(-1)?.error?.message,source,origin:'tests/e2e/buzon-titulo-legible.spec.ts UNMODIFIED'});for(const suite of s.suites||[])walk(suite);};walk(result);
  if(tests.length!==6||exit!==0)tests.push({name:'official-title-runner',pass:false,exit,total:tests.length,errors:result.errors});
  return{exit,tests,network:'all external browser HTTP(S) redirected to closed local proxy9; QUIC disabled; Node egress guard; isolated JSON fixtures'};
 }finally{if(!log.closed)log.end();if(fs.existsSync(config))fs.unlinkSync(config);}
}
