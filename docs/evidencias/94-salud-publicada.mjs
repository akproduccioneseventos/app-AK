import fs from 'node:fs';
const url='https://akproducciones.uy/api/health';
const checkedAt=new Date().toISOString();
try{
  const response=await fetch(url,{signal:AbortSignal.timeout(25000),cache:'no-store'});
  const body=await response.json();
  const data={checkedAt,url,status:response.status,body,meaning:'Firebase is a read; other service booleans only check configuration. No OAuth/payment/publication performed.'};
  fs.writeFileSync('docs/evidencias/94-salud-publicada.json',JSON.stringify(data,null,2));
  console.log(JSON.stringify(data));
}catch(error){const data={checkedAt,url,error:String(error),meaning:'No cause or service health inferred from this failure.'};
  fs.writeFileSync('docs/evidencias/94-salud-publicada.json',JSON.stringify(data,null,2));console.log(JSON.stringify(data));process.exitCode=1;}
