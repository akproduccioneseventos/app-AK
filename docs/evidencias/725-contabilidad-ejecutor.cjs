const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const qa = process.argv[2];
if (!qa || !path.basename(qa).startsWith('ak-qa-725-contabilidad-')) throw Error('QA aislado requerido');
const manifest = JSON.parse(fs.readFileSync(path.join(qa, 'source-manifest.json'), 'utf8'));
const hash = b => crypto.createHash('sha1').update(`blob ${Buffer.byteLength(b)}\0`).update(b).digest('hex');
function verify() {
  const bad = [];
  for (const f of manifest.files) {
    const target = path.join(qa, f.path);
    if (!fs.existsSync(target)) { bad.push(f.path); continue; }
    const raw = fs.readFileSync(target);
    if (hash(raw) !== f.sha && hash(raw.toString('utf8').replace(/\r\n/g, '\n')) !== f.sha) bad.push(f.path);
  }
  if (bad.length) throw Error(`Fuente mezclada: ${bad.join(', ')}`);
  return { source: manifest.source, matched: manifest.files.length, normalization: 'CRLF->LF solamente' };
}
let suites = [
  'financial-guardrails', 'financial-integrity-report', 'financial-flow-consistency',
  'payment-summary', 'plan-de-pagos-cuentas-que-cierran', 'dos-cuotas-a-la-vez-no-se-pisan',
  'dos-cobros-a-la-vez-no-se-pisan', 'invoice-payment-integrity', 'invoice-deletion-integrity',
  'los-cobros-de-factura-no-se-duplican-ni-pasan-la-tolerancia',
  'un-pago-a-proveedor-reintentado-no-se-duplica', 'un-reintento-no-duplica-plata',
  'una-sena-de-contrato-es-una-por-presupuesto', 'pago-aprobado-no-vuelve-pendiente-por-reintento',
  'una-factura-no-se-cobra-de-mas-entre-servidores', 'costos-precision-reporte',
  'motor-de-costos-la-cuenta-real', 'ganancia-evento', 'la-ganancia-descuenta-la-comision-de-mercado-pago',
  'la-ganancia-da-lo-mismo-en-finanzas-analiticas-y-flujo', 'el-resumen-del-contador-cuadra',
  'recibos-del-personal-suman-y-se-reemplazan', 'ajuste-costos-recibo-atomico',
  'un-pago-a-confirmar-no-cuenta-como-cobrado', 'cobros-1254-no-dan-exitos-falsos',
].map(n => `src/__tests__/${n}.test.ts`);
const probes = process.argv[3] === 'sondas';
if (probes) suites = ['src/__tests__/qa-726-contabilidad.test.ts'];
const adapted = process.argv[3] === 'adaptadas';
if (adapted) suites = [
  'src/__tests__/qa-727-dos-cobros-a-la-vez-no-se-pisan.test.ts',
  'src/__tests__/qa-727-una-sena-de-contrato-es-una-por-presupuesto.test.ts',
];
const prefix = probes ? '726-contabilidad' : adapted ? '727-contabilidad' : '725-contabilidad';
const env = {};
for (const key of ['SystemRoot', 'WINDIR', 'PATH', 'TEMP', 'TMP', 'COMSPEC', 'PATHEXT']) {
  if (process.env[key]) env[key] = process.env[key];
}
Object.assign(env, {
  NODE_ENV: 'test', TZ: 'America/Montevideo', HOME: qa, USERPROFILE: qa,
  AK_USE_LOCAL_JSON_ONLY: 'true', GOOGLE_CLOUD_PROJECT: 'demo-ak-725',
  GCLOUD_PROJECT: 'demo-ak-725', FIRESTORE_EMULATOR_HOST: '127.0.0.1:9',
  NODE_OPTIONS: `--require=${path.join(__dirname, '725-sin-egreso.cjs')}`,
  AK_QA_EVIDENCE_OUT: path.join(__dirname, '726-contabilidad-observaciones.json'),
});
const before = verify();
const jsonFile = path.join(__dirname, `${prefix}-originales.json`);
const started = new Date().toISOString();
const r = spawnSync(process.execPath, [
  '--max-old-space-size=768', path.join(qa, 'node_modules/jest/bin/jest.js'),
  '--runInBand', '--silent', '--json', `--outputFile=${jsonFile}`, '--runTestsByPath', ...suites,
], { cwd: qa, env, encoding: 'utf8', timeout: 360000, maxBuffer: 8 * 1024 * 1024 });
fs.writeFileSync(path.join(__dirname, `${prefix}-originales.log`), (r.stdout || '') + (r.stderr || ''));
const after = verify();
const report = {
  started, finished: new Date().toISOString(), before, after, suites,
  exit: r.status, signal: r.signal, error: r.error?.message || null,
  limits: 'Jest focal con fronteras controladas; no SDK, HTTP nativo, proveedor ni cuentas reales; dependencias reutilizadas',
};
fs.writeFileSync(path.join(__dirname, `${prefix}-corrida.json`), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
process.exitCode = r.status ?? 1;
