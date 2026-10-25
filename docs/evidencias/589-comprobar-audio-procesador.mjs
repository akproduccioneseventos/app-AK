import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),target=path.join(dir,'589-audio-procesador.json');assert(!fs.existsSync(target));
const current='f8f7cf34e8778de784b20e2654058fd722b2a2ec',previous='978af7d65a60bd287f3ee3cc05037a29566074f4';
const record={current,previous,started:new Date().toISOString(),phase:'waiting-573',appEdited:false,realServices:false,cases:[]};const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
const req=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json'),ts=req('typescript'),{chromium}=req('playwright');
const ffmpeg='C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-tools/codex-media/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe';
const git=args=>{const r=spawnSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});assert.equal(r.status,0,r.stderr);return r.stdout;};
const mapping=(file,stream)=>{const r=spawnSync(ffmpeg,['-hide_banner','-v','error','-i',file,'-map','0:'+stream+':0','-f','null','-'],{encoding:'utf8',timeout:30000,maxBuffer:1024*1024});return{exit:r.status,signal:r.signal,error:r.stderr.slice(0,1200)};};
let browser;
try{
 const end=Date.now()+210*60000;while(true){let ready=false;try{ready=!!JSON.parse(fs.readFileSync(path.join(dir,'573-continuidad.json'),'utf8')).finished;}catch(e){if(e.code!=='ENOENT')throw e;}if(ready&&os.freemem()>=1024**3)break;if(Date.now()>end)throw Error('Prior QA still active or insufficient memory');await new Promise(ok=>setTimeout(ok,15000));}
 const fixture=path.join(dir,'469-video-ficticio.mp4'),input=fs.readFileSync(fixture);record.input={file:path.basename(fixture),bytes:input.length,sha256:crypto.createHash('sha256').update(input).digest('hex'),video:mapping(fixture,'v'),audio:mapping(fixture,'a')};assert.equal(record.input.video.exit,0);assert.equal(record.input.audio.exit,0);
 record.scope='Exact real TypeScript processor/canvas/templates transpiled with type erasure in Chromium; valid H264/AAC synthetic input, real canvas/MediaRecorder, no mocked recorder or real camera. Not Next/UI/Storage/hardware acceptance.';record.phase='running';save();
 browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 for(const [label,sha]of [['before',previous],['after',current]]){
  const modules={},hashes={};for(const name of ['video-frame-processor','video-frame-canvas','video-frame-templates']){const file='src/lib/buzon/'+name+'.ts',text=git(['show',sha+':'+file]);hashes[file]=crypto.createHash('sha256').update(text).digest('hex');modules['./'+name]=ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;}
  const context=await browser.newContext({viewport:{width:800,height:600}});await context.route('**/*',r=>r.abort('blockedbyclient'));const page=await context.newPage();const row={label,source:sha,sourceHashes:hashes};
  try{
   const result=await page.evaluate(async({modules,input})=>{
    const cache={};const load=id=>{if(cache[id])return cache[id].exports;if(!Object.prototype.hasOwnProperty.call(modules,id))throw Error('Unexpected source dependency '+id);const module={exports:{}};cache[id]=module;new Function('require','module','exports',modules[id])(load,module,module.exports);return module.exports;};
    const binary=atob(input),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));const file=new File([bytes],'qa-h264-aac.mp4',{type:'video/mp4'});const progress=[];
    const done=await Promise.race([load('./video-frame-processor').renderUploadedVideoWithFrame({file,template:'elegante',displayText:'QA AUDIO FICTICIO',onProgress:v=>progress.push(v)}),new Promise((_,no)=>setTimeout(()=>no(Error('Processor exceeded45s')),45000))]);
    const output=new Uint8Array(await done.file.arrayBuffer());if(output.length>8*1024*1024)throw Error('Unexpected QA output size');let text='';for(let i=0;i<output.length;i+=8192)text+=String.fromCharCode(...output.subarray(i,i+8192));URL.revokeObjectURL(done.url);return{name:done.file.name,type:done.file.type,size:output.length,duration:done.durationSeconds,progress,base64:btoa(text)};
   },{modules,input:input.toString('base64')});
   const output=path.join(dir,'589-'+label+'-result.'+(result.type.includes('mp4')?'mp4':'webm'));assert(!fs.existsSync(output));const bytes=Buffer.from(result.base64,'base64');fs.writeFileSync(output,bytes);delete result.base64;
   row.output={...result,file:path.basename(output),sha256:crypto.createHash('sha256').update(bytes).digest('hex'),video:mapping(output,'v'),audio:mapping(output,'a')};
   row.verdict=row.output.video.exit!==0?'OUTPUT_VIDEO_NOT_DECODABLE':row.output.audio.exit===0?'OUTPUT_HAS_AUDIO':'OUTPUT_HAS_NO_DECODABLE_AUDIO';
  }catch(e){row.verdict='PROCESSOR_OR_QA_ERROR';row.error=String(e.stack||e);}
  finally{await context.close();record.cases.push(row);save();}
 }
 record.phase='finished';
}catch(e){record.phase='qa-setup-or-run-error';record.error=String(e.stack||e);process.exitCode=2;}
finally{if(browser){await browser.close();record.browserClosed=true;}record.finished=new Date().toISOString();save();console.log(JSON.stringify({...record,cases:record.cases.map(r=>({label:r.label,source:r.source,verdict:r.verdict,error:r.error,output:r.output}))}));}
