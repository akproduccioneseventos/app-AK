import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const record = JSON.parse(fs.readFileSync(path.join(root, 'docs/evidencias/135-entorno.json')));
const source = '7230f9d02b32805952a185f704a0208bd5d643e6';
if (record.sourceSha !== source || record.buildExit !== 0) throw new Error('QA source/build mismatch');
const health = await (await fetch('http://127.0.0.1:3300/api/health')).json();
if (!health.version.startsWith(source) || Object.entries(health.services).some(([k,v]) => v && k !== 'firebase')) throw new Error('Unsafe QA health');
const safeNames = ['PATH','TEMP','TMP','SYSTEMROOT','WINDIR','PROGRAMDATA','PROGRAMFILES','COMSPEC','PATHEXT','LOCALAPPDATA'];
const safe = Object.fromEntries(safeNames.filter(k => process.env[k] !== undefined).map(k => [k,process.env[k]]));
const forced = spawnSync(process.execPath, ['scripts/entorno-de-pruebas.mjs'], { cwd: root,
  env: { ...safe, AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE: 'true' }, encoding: 'utf8' });
if (forced.status !== 0) throw new Error(forced.stderr);
const qa = record.qa;
const deps = path.join(qa, 'node_modules');
fs.copyFileSync(path.join(root, 'tests/e2e/137-maestros.spec.ts'), path.join(qa, 'tests/e2e/137-maestros.spec.ts'));
fs.copyFileSync(path.join(root, 'docs/evidencias/137-playwright.config.ts'), path.join(qa, '137-playwright.config.ts'));
const output = path.join(root, 'docs/evidencias/137-results.json');
const report = path.join(root, 'docs/evidencias/137-report');
const args = [path.join(deps, '@playwright/test/cli.js'), 'test', '--config', '137-playwright.config.ts', '137-maestros.spec.ts',
  '--output', path.join(root, 'docs/evidencias/137-artifacts')];
const env = { ...safe, ...JSON.parse(forced.stdout).forzadas, NODE_ENV:'production', AK_QA_RESULTS:output,
  AK_QA_REPORT:report, PLAYWRIGHT_BASE_URL:'http://127.0.0.1:3300' };
const log = fs.createWriteStream(path.join(root,'docs/evidencias/137.log'));
const run = spawn(process.execPath,args,{cwd:qa,env,stdio:['ignore','pipe','pipe']});
run.stdout.pipe(log); run.stderr.pipe(log);
const code = await new Promise((resolve,reject)=>{run.once('error',reject);run.once('exit',resolve)});
await new Promise(resolve=>log.end(resolve));
fs.writeFileSync(path.join(root,'docs/evidencias/137-execution.json'),JSON.stringify({source,buildFinishedAt:record.buildFinishedAt,health,args,exitCode:code,finishedAt:new Date().toISOString(),testSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'tests/e2e/137-maestros.spec.ts'))).digest('hex')},null,2)+'\n');
console.log(JSON.stringify({code,output}));
if(code!==0)process.exitCode=1;
