const fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawnSync}=require('child_process');
const qa=process.argv[2],mode=process.argv[3]||'originales';
if(!qa||!path.basename(qa).startsWith('ak-qa-749-pr1371-'))throw Error('Solo QA749 aislado');
const manifest=JSON.parse(fs.readFileSync(path.join(qa,'source-manifest.json'),'utf8'));
const h=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
function verify(){const bad=[];for(const f of manifest.files){const b=fs.readFileSync(path.join(qa,f.path));if(h(b)!==f.sha&&h(Buffer.from(b.toString().replace(/\r\n/g,'\n')))!==f.sha)bad.push(f.path);}if(bad.length)throw Error('Fuente mezclada '+bad);return {source:manifest.source,matched:manifest.files.length};}
const suites=mode==='originales'?['src/__tests__/asi-va-a-quedar-tu-fiesta.test.ts','src/__tests__/decoracion-no-gasta-de-mas.test.ts']:mode==='acciones'?['src/__tests__/qa-751-salon-ia.test.ts']:['src/__tests__/qa-752-salon-cliente-ui.test.tsx'];
const prefix=mode==='originales'?'750-originales':mode==='acciones'?'751-acciones':'752-ui';
const env={};for(const k of ['SystemRoot','WINDIR','PATH','TEMP','TMP','COMSPEC','PATHEXT'])if(process.env[k])env[k]=process.env[k];
Object.assign(env,{NODE_ENV:'test',TZ:'America/Montevideo',HOME:qa,USERPROFILE:qa,AK_USE_LOCAL_JSON_ONLY:'true',GOOGLE_CLOUD_PROJECT:'demo-ak-749',GCLOUD_PROJECT:'demo-ak-749',FIRESTORE_EMULATOR_HOST:'127.0.0.1:9',NODE_OPTIONS:'--require='+path.join(__dirname,'739-sin-egreso.cjs'),AK_QA_EVIDENCE_OUT:path.join(__dirname,prefix+'-observaciones.json')});
const before=verify(),started=new Date().toISOString();const r=spawnSync(process.execPath,['--max-old-space-size=768',path.join(qa,'node_modules/jest/bin/jest.js'),'--runInBand','--silent','--json','--outputFile='+path.join(__dirname,prefix+'.json'),'--runTestsByPath',...suites],{cwd:qa,env,encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024});
fs.writeFileSync(path.join(__dirname,prefix+'.log'),(r.stdout||'')+(r.stderr||''));const receipt={started,finished:new Date().toISOString(),before,after:verify(),suites,exit:r.status,signal:r.signal,error:r.error?.message||null,limits:'Acciones/helpers/componentes reales con fronteras controladas. Protocolo Gemini DOBLE LOCAL, no modelo externo/cargos. No SDK/HTTP nativo/3D real/build. Dependencias reutilizadas.'};fs.writeFileSync(path.join(__dirname,prefix+'-corrida.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));process.exitCode=r.status??1;

