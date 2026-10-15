import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { fixtureGuard } from './110-fixture-guard.mjs';

const tag = process.argv[2], tests = process.argv.slice(3);
const registryTest = 'src/__tests__/cada-hallazgo-de-codex-tiene-su-pregunta.test.ts';
if (!/^130-[a-z0-9-]+$/.test(tag || '') || !tests.length || tests.some(p => p !== registryTest && !/^docs\/evidencias\/130-[a-z0-9-]+\.test\.tsx?$/.test(p))) throw new Error('Explicit QA130 tests only');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const source = 'ce1ac07d1bb16c24dd73e2d26ac55038028a2472', main = git('rev-parse', 'origin/main');
const sourcePaths = ['src', 'package.json', 'package-lock.json', 'jest.config.js', 'next.config.ts', 'tsconfig.json'];
if (git('diff', source, main, '--', ...sourcePaths) || git('diff', source, '--', ...sourcePaths)) throw new Error('App source changed; review gate first');
const env = {};
for (const key of ['PATH', 'Path', 'SYSTEMROOT', 'SystemRoot', 'COMSPEC', 'ComSpec', 'PATHEXT', 'TEMP', 'TMP', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'HOMEDRIVE', 'HOMEPATH']) if (process.env[key]) env[key] = process.env[key];
Object.assign(env, { NODE_ENV: 'test', TZ: 'America/Montevideo', NODE_OPTIONS: '--max-old-space-size=4096', AK_ENTORNO_AISLADO: 'true', AK_USE_LOCAL_JSON_ONLY: 'true', GOOGLE_APPLICATION_CREDENTIALS: path.resolve('docs/evidencias/qa130-no-credentials-DOES-NOT-EXIST.json') });
process.env.AK_ENTORNO_AISLADO = 'true';
const restore = fixtureGuard(), prefix = `docs/evidencias/${tag}`;
const args = ['node_modules/jest/bin/jest.js', '--runInBand', '--silent', '--json', `--outputFile=${prefix}-jest.json`, '--testMatch=**/docs/evidencias/130-*.test.ts?(x)', `--testMatch=**/${registryTest}`, '--runTestsByPath', ...tests];
const record = { applicationSourceSha: source, contrastedMain: main, documentaryHead: git('rev-parse', 'HEAD'),
  sourceGate: 'NO_APP_DEPENDENCY_OR_TEST_CONFIG_DIFF_FROM_SOURCE', startedAt: new Date().toISOString(), args,
  credentials: 'ENV_WHITELIST_NO_INHERITED_SERVICE_KEYS_MISSING_ADC_SENTINEL',
  scope: 'FOCUSED_COMPONENT_OR_MODULE_DOUBLES_NOT_BUILD_NOT_NATIVE_BROWSER',
  testHashes: tests.map(file => ({ file, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') })), status: 'running' };
const log = fs.openSync(`${prefix}.log`, 'w');
const child = spawn(process.execPath, args, { env, windowsHide: true, stdio: ['ignore', log, log] });
record.pid = child.pid;
fs.writeFileSync(`${prefix}-ejecucion.json`, JSON.stringify(record, null, 2) + '\n');
child.once('exit', (code, signal) => {
  fs.closeSync(log);
  Object.assign(record, { status: 'finished', exitCode: code, signal, finishedAt: new Date().toISOString(), cleanup: restore() });
  fs.writeFileSync(`${prefix}-ejecucion.json`, JSON.stringify(record, null, 2) + '\n');
  console.log(JSON.stringify(record)); process.exitCode = code ?? 1;
});
