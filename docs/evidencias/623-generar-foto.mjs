import fs from'node:fs';import path from'node:path';import{createRequire}from'node:module';import{fileURLToPath}from'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),file=path.join(dir,'623-foto-ficticia.png');
const sharp=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('sharp');
const raw=Buffer.alloc(640*480*3);for(let y=0;y<480;y++)for(let x=0;x<640;x++){const on=(Math.floor(x/16)+Math.floor(y/12))%2===0,i=(y*640+x)*3;raw[i]=on?70:185;raw[i+1]=on?105:160;raw[i+2]=on?160:95;}
if(!fs.existsSync(file))await sharp(raw,{raw:{width:640,height:480,channels:3}}).png().toFile(file);
const meta=await sharp(file).metadata();console.log(JSON.stringify({file,width:meta.width,height:meta.height,format:meta.format,bytes:fs.statSync(file).size,synthetic:true}));
