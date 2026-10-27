const fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawnSync}=require('child_process');
const qa=process.argv[2],mode=process.argv[3]||'originales';
if(!qa||!path.basename(qa).startsWith('ak-qa-739-pr1370-'))throw Error('Solo QA739 aislado');
const manifest=JSON.parse(fs.readFileSync(path.join(qa,'source-manifest.json'),'utf8'));
const h=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
function verify(){const bad=[];for(const f of manifest.files){const b=fs.readFileSync(path.join(qa,f.path));if(h(b)!==f.sha&&h(Buffer.from(b.toString().replace(/\r\n/g,'\n')))!==f.sha)bad.push(f.path);}if(bad.length)throw Error('Fuente mezclada '+bad);return {source:manifest.source,matched:manifest.files.length};}
const suites=(mode==='originales'?['dos-cobros-a-la-vez-no-se-pisan','el-contador-recibe-los-centavos','la-carga-historica-no-duplica','la-factura-no-se-borra-mientras-se-cobra','un-enlace-de-presupuesto-se-puede-apagar','un-perfil-invalido-no-entra','una-pantalla-vieja-del-duenio-no-pisa-cuotas','una-sena-de-contrato-es-una-por-presupuesto','una-sesion-vieja-se-corta']:['qa-741-sesiones-y-propietarios','qa-741-fiesta-fronteras']).map(n=>'src/__tests__/'+n+'.test.ts');
const env={};for(const k of ['SystemRoot','WINDIR','PATH','TEMP','TMP','COMSPEC','PATHEXT'])if(process.env[k])env[k]=process.env[k];
Object.assign(env,{NODE_ENV:'test',TZ:'America/Montevideo',HOME:qa,USERPROFILE:qa,AK_USE_LOCAL_JSON_ONLY:'true',GOOGLE_CLOUD_PROJECT:'demo-ak-739',GCLOUD_PROJECT:'demo-ak-739',FIRESTORE_EMULATOR_HOST:'127.0.0.1:9',AK_SESSION_SECRET:'qa739-fictional-session-secret-not-production',NODE_OPTIONS:'--require='+path.join(__dirname,'739-sin-egreso.cjs'),AK_QA_EVIDENCE_OUT:path.join(__dirname,'741-observaciones.json')});
if(mode==='complemento')suites.splice(0,suites.length,'src/__tests__/qa-743-historicos.test.ts','src/__tests__/qa-743-usuarios-ui.test.tsx');
if(mode==='ui')suites.splice(0,suites.length,'src/__tests__/qa-744-usuarios-ui.test.tsx');
if(mode==='candado')suites.splice(0,suites.length,'src/__tests__/el-candado-de-la-plata.test.ts');
const prefix=mode==='originales'?'740-originales':mode==='complemento'?'743-complemento':mode==='ui'?'744-ui':mode==='candado'?'745-candado':'741-sondas';const before=verify(),started=new Date().toISOString();
const r=spawnSync(process.execPath,['--max-old-space-size=768',path.join(qa,'node_modules/jest/bin/jest.js'),'--runInBand','--silent','--json','--outputFile='+path.join(__dirname,prefix+'.json'),'--runTestsByPath',...suites],{cwd:qa,env,encoding:'utf8',timeout:240000,maxBuffer:8*1024*1024});
fs.writeFileSync(path.join(__dirname,prefix+'.log'),(r.stdout||'')+(r.stderr||''));
const receipt={started,finished:new Date().toISOString(),before,after:verify(),suites,exit:r.status,signal:r.signal,error:r.error?.message||null,limits:'Acciones/helpers reales; cookies y persistencia controladas. No SDK/HTTP/proveedor/cuentas reales. Dependencias reutilizadas, no build.'};fs.writeFileSync(path.join(__dirname,prefix+'-corrida.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));process.exitCode=r.status??1;

