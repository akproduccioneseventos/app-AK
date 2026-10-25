import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),target=path.join(dir,'468-codecs-resultados.json');assert(!fs.existsSync(target));
assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'456-emuladores.json'),'utf8')).phase,'finished');
assert(os.freemem()>=1024**3,'No new browser under1GiB');
const build=JSON.parse(fs.readFileSync(path.join(dir,'427-entorno.json'),'utf8'));
const {chromium}=createRequire(path.join(build.qa,'package.json'))('playwright');
const record={started:new Date().toISOString(),source:build.source,scope:'Independent browser/canvas/MediaRecorder platform control. No app page, real camera, SDK or provider; same software rendering arguments as208.',freeBytes:os.freemem(),results:[]};
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1','--use-angle=swiftshader','--enable-unsafe-swiftshader']});record.browserVersion=browser.version();record.executable=chromium.executablePath();
 const page=await browser.newPage();await page.route('**/*',r=>r.abort());
 for(const audio of[false,true])for(const animated of[true])for(const mime of['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus']){
  const result=await page.evaluate(async({animated,mime,audio})=>{
   const supported=MediaRecorder.isTypeSupported(mime);if(!supported)return{mime,animated,audio,supported};
   const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const c=canvas.getContext('2d');c.fillStyle='#1e3a5f';c.fillRect(0,0,640,480);
   const stream=canvas.captureStream(20),chunks=[],errors=[];let recorder,pump,frames=0;let audioContext,oscillator;if(audio){audioContext=new AudioContext();const dest=audioContext.createMediaStreamDestination();oscillator=audioContext.createOscillator();oscillator.connect(dest);oscillator.start();for(const t of dest.stream.getAudioTracks())stream.addTrack(t);}
   try{
    recorder=new MediaRecorder(stream,{mimeType:mime});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onerror=e=>errors.push(String(e.error||e));
    const done=new Promise(resolve=>recorder.onstop=()=>resolve(true));recorder.start(100);
    if(animated)pump=setInterval(()=>{c.fillStyle=frames++%2?'#315b82':'#1e3a5f';c.fillRect(0,0,640,480);c.fillStyle='#fff';c.fillRect((frames*8)%640,80,40,40);},50);
    await new Promise(resolve=>setTimeout(resolve,1500));recorder.stop();await Promise.race([done,new Promise(resolve=>setTimeout(()=>resolve(false),5000))]);
    return{mime,animated,audio,supported,actualMime:recorder.mimeType,frames,chunks:chunks.length,bytes:new Blob(chunks,{type:recorder.mimeType}).size,errors};
   }catch(e){return{mime,animated,audio,supported,error:String(e),errors};}
   finally{clearInterval(pump);for(const t of stream.getTracks())t.stop();if(oscillator)oscillator.stop();if(audioContext)await audioContext.close();}
  },{animated,mime,audio});record.results.push(result);fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');
 }
 record.phase='finished';
}catch(error){record.phase='qa-control-error';record.error=String(error.stack||error);process.exitCode=1;}
finally{if(browser)await browser.close();record.browserClosed=true;record.finished=new Date().toISOString();fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record));}
