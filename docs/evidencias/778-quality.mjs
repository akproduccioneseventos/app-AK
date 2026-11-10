import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';

const phase = process.argv[2];
const cwd = process.cwd();
const commands = {
  types: ['--max-old-space-size=4096', './node_modules/typescript/bin/tsc', '--noEmit', '--incremental', '--tsBuildInfoFile', path.join(process.env.TEMP || cwd, 'ak-764-types.tsbuildinfo')],
  lint: ['./node_modules/next/dist/bin/next', 'lint'],
  acentos: ['scripts/check-acentos.mjs'],
  jest: ['--max-old-space-size=768', './node_modules/jest/bin/jest.js', '--maxWorkers=1', '--workerIdleMemoryLimit=400MB', '--no-cache', '--json', '--outputFile=docs/evidencias/770-jest.json'],
};
if (!commands[phase]) throw new Error('Fase invalida');
const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).trim();
const signature = () => crypto.createHash('sha256').update(git('diff', 'HEAD', '--binary', '--', 'src', 'tests', 'functions', 'scripts', 'data/blog-posts.json', 'package.json', 'package-lock.json', 'next.config.js')).digest('hex');
const before = signature();
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => /^(SystemRoot|WINDIR|COMSPEC|PATH|PATHEXT|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|HOMEDRIVE|HOMEPATH|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(k)));
Object.assign(env, { NODE_ENV: 'test', TZ: 'America/Montevideo', CI: '1', NEXT_TELEMETRY_DISABLED: '1', SESSION_SECRET: 'qa764-no-real-session-secret-0000000000000000', GOOGLE_APPLICATION_CREDENTIALS: path.join(cwd, '.qa-no-real-credentials.json'), FIREBASE_PROJECT_ID: 'demo-ak-producciones', GOOGLE_CLOUD_PROJECT: 'demo-ak-producciones', GCLOUD_PROJECT: 'demo-ak-producciones' });
if (phase === 'jest') env.NODE_OPTIONS = '--max-old-space-size=768';
const log = fs.openSync(`docs/evidencias/770-${phase}.log`, 'w');
const child = spawn(process.execPath, commands[phase], { cwd, env, stdio: ['ignore', log, log] });
const receipt = { phase, pid: child.pid, started: new Date().toISOString(), base: git('rev-parse', 'HEAD'), sourceTree: git('rev-parse', 'HEAD:src'), before, command: commands[phase], limits: 'Fuente propia aislada, dependencias enlazadas+un paquete QA, sin cuentas/cargos/mensajes/proveedores reales; no build ni despliegue.' };
const progress = 'docs/evidencias/764-quality-progress.json';
fs.writeFileSync(progress, JSON.stringify(receipt, null, 2));
const timeout = setTimeout(() => child.kill(), 20 * 60_000);
const result = await new Promise(resolve => child.on('exit', (exit, signal) => resolve({ exit, signal })));
clearTimeout(timeout);
fs.closeSync(log);
const done = { ...receipt, ...result, finished: new Date().toISOString(), after: signature(), headAfter: git('rev-parse', 'HEAD') };
fs.writeFileSync(`docs/evidencias/770-${phase}-corrida.json`, JSON.stringify(done, null, 2));
fs.writeFileSync(progress, JSON.stringify(done, null, 2));
console.log(JSON.stringify(done));
if (phase === 'jest' && fs.existsSync('docs/evidencias/770-jest.json')) {
  const j = JSON.parse(fs.readFileSync('docs/evidencias/770-jest.json', 'utf8'));
  console.log(JSON.stringify({ suites: j.numTotalTestSuites, pass: j.numPassedTests, fail: j.numFailedTests, pending: j.numPendingTests, errors: j.testResults.filter(t => t.status === 'failed').map(t => ({ name: path.basename(t.name), message: t.message?.slice(0, 500) })) }));
} else console.log(fs.readFileSync(`docs/evidencias/770-${phase}.log`, 'utf8').slice(-6500));
process.exitCode = done.exit === 0 && done.before === done.after && done.base === done.headAfter ? 0 : 1;
