import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const evidence = path.dirname(fileURLToPath(import.meta.url));
const qa = 'C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-760-main-e6db627';
const expected = 'e6db627f74301706d5e51fc7e1838808c1d767fe';
const deps = 'C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules';
const related = process.argv.includes('--related');
const login = process.argv.includes('--login');
const decor = process.argv.includes('--decor');
const prefix = decor ? '763' : login ? '762' : related ? '761' : '760';
const git = (...args) => execFileSync('git', args, { cwd: qa, encoding: 'utf8' }).trim();
if (git('rev-parse', 'HEAD') !== expected) throw new Error('SHA inesperado');
if (fs.readdirSync(qa).some(n => /^\.env(?:\.|$)/.test(n) && !/example|sample/.test(n))) throw new Error('QA contiene .env');
if (!fs.existsSync(path.join(qa, 'node_modules'))) fs.symlinkSync(deps, path.join(qa, 'node_modules'), 'junction');
const copies = login ? [['741-sesiones-y-propietarios.test.ts', 'qa-762-sesiones.test.ts']] : decor ? [] : related ? [
  ['741-fiesta-fronteras.test.ts', 'qa-761-fiesta.test.ts'],
  ['743-historicos.test.ts', 'qa-761-historicos.test.ts'],
] : [
  ['732-contabilidad-consumidores.test.ts', 'qa-760-732.test.ts'],
  ['737-ajuste-contrato-vs-faq.test.ts', 'qa-760-737.test.ts'],
];
for (const [source, target] of copies) fs.copyFileSync(path.join(evidence, source), path.join(qa, 'src/__tests__', target));
if (decor) fs.writeFileSync(path.join(qa, 'src/__tests__/qa-763-decor.test.ts'), fs.readFileSync(path.join(qa, 'src/__tests__/las-plantillas-de-decoracion-se-publican-solas.test.ts'), 'utf8') + fs.readFileSync(path.join(evidence, '763-decoracion-topes-extra.ts'), 'utf8'));
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => /^(SystemRoot|WINDIR|COMSPEC|PATH|PATHEXT|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|HOMEDRIVE|HOMEPATH|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(k)));
Object.assign(env, { NODE_ENV: 'test', TZ: 'America/Montevideo', CI: '1', AK_QA_EVIDENCE_OUT: path.join(evidence, `${prefix}-observaciones.json`), SESSION_SECRET: 'qa760-fake-session-secret-only-no-real-credentials-0000000000' });
const suites = decor ? ['src/__tests__/qa-763-decor.test.ts'] : copies.map(([, target]) => `src/__tests__/${target}`).concat(login ? [] : related ? [
  ...JSON.parse(fs.readFileSync(path.join(evidence, '736-contratos-corrida.json'), 'utf8')).suites,
  'src/__tests__/dos-bajas-conservan-un-dueno.test.ts',
  'src/__tests__/admin-no-acepta-cookie-revocada.test.ts',
  'src/__tests__/una-sesion-vieja-se-corta.test.ts',
  'src/__tests__/auth-user-session.test.ts',
  'src/__tests__/la-carga-historica-no-duplica.test.ts',
  'src/__tests__/las-plantillas-de-decoracion-se-publican-solas.test.ts',
  'src/__tests__/decoracion-catalogo.test.ts',
  'src/__tests__/decoracion-catalogo-photo.test.ts',
  'src/__tests__/decoracion-catalogo-ui.test.tsx',
  'src/__tests__/decoracion-no-gasta-de-mas.test.ts',
] : [
  'src/__tests__/un-solo-numero-de-plata.test.ts',
  'src/__tests__/faq-ajuste-anual-coincide-con-contrato.test.ts',
]);
const started = new Date().toISOString();
const filter = login ? ['--testNamePattern', 'login version|cookie revocada'] : decor ? ['--testNamePattern', 'Codex763'] : [];
const result = spawnSync(process.execPath, ['--max-old-space-size=1024', path.join(qa, 'node_modules/jest/bin/jest.js'), '--runInBand', '--no-cache', '--json', '--outputFile', path.join(evidence, `${prefix}-jest.json`), '--runTestsByPath', ...suites, ...filter], { cwd: qa, env, encoding: 'utf8', timeout: 240000, maxBuffer: 16 * 1024 * 1024 });
fs.writeFileSync(path.join(evidence, `${prefix}-jest.log`), `${result.stdout ?? ''}\n${result.stderr ?? ''}`);
const receipt = { source: expected, sourceTree: git('rev-parse', 'HEAD:src'), started, finished: new Date().toISOString(), exit: result.status, signal: result.signal, error: result.error?.message ?? null, suites, filter, originalProbes: copies.map(([source, target]) => ({ source, target, sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(evidence, source))).digest('hex') })), diffApp: git('diff', '--stat', '--', 'src', 'package.json', 'package-lock.json', 'next.config.js'), limits: 'Acciones y motor reales con datos, autorizacion, persistencia y terceros controlados. No SDK, navegador, proveedores reales, build nuevo ni certificado legal/despliegue. Dependencias reutilizadas, no npm ci limpio. La sonda737 conserva literal historico de fuente en su observacion; fuente ejecutada efectiva es este recibo.' };
fs.writeFileSync(path.join(evidence, `${prefix}-corrida.json`), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify(receipt));
if (fs.existsSync(path.join(evidence, `${prefix}-jest.json`))) { const j = JSON.parse(fs.readFileSync(path.join(evidence, `${prefix}-jest.json`), 'utf8')); console.log(JSON.stringify({ suites: j.numTotalTestSuites, pass: j.numPassedTests, fail: j.numFailedTests, pending: j.numPendingTests, results: j.testResults.map(s => ({ name: path.basename(s.name), status: s.status, failures: s.assertionResults.filter(t => t.status !== 'passed').map(t => ({ title: t.fullName, status: t.status, messages: t.failureMessages })) })) })); }
process.exitCode = result.status ?? 1;
