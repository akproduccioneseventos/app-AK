import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),target=path.join(dir,'573-continuidad.json');assert(!fs.existsSync(target));
const source='f8f7cf34e8778de784b20e2654058fd722b2a2ec',previous='978af7d65a60bd287f3ee3cc05037a29566074f4';
const record={source,previous,started:new Date().toISOString(),phase:'waiting-567',appEdited:false,realServices:false};const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
const git=(args,cwd=root,buffer=false)=>{const r=spawnSync('git',args,{cwd,encoding:buffer?undefined:'utf8',maxBuffer:64*1024*1024});assert.equal(r.status,0,String(r.stderr));return buffer?r.stdout:r.stdout.trim();};
async function wait(check,minutes){const end=Date.now()+minutes*60000;while(!check()){if(Date.now()>end)throw Error('Bounded wait: no overlapping workload started');await new Promise(ok=>setTimeout(ok,15000));}}
try{
 await wait(()=>{const p=JSON.parse(fs.readFileSync(path.join(dir,'567-entorno.json'),'utf8'));if(!p.finished)return false;assert.equal(p.sourceDiff,'');return true;},110);
 const changed=git(['diff','--name-only',previous,source,'--','src','package.json','package-lock.json','apphosting.yaml']).split('\n').filter(Boolean);
 assert.deepEqual([...changed].sort(),['src/app/evento/buzon/[fiestaId]/page.tsx','src/app/evento/galeria/[fiestaId]/page.tsx','src/lib/buzon/video-frame-processor.ts','src/lib/caras/extractor-facial.ts'].sort());record.changed=changed;
 await wait(()=>os.freemem()>=2*1024**3,45);record.phase='preparing-frozen-source';save();
 const qa=fs.mkdtempSync('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-574-f8f-');record.qa=qa;save();
 git(['worktree','add','--detach',qa,source]);
 assert(path.resolve(qa).startsWith(path.resolve('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-574-f8f-')));
 git(['restore','--ignore-skip-worktree-bits','--source=HEAD','--worktree','--','.'],qa);
 assert.equal(git(['rev-parse','HEAD'],qa),source);assert.equal(git(['diff','--name-only'],qa),'');
 assert(!fs.readdirSync(qa).some(n=>/^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n)));
 const deps='C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules';assert(!fs.existsSync(path.join(qa,'node_modules')));fs.symlinkSync(deps,path.join(qa,'node_modules'),'junction');
 let build=fs.readFileSync(path.join(dir,'486-compilacion-generada.mjs'),'utf8').replaceAll('486','574').replaceAll(previous,source);
 const qStart=build.indexOf('  const qa='),qEnd=build.indexOf(';record.qa=qa;',qStart);assert(qStart>0&&qEnd>qStart);build=build.slice(0,qStart)+'  const qa='+JSON.stringify(qa)+build.slice(qEnd);
 const buildFile=path.join(dir,'574-compilacion-generada.mjs');assert(!fs.existsSync(buildFile));fs.writeFileSync(buildFile,build);
 record.phase='build574';save();await import(pathToFileURL(buildFile).href);const built=JSON.parse(fs.readFileSync(path.join(dir,'574-entorno.json'),'utf8'));assert.equal(built.phase,'built');
 let unit=fs.readFileSync(path.join(dir,'491-canonica-generada.mjs'),'utf8').replaceAll('490','576').replaceAll('491','577').replaceAll('486','574').replaceAll(previous,source).replaceAll('3f9460185143ef034dcd713e975d2a0af5e20f1a',previous).replaceAll('frozen917','frozenf8f7');
 unit=unit.replace(/reason:'[^']*'/,"reason:'New PUBLIC1353 four media consumers only; one final frozen-source official suite. No replay of258 browser matrix.'");
 const cleanup="if(qa){record.sourceDiff=git(['diff','--name-only'],qa);if(record.sourceDiff)process.exitCode=2;}";assert(unit.includes(cleanup));
 unit=unit.replace(cleanup,"if(qa){record.preCleanupDiff=git(['diff','--name-only'],qa);if(record.preCleanupDiff){const changed=record.preCleanupDiff.split('\\n');assert(changed.every(f=>snapshots.has(path.join(qa,f))),'Never restore unexpected app code');await new Promise(ok=>setTimeout(ok,2000));for(const[file,bytes]of snapshots)fs.writeFileSync(file,bytes);}record.sourceDiff=git(['diff','--name-only'],qa);if(record.sourceDiff)process.exitCode=2;}");
 const unitFile=path.join(dir,'577-canonica-generada.mjs');assert(!fs.existsSync(unitFile));fs.writeFileSync(unitFile,unit);record.phase='canonical576';save();process.exitCode=0;await import(pathToFileURL(unitFile).href);
 const unitResult=JSON.parse(fs.readFileSync(path.join(dir,'577-delta-publico.json'),'utf8'));record.canonical=unitResult.canonical;assert.equal(unitResult.sourceDiff,'');
 let media=fs.readFileSync(path.join(dir,'523-medios-generado.mjs'),'utf8').replaceAll('523','583').replaceAll('525','585').replaceAll('486-entorno.json','574-entorno.json').replaceAll('.qa-480-delta-','.qa-574-f8f-').replaceAll(previous,source);
 const mediaFile=path.join(dir,'583-medios-generado.mjs');assert(!fs.existsSync(mediaFile));fs.writeFileSync(mediaFile,media);
 let supervisor=fs.readFileSync(path.join(dir,'552-supervisor-aislado.mjs'),'utf8').replaceAll('552','584').replaceAll('551','583').replaceAll('554','585').replaceAll('486-entorno.json','574-entorno.json').replaceAll(previous,source).replaceAll('583-recorridos-sdk.mjs','583-medios-generado.mjs');
 const parent=path.join(dir,'584-supervisor-aislado.mjs');assert(!fs.existsSync(parent));fs.writeFileSync(parent,supervisor);
 await wait(()=>os.freemem()>=2*1024**3,45);record.phase='native-media585';save();process.exitCode=0;await import(pathToFileURL(parent).href);
 record.native=JSON.parse(fs.readFileSync(path.join(dir,'584-entorno.json'),'utf8'));record.phase='finished';if(record.canonical?.fail||record.native.nativeExit)process.exitCode=1;
}catch(e){record.phase='qa-setup-or-run-error';record.error=String(e.stack||e);process.exitCode=2;}
finally{record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
