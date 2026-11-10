import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const cwd = process.cwd();
const prefix = process.argv[2] || '764';
const suites = process.argv.slice(3);
if (!/^7(?:6[4-9]|7[0-9]|8[0-9])$/.test(prefix)) throw new Error('Prefijo QA invalido');
if (fs.readdirSync(cwd).some(n => /^\.env(?:\.|$)/.test(n) && !/example|sample/.test(n))) throw new Error('No usar .env reales');
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => /^(SystemRoot|WINDIR|COMSPEC|PATH|PATHEXT|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|HOMEDRIVE|HOMEPATH|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(k)));
Object.assign(env, { NODE_ENV: 'test', TZ: 'America/Montevideo', CI: '1', SESSION_SECRET: 'qa764-isolated-secret-no-real-credentials-0000000000', AK_QA_EVIDENCE_OUT: path.join(cwd, `docs/evidencias/${prefix}-observaciones.json`) });
Object.assign(env, {
  GOOGLE_APPLICATION_CREDENTIALS: path.join(cwd, '.qa-no-real-credentials.json'),
  FIREBASE_PROJECT_ID: 'demo-ak-producciones',
  GCLOUD_PROJECT: 'demo-ak-producciones',
  GOOGLE_CLOUD_PROJECT: 'demo-ak-producciones',
});
const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
const started = new Date().toISOString();
const extra = suites.length ? ['--runTestsByPath', ...suites] : [];
const result = spawnSync(process.execPath, ['--max-old-space-size=1536', './node_modules/jest/bin/jest.js', '--runInBand', '--no-cache', '--json', `--outputFile=docs/evidencias/${prefix}-jest.json`, ...extra], { cwd, env, encoding: 'utf8', timeout: suites.length ? 240000 : 1200000, maxBuffer: 32 * 1024 * 1024 });
fs.writeFileSync(`docs/evidencias/${prefix}-jest.log`, `${result.stdout ?? ''}\n${result.stderr ?? ''}`);
const receipt = { started, finished: new Date().toISOString(), base: git('rev-parse', 'HEAD'), runtimeDiff: git('diff', '--', 'src', 'package.json', 'package-lock.json', 'next.config.js'), suites, exit: result.status, signal: result.signal, error: result.error?.message ?? null, limits: 'QA ficticio sin entorno heredado/credenciales/cuentas/servicios reales; no build ni publicacion. Diff de trabajo queda en recibo hasta congelar fuente. Dependencias reutilizadas, no npm ci limpio.' };
fs.writeFileSync(`docs/evidencias/${prefix}-corrida.json`, JSON.stringify(receipt, null, 2));
if (fs.existsSync(`docs/evidencias/${prefix}-jest.json`)) {
  const j = JSON.parse(fs.readFileSync(`docs/evidencias/${prefix}-jest.json`, 'utf8'));
  console.log(JSON.stringify({ exit: result.status, suites: j.numTotalTestSuites, pass: j.numPassedTests, fail: j.numFailedTests, pending: j.numPendingTests, errors: j.testResults.filter(t => t.status === 'failed').map(t => ({ name: path.basename(t.name), messages: t.message?.slice(0, 800), cases: t.assertionResults.filter(a => a.status === 'failed').map(a => ({ name: a.fullName, errors: a.failureMessages.map(m => m.slice(0, 800)) })) })) }));
} else console.log(JSON.stringify(receipt));
process.exitCode = result.status ?? 1;
