import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const record = JSON.parse(fs.readFileSync(path.join(root, 'docs/evidencias/135-entorno.json')));
const deps = path.join(record.qa, 'node_modules');
const source = '7230f9d02b32805952a185f704a0208bd5d643e6';
if (record.sourceSha !== source || record.buildExit !== 0) throw new Error('Wrong source/build');
const health = await (await fetch('http://127.0.0.1:3300/api/health')).json();
const sdk = process.argv[3] === 'sdk';
const sdkFile = path.join(root, 'docs/evidencias/136-sdk-serve-execution.json');
const sdkReceipt = sdk ? JSON.parse(fs.readFileSync(sdkFile)) : null;
if (sdk && (sdkReceipt.status !== 'running' || sdkReceipt.source !== source || sdkReceipt.emulator !== '127.0.0.1:8085')) throw new Error('Wrong emulator run');
if (!health.version.startsWith(source) || Object.entries(health.services).some(([key, value]) => value && !(sdk && key === 'firebase'))) throw new Error('Unsafe health');
const safeNames = ['PATH','HOME','LANG','LC_ALL','TMPDIR','TEMP','TMP','SYSTEMROOT','HOMEDRIVE','HOMEPATH',
  'SYSTEMDRIVE','USERDOMAIN','USERNAME','USERPROFILE','WINDIR','APPDATA','LOCALAPPDATA','PUBLIC',
  'ALLUSERSPROFILE','PROGRAMDATA','PROGRAMFILES','COMSPEC','PATHEXT'];
const safe = Object.fromEntries(safeNames.filter((key) => process.env[key] !== undefined).map((key) => [key, process.env[key]]));
const forced = spawnSync(process.execPath, ['scripts/entorno-de-pruebas.mjs'], {
  cwd: root, env: { ...safe, AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE: 'true' }, encoding: 'utf8',
});
if (forced.status !== 0) throw new Error(forced.stderr);
const group = process.argv[2];
if (!['masters', 'prospecto'].includes(group)) throw new Error('Use masters or prospecto');
const employeeOnly = process.argv[4] === 'empleado';
const commercialOnly = process.argv[4] === 'comercial';
const suffix = ['final','evidencia','defecto','movil'].includes(process.argv[5]) ? `-${process.argv[5]}` : '';
const label = `${group}${sdk ? '-sdk' : ''}${employeeOnly ? '-empleado' : commercialOnly ? '-comercial' : ''}${suffix}`;
const output = path.join(root, `docs/evidencias/136-${label}-results.json`);
let args;
if (group === 'masters') {
  fs.copyFileSync(path.join(root, 'tests/e2e/136-maestros.spec.ts'), path.join(record.qa, 'tests/e2e/136-maestros.spec.ts'));
  const config = fs.readFileSync(path.join(root, 'docs/evidencias/135-playwright.config.ts'), 'utf8')
    .replace("launchOptions: { args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] }", 'launchOptions: {}');
  fs.writeFileSync(path.join(record.qa, '136-playwright.config.ts'), config);
  args = [path.join(deps, '@playwright/test/cli.js'), 'test', '--config', '136-playwright.config.ts', '136-maestros.spec.ts',
    '--output', path.join(root, `docs/evidencias/136-${label}-artifacts`),
    ...(employeeOnly ? ['--grep','crear empleado'] : commercialOnly ? ['--grep','prospecto y agenda'] : []),
    ...(suffix === '-movil' ? ['--project','chromium-mobile'] : [])];
} else {
  const original = 'src/__tests__/barrido-de-permisos-personal-y-operador.test.ts';
  const target = 'src/__tests__/136-prospecto-permisos.test.ts';
  const text = fs.readFileSync(path.join(record.qa, original), 'utf8');
  const marker = "['dueno', 'secretaria', 'operador', 'personal', 'cliente', 'invitado']";
  if (text.split(marker).length !== 2) throw new Error('Source fixture changed; do not guess transform');
  fs.writeFileSync(path.join(record.qa, target), text.replace(marker, "['prospecto']"));
  args = [path.join(deps, 'jest/bin/jest.js'), '--runInBand', '--runTestsByPath', target,
    '--testNamePattern', 'prospecto', '--json', `--outputFile=${output}`];
}
const env = { ...safe, ...JSON.parse(forced.stdout).forzadas, NODE_ENV: group === 'prospecto' ? 'test' : 'production',
  AK_QA_RESULTS: output, PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:3300' };
const log = fs.createWriteStream(path.join(root, `docs/evidencias/136-${label}.log`));
const run = spawn(process.execPath, args, { cwd: record.qa, env, stdio: ['ignore','pipe','pipe'] });
run.stdout.pipe(log); run.stderr.pipe(log);
const code = await new Promise((resolve, reject) => { run.once('error', reject); run.once('exit', resolve); });
await new Promise((resolve) => log.end(resolve));
fs.writeFileSync(path.join(root, `docs/evidencias/136-${label}-execution.json`), JSON.stringify({
  source, health, args, buildFinishedAt: record.buildFinishedAt, exitCode: code, finishedAt: new Date().toISOString(),
  testSha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(record.qa, group === 'masters'
    ? 'tests/e2e/136-maestros.spec.ts' : 'src/__tests__/136-prospecto-permisos.test.ts'))).digest('hex'),
}, null, 2) + '\n');
console.log(JSON.stringify({ group, code, output }));
if (code !== 0) process.exitCode = 1;
