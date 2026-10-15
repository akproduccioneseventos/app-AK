import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fixtureGuard } from './110-fixture-guard.mjs';

const tag = process.argv[2];
const tests = process.argv.slice(3);
const registryTest = 'src/__tests__/cada-hallazgo-de-codex-tiene-su-pregunta.test.ts';
if (!/^129-[a-z0-9-]+$/.test(tag || '') || !tests.length || tests.some(p => p !== registryTest && !/^docs\/evidencias\/129-[a-z0-9-]+\.test\.tsx?$/.test(p))) {
  throw new Error('Only explicit QA129 evidence tests may run');
}
const source = 'ce1ac07d1bb16c24dd73e2d26ac55038028a2472';
const main = execFileSync('git', ['rev-parse', 'origin/main'], { encoding: 'utf8' }).trim();
const sourcePaths = ['src', 'package.json', 'package-lock.json', 'jest.config.js', 'next.config.ts', 'tsconfig.json'];
if (execFileSync('git', ['diff', source, main, '--', ...sourcePaths], { encoding: 'utf8' }).trim()) throw new Error('Current main changed application source; review source gate');
if (execFileSync('git', ['diff', source, '--', ...sourcePaths], { encoding: 'utf8' }).trim()) {
  throw new Error('Application source differs from gated source');
}
const env = {};
for (const key of ['PATH', 'Path', 'SYSTEMROOT', 'SystemRoot', 'COMSPEC', 'ComSpec', 'PATHEXT', 'TEMP', 'TMP', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'HOMEDRIVE', 'HOMEPATH']) {
  if (process.env[key]) env[key] = process.env[key];
}
Object.assign(env, { NODE_ENV: 'test', TZ: 'America/Montevideo', NODE_OPTIONS: '--max-old-space-size=4096',
  AK_ENTORNO_AISLADO: 'true', AK_USE_LOCAL_JSON_ONLY: 'true',
  GOOGLE_APPLICATION_CREDENTIALS: path.resolve('docs/evidencias/qa129-no-credentials-DOES-NOT-EXIST.json') });
process.env.AK_ENTORNO_AISLADO = 'true';
const restore = fixtureGuard();
const prefix = `docs/evidencias/${tag}`;
const args = ['node_modules/jest/bin/jest.js', '--runInBand', '--silent', '--json', `--outputFile=${prefix}-jest.json`,
  '--testMatch=**/docs/evidencias/129-*.test.ts?(x)', `--testMatch=**/${registryTest}`, '--runTestsByPath', ...tests];
const record = { applicationSourceSha: source, contrastedMain: main, mainApplicationDiff: 'NONE_FOR_GATED_PATHS', documentaryHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  args, startedAt: new Date().toISOString(), credentials: 'WHITELIST_NO_INHERITED_SERVICE_KEYS_MISSING_ADC_SENTINEL',
  scope: 'FOCUSED_REAL_MODULES_WITH_FICTITIOUS_DOUBLES_NOT_BUILD_NOT_NATIVE_BROWSER', status: 'running' };
const log = fs.openSync(`${prefix}.log`, 'w');
const child = spawn(process.execPath, args, { env, stdio: ['ignore', log, log], windowsHide: true });
record.pid = child.pid;
fs.writeFileSync(`${prefix}-ejecucion.json`, JSON.stringify(record, null, 2) + '\n');
child.once('exit', (code, signal) => {
  fs.closeSync(log);
  Object.assign(record, { status: 'finished', exitCode: code, signal, finishedAt: new Date().toISOString(), cleanup: restore() });
  fs.writeFileSync(`${prefix}-ejecucion.json`, JSON.stringify(record, null, 2) + '\n');
  console.log(JSON.stringify(record));
  process.exitCode = code ?? 1;
});
