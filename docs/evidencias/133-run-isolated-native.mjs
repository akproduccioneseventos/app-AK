// Starts the already-built synthetic QA copy, runs selected browser journeys, then stops only its server.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const qa = fs.realpathSync(process.argv[2]);
const runName = process.argv[3] || 'portal-cliente';
const tests = process.argv.slice(4);
const expectedSha = 'a635b27071ecea22092eba2a285892c84c6f9d08';
const baseUrl = 'http://127.0.0.1:3300';
const resultPath = path.join(repo, 'docs', 'evidencias', `133-${runName}-execution.json`);
const serverLogPath = path.join(repo, 'docs', 'evidencias', `133-${runName}-server.log`);

if (!/^[a-z0-9-]+$/.test(runName) || !tests.length) throw new Error('Run name and test files are required');
if (path.dirname(qa).toLowerCase() !== path.resolve(os.tmpdir()).toLowerCase()
  || path.basename(qa) !== 'ak-entorno-aislado-P2nuO7') throw new Error('Unexpected disposable QA path');
const sha = spawnSync('git', ['-C', qa, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
if (sha !== expectedSha) throw new Error(`Unexpected QA source SHA: ${sha}`);
if (!fs.existsSync(path.join(qa, '.next', 'BUILD_ID'))) throw new Error('No completed isolated build');

const listener = net.createServer();
await new Promise((resolve, reject) => {
  listener.once('error', reject);
  listener.listen(3300, '127.0.0.1', () => { listener.close(resolve); });
});

for (const file of tests.filter((name) => /^tests\/e2e\/133-[a-z0-9-]+\.spec\.ts$/.test(name))) {
  fs.copyFileSync(path.join(repo, file), path.join(qa, file));
}
for (const file of tests) {
  if (!/^tests\/e2e\/[a-z0-9-]+\.spec\.ts$/.test(file) || !fs.existsSync(path.join(qa, file))) {
    throw new Error(`Missing or disallowed E2E file: ${file}`);
  }
}

const allowedEnvNames = ['PATH', 'HOME', 'LANG', 'LC_ALL', 'TMPDIR', 'TEMP', 'TMP', 'SYSTEMROOT',
  'HOMEDRIVE', 'HOMEPATH', 'LOGONSERVER', 'SYSTEMDRIVE', 'USERDOMAIN', 'USERNAME', 'USERPROFILE',
  'WINDIR', 'APPDATA', 'LOCALAPPDATA', 'PUBLIC', 'ALLUSERSPROFILE', 'PROGRAMDATA', 'PROGRAMFILES',
  'COMSPEC', 'PATHEXT'];
const safeEnv = {};
for (const name of allowedEnvNames) if (process.env[name] !== undefined) safeEnv[name] = process.env[name];
const forcedResult = spawnSync(process.execPath, ['scripts/entorno-de-pruebas.mjs'], {
  cwd: repo,
  env: { PATH: safeEnv.PATH, SYSTEMROOT: safeEnv.SYSTEMROOT, AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE: 'true' },
  encoding: 'utf8',
});
if (forcedResult.status !== 0) throw new Error(`Could not derive the documented synthetic environment: ${forcedResult.stderr}`);
const forced = JSON.parse(forcedResult.stdout).forzadas;
const serverEnv = { ...safeEnv, ...forced, NEXT_TELEMETRY_DISABLED: '1', AK_DISABLE_STANDALONE: 'true' };
const testEnv = {
  ...serverEnv,
  PLAYWRIGHT_BASE_URL: baseUrl,
  PLAYWRIGHT_JSON_OUTPUT_NAME: path.join(repo, 'docs', 'evidencias', `133-${runName}-results.json`),
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8085',
  FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9195',
};

const startedAt = new Date().toISOString();
const serverLog = fs.createWriteStream(serverLogPath, { flags: 'w' });
const server = spawn(process.execPath, [
  path.join(repo, 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '--hostname', '127.0.0.1', '--port', '3300',
], { cwd: qa, env: serverEnv, stdio: ['ignore', 'pipe', 'pipe'] });
server.stdout.pipe(serverLog);
server.stderr.pipe(serverLog);
let health;
let testResult;
let failure;
try {
  for (let i = 0; i < 120; i++) {
    if (server.exitCode !== null) throw new Error(`Isolated Next server exited: ${server.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(2_000) });
      health = await response.json();
      break;
    } catch {
      await delay(1_000);
    }
  }
  if (!health) throw new Error('Synthetic Next server did not become healthy within 120 seconds');
  if (!health.version?.startsWith(`${sha} `)) throw new Error(`Unexpected health version: ${health.version}`);
  for (const service of ['gemini', 'mercadoPago', 'instagram', 'googleWorkspace', 'mail']) {
    if (health.services?.[service] !== false) throw new Error(`Real service is not disabled: ${service}`);
  }
  const testSources = tests.map((file) => ({
    file,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(qa, file))).digest('hex'),
  }));
  const run = spawnSync(process.execPath, [
    'node_modules/@playwright/test/cli.js', 'test', '--config', 'playwright.config.ts', '--workers=1', '--retries=0',
    '--reporter=line,json', '--output', path.join(repo, 'docs', 'evidencias', `133-${runName}-artifacts`), ...tests,
  ], { cwd: qa, env: testEnv, stdio: 'inherit' });
  testResult = { exitCode: run.status, signal: run.signal, testSources };
  if (run.status !== 0) failure = new Error(`Synthetic E2E exited with ${run.status ?? run.signal}`);
} catch (error) {
  failure = error;
} finally {
  if (server.exitCode === null) server.kill();
  await Promise.race([
    new Promise((resolve) => server.once('exit', resolve)),
    delay(10_000),
  ]);
  serverLog.end();
  fs.writeFileSync(resultPath, JSON.stringify({
    startedAt, finishedAt: new Date().toISOString(), sourceSha: sha,
    applicationEquivalentTo: 'd10f332a17241de5a4705a560336585853073a76',
    qaDirectory: qa, health, tests, testResult,
    isolatedServicesDisabled: ['gemini', 'mercadoPago', 'instagram', 'googleWorkspace', 'mail'],
    scope: 'synthetic isolated native QA only; no production data, accounts, charges, messages, hardware, or merge',
    error: failure ? String(failure.stack || failure) : null,
  }, null, 2));
}
if (failure) {
  console.error(failure);
  process.exitCode = 1;
} else {
  console.log(`Synthetic E2E complete on ${sha}: ${tests.join(', ')}`);
}
