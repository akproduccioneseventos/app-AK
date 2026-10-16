import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = '7230f9d02b32805952a185f704a0208bd5d643e6';
const deps = 'C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules';
const recordFile = path.join(root, 'docs/evidencias/135-entorno.json');
const safeNames = ['PATH','HOME','LANG','LC_ALL','TMPDIR','TEMP','TMP','SYSTEMROOT','HOMEDRIVE','HOMEPATH',
  'SYSTEMDRIVE','USERDOMAIN','USERNAME','USERPROFILE','WINDIR','APPDATA','LOCALAPPDATA','PUBLIC',
  'ALLUSERSPROFILE','PROGRAMDATA','PROGRAMFILES','COMSPEC','PATHEXT'];
const safe = Object.fromEntries(safeNames.filter((name) => process.env[name] !== undefined).map((name) => [name, process.env[name]]));
const environment = spawnSync(process.execPath, ['scripts/entorno-de-pruebas.mjs'], {
  cwd: root, env: { ...safe, AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE: 'true' }, encoding: 'utf8',
});
if (environment.status !== 0) throw new Error(environment.stderr);
const env = { ...safe, ...JSON.parse(environment.stdout).forzadas, AK_DISABLE_STANDALONE: 'true', COMMIT_SHA: source };
const save = (record) => fs.writeFileSync(recordFile, JSON.stringify(record, null, 2) + '\n');
const checked = (command, args, cwd = root) => {
  const run = spawnSync(command, args, { cwd, env, encoding: 'utf8' });
  if (run.status !== 0) throw new Error(`${command}: ${run.stderr || run.stdout}`);
  return run.stdout.trim();
};

if (process.argv[2] === 'prepare') {
  if (fs.existsSync(recordFile)) throw new Error('Existing135 record: inspect before preparing another copy');
  const qa = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-qa-135-'));
  checked('git', ['worktree', 'add', '--detach', qa, source]);
  fs.symlinkSync(deps, path.join(qa, 'node_modules'), 'junction');
  if (fs.readdirSync(qa).some((name) => /^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(name))) {
    throw new Error('Refusing a QA copy containing env files');
  }
  const record = { sourceSha: source, qa, preparedAt: new Date().toISOString(), phase: 'building',
    environmentNames: Object.keys(env).sort(), realServicesEnabled: false, applicationEdited: false };
  save(record);
  const log = fs.createWriteStream(path.join(root, 'docs/evidencias/135-build.log'));
  const build = spawn(process.execPath, ['scripts/build-next-with-memory.mjs'], { cwd: qa, env, stdio: ['ignore','pipe','pipe'] });
  build.stdout.pipe(log); build.stderr.pipe(log);
  const code = await new Promise((resolve, reject) => { build.once('error', reject); build.once('exit', resolve); });
  await new Promise((resolve) => log.end(resolve));
  record.buildExit = code; record.buildFinishedAt = new Date().toISOString();
  record.phase = code === 0 ? 'built' : 'build-failed'; save(record);
  console.log(JSON.stringify(record));
  if (code !== 0) process.exitCode = 1;
} else if (process.argv[2] === 'serve') {
  const record = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
  if (record.sourceSha !== source || record.buildExit !== 0) throw new Error('Current source not built');
  if (checked('git', ['rev-parse', 'HEAD'], record.qa) !== source) throw new Error('QA source changed');
  const server = spawn(process.execPath, [path.join(deps, 'next/dist/bin/next'), 'start', '--hostname','127.0.0.1','--port','3300'], {
    cwd: record.qa, env, stdio: 'inherit',
  });
  record.serverPid = server.pid; record.serverStartedAt = new Date().toISOString(); save(record);
  const stop = () => { if (server.exitCode === null) server.kill(); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  await new Promise((resolve) => server.once('exit', resolve));
  record.serverStoppedAt = new Date().toISOString(); save(record);
} else if (process.argv[2] === 'test') {
  const record = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
  if (record.sourceSha !== source || record.buildExit !== 0) throw new Error('Source/build gate failed');
  const health = await (await fetch('http://127.0.0.1:3300/api/health')).json();
  if (!health.version?.startsWith(source) || Object.values(health.services).some(Boolean)) throw new Error('Unsafe QA health');
  const group = process.argv[3];
  const label = process.argv[4] || group;
  if (!/^[a-z0-9-]+$/.test(label)) throw new Error('Invalid evidence label');
  if (!['core', 'mobile', '3d', 'unit', 'unit-crm', 'kitchen', 'agenda'].includes(group)) throw new Error('Unknown group');
  for (const file of ['135-cocina-agenda-3d.spec.ts','135-mobile-contrato-social.spec.ts']) {
    fs.copyFileSync(path.join(root, 'tests/e2e', file), path.join(record.qa, 'tests/e2e', file));
  }
  fs.copyFileSync(path.join(root, 'docs/evidencias/135-playwright.config.ts'), path.join(record.qa, '135-playwright.config.ts'));
  const resultFile = path.join(root, `docs/evidencias/135-${label}-results.json`);
  const unitFiles = ['barra-listos-informa-lecturas-fallidas.test.tsx','chat-en-vivo-avisa-si-no-pudo-leer.test.tsx',
    'dj-estado-explicito-y-error-de-marca.test.tsx','musica-opcional-visible-dj.test.tsx',
    'orden-168-lecturas-que-deciden.test.ts','orden-168-pantallas-avisan-la-falla.test.tsx',
    'orden-168-plata-centavos-y-negativos.test.ts','orden-169-pantallas-que-dicen-listo.test.tsx'];
  const args = group.startsWith('unit')
    ? [path.join(deps, 'jest/bin/jest.js'), '--runInBand','--runTestsByPath', ...(group === 'unit-crm'
      ? ['src/__tests__/orden-168-lecturas-que-deciden.test.ts', '--testNamePattern', 'con lectura exitosa y sin presupuesto firmado']
      : unitFiles.map((file) => `src/__tests__/${file}`)), '--json', `--outputFile=${resultFile}`]
    : [path.join(deps, '@playwright/test/cli.js'),'test','--config','135-playwright.config.ts',
      group === 'mobile' ? '135-mobile-contrato-social.spec.ts' : '135-cocina-agenda-3d.spec.ts',
      ...(group === 'mobile' ? ['--project=chromium-mobile'] : group === '3d' ? ['--grep','salon 3D']
        : group === 'kitchen' ? ['--grep','cocina:'] : group === 'agenda' ? ['--grep','agenda:'] : ['--grep-invert','salon 3D']),
      '--output',path.join(root, `docs/evidencias/135-${label}-artifacts`)];
  const log = fs.createWriteStream(path.join(root, `docs/evidencias/135-${label}.log`));
  const run = spawn(process.execPath, args, { cwd: record.qa, env: { ...env, NODE_ENV: group.startsWith('unit') ? 'test' : 'production',
    ...(group === 'unit-crm' ? { AK_USE_LOCAL_JSON_ONLY: 'false', AK_ALLOW_LOCAL_JSON_WRITES: 'false' } : {}),
    AK_QA_RESULTS: resultFile, PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:3300' }, stdio: ['ignore','pipe','pipe'] });
  run.stdout.pipe(log); run.stderr.pipe(log);
  const code = await new Promise((resolve, reject) => { run.once('error', reject); run.once('exit', resolve); });
  await new Promise((resolve) => log.end(resolve));
  fs.writeFileSync(path.join(root, `docs/evidencias/135-${label}-execution.json`), JSON.stringify({
    sourceSha: source, buildFinishedAt: record.buildFinishedAt, health, group, label, args, exitCode: code,
    finishedAt: new Date().toISOString(), realServicesEnabled: false,
  }, null, 2) + '\n');
  console.log(JSON.stringify({ group, exitCode: code, resultFile }));
  if (code !== 0) process.exitCode = 1;
} else throw new Error('Use prepare, serve or test');
