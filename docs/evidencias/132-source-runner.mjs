import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { spawn, execFileSync } from 'node:child_process';
import { fixtureGuard } from './110-fixture-guard.mjs';

const root = process.cwd(), require = createRequire(import.meta.url);
const source = 'd10f332a17241de5a4705a560336585853073a76';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32000000 });
const tag = process.argv[2], tests = process.argv.slice(3);
if (!/^132-[a-z0-9-]+$/.test(tag || '') || !tests.length || tests.some(f => !/^docs\/evidencias\/132-[a-z0-9-]+\.test\.tsx?$/.test(f))) throw new Error('Explicit QA132 probes only');
const contrastedMain = git('rev-parse', 'origin/main').trim();
if (git('diff', source, contrastedMain, '--', 'src', 'package.json', 'package-lock.json', 'jest.config.js', 'next.config.ts', 'tsconfig.json').trim()) throw new Error('Main app differs from frozen snapshot; review source gate');
if (git('diff', source, '--', 'package.json', 'package-lock.json', 'tsconfig.json').trim()) throw new Error('Dependencies/config do not match snapshot');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-qa132-source-'));
const absoluteTemp = path.resolve(temp), tempRoot = path.resolve(os.tmpdir()) + path.sep;
if (!absoluteTemp.startsWith(tempRoot) || !path.basename(absoluteTemp).startsWith('ak-qa132-source-')) throw new Error('Invalid named QA temp directory');
const cleanup = () => fs.rmSync(absoluteTemp, { recursive: true, force: true });
const archive = path.join(temp, 'source.tar');
const tar = fs.openSync(archive, 'w');
try {
  execFileSync('git', ['archive', '--format=tar', source, 'src'], { stdio: ['ignore', tar, 'pipe'], windowsHide: true });
} finally { fs.closeSync(tar); }
execFileSync('tar', ['-xf', archive, '-C', temp], { stdio: 'pipe', windowsHide: true });
const env = {};
for (const k of ['PATH', 'Path', 'SYSTEMROOT', 'SystemRoot', 'COMSPEC', 'ComSpec', 'PATHEXT', 'TEMP', 'TMP', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'HOMEDRIVE', 'HOMEPATH']) if (process.env[k]) env[k] = process.env[k];
Object.assign(env, { NODE_ENV: 'test', TZ: 'America/Montevideo', NODE_OPTIONS: '--max-old-space-size=4096', AK_ENTORNO_AISLADO: 'true', AK_USE_LOCAL_JSON_ONLY: 'true', GOOGLE_APPLICATION_CREDENTIALS: path.join(temp, 'NO-CREDENTIALS-EXIST.json') });
const snapshotPath = path.join(temp, 'src').replaceAll('\\', '/');
const config = { rootDir: root, testEnvironment: require.resolve('jest-environment-jsdom'), testMatch: ['**/docs/evidencias/132-*.test.ts?(x)'],
  modulePaths: [path.join(root, 'node_modules')],
  moduleNameMapper: { '^@/(.*)$': snapshotPath + '/$1', '^@opentelemetry/sdk-node$': snapshotPath + '/lib/empty-mock.js' },
  setupFiles: [path.join(root, 'docs/evidencias/132-no-network.cjs')],
  setupFilesAfterEnv: [path.join(root, 'jest.setup.js')],
  transform: { '^.+\\.[tj]sx?$': [require.resolve('ts-jest'), { tsconfig: { target: 'ES2022', module: 'CommonJS', jsx: 'react-jsx', esModuleInterop: true, allowJs: true, isolatedModules: true }, diagnostics: false }] },
};
process.env.AK_ENTORNO_AISLADO = 'true';
const restore = fixtureGuard(), prefix = `docs/evidencias/${tag}`;
const args = [require.resolve('jest/bin/jest'), '--config', JSON.stringify(config), '--runInBand', '--silent', '--json', `--outputFile=${prefix}-jest.json`, '--runTestsByPath', ...tests];
const record = { applicationSourceSha: source, contrastedMain, mainSourceEquivalent: true, documentaryHead: git('rev-parse', 'HEAD').trim(), sourceMode: 'GIT_ARCHIVE_FROZEN_SRC_NOT_OLD_CHECKOUT',
  scope: 'TS_JEST_REAL_COMPONENT_ACTIONS_SYNTHETIC_PROVIDERS_NOT_NEXT_BUILD_OR_BROWSER', typecheck: false, network: 'HTTP_HTTPS_FETCH_DENIED', env: 'WHITELIST_NO_KEYS_NO_ENV_FILES_IN_SNAPSHOT', startedAt: new Date().toISOString(), status: 'running', args,
  testHashes: tests.map(file => ({file, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')})) };
const log = fs.openSync(`${prefix}.log`, 'w');
const child = spawn(process.execPath, args, { env, windowsHide: true, stdio: ['ignore', log, log] });
record.pid = child.pid;
fs.writeFileSync(`${prefix}-ejecucion.json`, JSON.stringify(record, null, 2) + '\n');
child.once('exit', (code, signal) => {
  fs.closeSync(log);
  Object.assign(record, { status: 'finished', exitCode: code, signal, finishedAt: new Date().toISOString(), fixtures: restore() });
  cleanup(); record.snapshotRemoved = !fs.existsSync(temp);
  fs.writeFileSync(`${prefix}-ejecucion.json`, JSON.stringify(record, null, 2) + '\n');
  console.log(JSON.stringify({ ...record, args: undefined })); process.exitCode = code ?? 1;
});
