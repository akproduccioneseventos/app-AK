import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {gzipSync,gunzipSync} from 'node:zlib';import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),source='978af7d65a60bd287f3ee3cc05037a29566074f4';
const prior=JSON.parse(fs.readFileSync(path.join(dir,'510-emuladores.json'),'utf8'));assert(prior.finished,'No overlap with SDK/native run');
const files=['133-invitado-con-red-local.spec.ts','143-cocina-fecha-local.spec.ts','521-visual-portadas.spec.ts'];
let code=gunzipSync(fs.readFileSync(path.join(dir,'374-driver.mjs.gz'))).toString('utf8')
 .replaceAll('3e45a4ac6b479f89605163168e31b37dc84f2d0f',source).replaceAll('366-entorno.json','486-entorno.json').replaceAll('.qa-366-main-','.qa-480-delta-')
 .replaceAll('374','520').replaceAll('373-config.ts','519-config.ts').replace('expected:27','expected:14').replace('assert.equal(list.length,27','assert.equal(list.length,14')
 .replace('Only27 previously inconclusive project/case pairs','Exactly12 original JSON-mode cases plus2 visual walks, not SDK acceptance');
const snap='const snapshots=new Map(jsonFiles().map(file=>[file,fs.readFileSync(file)]));';assert(code.includes(snap));
const sanitize=`for(const file of jsonFiles()){const name=path.basename(file);if(['servicios-empresa.json','menus-catering.json','insumos.json','budget-display-settings.json','armado-rapido-config.json','invoice-template-settings.json','crm-stages.json','blog-posts.json','employee-roles.json'].includes(name))continue;if(/^(?:src\\/)?data\\/fiestas\\//.test(path.relative(qa,file).replaceAll('\\\\','/'))){fs.unlinkSync(inside(file));continue;}const old=JSON.parse(fs.readFileSync(file,'utf8'));fs.writeFileSync(file,JSON.stringify(Array.isArray(old)?[]:{})+'\\n');}`;
code=code.replace(snap,'const originalBytes520=new Map(jsonFiles().map(file=>[file,fs.readFileSync(file)]));\n'+sanitize+'\n'+snap);
const final="record.sourceDiff=git(['diff','--name-only']);";assert(code.includes(final));
code=code.replace(final,"for(const p of jsonFiles())if(!originalBytes520.has(p))fs.unlinkSync(p);for(const[p,b]of originalBytes520)fs.writeFileSync(p,b);"+final);
const config=path.join(dir,'519-config.ts');assert(!fs.existsSync(config));
fs.writeFileSync(config,"import {defineConfig} from '@playwright/test';import base from './208-config';export default defineConfig({...base,globalTimeout:60*60*1000,projects:base.projects?.map(p=>({...p,grep:/ak207-(133-invitado-con-red-local|143-cocina-fecha-local|521-visual-portadas)/}))});\n");
const physical=path.join(dir,'520-driver.mjs');assert(!fs.existsSync(physical));fs.writeFileSync(physical,code);fs.writeFileSync(physical+'.gz',gzipSync(code));
process.env.AK_AUDIT_SPEC_FILTER=files.join(',');process.env.AK_AUDIT_SKIP_PORTAL='true';process.env.AK_AUDIT_BATCH_SIZE='1';
const qa=JSON.parse(fs.readFileSync(path.join(dir,'486-entorno.json'),'utf8')).qa,visual=path.join(qa,'tests/e2e/521-visual-portadas.spec.ts');assert(!fs.existsSync(visual));fs.copyFileSync(path.join(dir,'521-visual-portadas.spec.ts'),visual);
try{await import(pathToFileURL(physical).href);}finally{if(fs.existsSync(visual))fs.unlinkSync(visual);}
