import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url));
let code=fs.readFileSync(path.join(dir,'465-control-codecs-local.mjs'),'utf8').replaceAll('465','468');
code=code.replace("for(const animated of[false,true])for(const mime of['video/mp4','video/webm;codecs=vp9','video/webm'])","for(const audio of[false,true])for(const animated of[true])for(const mime of['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus'])");
code=code.replace('async({animated,mime})','async({animated,mime,audio})').replace('},{animated,mime});','},{animated,mime,audio});').replaceAll('mime,animated,supported','mime,animated,audio,supported');
const marker='const stream=canvas.captureStream(20),chunks=[],errors=[];let recorder,pump,frames=0;';assert(code.includes(marker));
code=code.replace(marker,marker+'let audioContext,oscillator;if(audio){audioContext=new AudioContext();const dest=audioContext.createMediaStreamDestination();oscillator=audioContext.createOscillator();oscillator.connect(dest);oscillator.start();for(const t of dest.stream.getAudioTracks())stream.addTrack(t);}');
code=code.replace('finally{clearInterval(pump);for(const t of stream.getTracks())t.stop();}','finally{clearInterval(pump);for(const t of stream.getTracks())t.stop();if(oscillator)oscillator.stop();if(audioContext)await audioContext.close();}');
const file=path.join(dir,'468-codecs-generado.mjs');assert(!fs.existsSync(file));fs.writeFileSync(file,code);await import(pathToFileURL(file).href);
