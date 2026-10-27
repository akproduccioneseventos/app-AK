const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const qa = process.argv[2];
if (!qa || !path.basename(qa).startsWith('ak-qa-725-contabilidad-')) throw Error('QA aislado requerido');
const manifest = JSON.parse(fs.readFileSync(path.join(qa, 'source-manifest.json'), 'utf8'));
const hash = b => crypto.createHash('sha1').update(`blob ${Buffer.byteLength(b)}\0`).update(b).digest('hex');
function verify() {
  const bad = manifest.files.filter(f => {
    const target = path.join(qa, f.path);
    if (!fs.existsSync(target)) return true;
    const bytes = fs.readFileSync(target);
    return hash(bytes) !== f.sha && hash(bytes.toString('utf8').replace(/\r\n/g, '\n')) !== f.sha;
  });
  if (bad.length) throw Error(`Fuente mezclada: ${bad.map(x => x.path).join(',')}`);
  return { source: manifest.source, matched: manifest.files.length, normalized: 'SoloCRLF->LF' };
}
let suites = [
  'src/__tests__/la-comparativa-descuenta-la-comision.test.ts',
  'src/__tests__/comparativa-ganancias.test.ts',
  'src/__tests__/el-total-cobrado-del-personal-no-miente.test.ts',
  'src/__tests__/el-recibo-y-el-contrato-no-corren-la-fecha.test.ts',
  'src/__tests__/contrato-recibo-parcial-aviso.test.ts',
  'src/__tests__/reponer-plata-identidad-proveedor.test.ts',
  'src/__tests__/flujo-caja-dia-calendario-uruguay.test.ts',
  'src/__tests__/el-flujo-de-caja-no-muestra-ceros-falsos.test.ts',
  'src/__tests__/poner-al-dia-arma-la-lista.test.ts',
  'src/__tests__/poner-al-dia-aplica-solo-lo-que-arma-el-servidor.test.ts',
  'src/__tests__/resumen-contador.test.ts',
  'src/__tests__/payment-notification-transitions.test.ts',
  'src/__tests__/la-contabilidad-no-se-pisa-ni-inventa-importes.test.ts',
  'src/__tests__/auditoria-70-contabilidad.test.ts',
  'src/__tests__/recordatorios-de-pago.test.ts',
  'src/__tests__/reportes-compartir-seguro.test.tsx',
  'src/__tests__/reporte-evento-error-reintento.test.tsx',
  'src/__tests__/el-ajuste-de-costos-no-miente.test.ts',
  'src/__tests__/ajustes-costos-respaldo-restauracion.test.ts',
  'src/__tests__/el-reporte-y-las-invitaciones-no-mienten.test.ts',
  'src/lib/payments/mercadopago-core.test.ts',
  'src/lib/payments/deposit-payment.test.ts',
  'src/lib/invoice-money.test.ts',
  'src/lib/budget/recibo-contrato-ajuste.test.ts',
  'src/lib/simulator/payment-plan.test.ts',
];
const correctedProbes = process.argv[3] === 'sondas-correctas';
const probes = process.argv[3] === 'sondas' || correctedProbes;
if (probes) suites = [correctedProbes ? 'src/__tests__/qa-732-contabilidad-consumidores.test.ts' : 'src/__tests__/qa-730-contabilidad-consumidores.test.ts'];
const isolatedBase = process.argv[3] === 'perfil-base-aislado';
const baseProfile = process.argv[3] === 'perfil-base' || isolatedBase;
if (baseProfile) suites = [
  'src/__tests__/auditoria-70-contabilidad.test.ts',
  'src/__tests__/el-ajuste-de-costos-no-miente.test.ts',
];
const contracts = process.argv[3] === 'contratos';
if (contracts) suites = [
  'src/__tests__/contrato-constancia-version-y-permisos.test.ts',
  'src/__tests__/contrato-guardado-no-cambia-texto-firmado-en-medio.test.ts',
  'src/__tests__/la-firma-digital-no-da-nada-por-aceptado.test.ts',
  'src/__tests__/sin-saber-si-el-contrato-esta-firmado-no-se-toca.test.ts',
  'src/__tests__/el-contrato-de-la-app-es-el-revisado.test.ts',
  'src/__tests__/el-contrato-no-pierde-la-hora-del-evento.test.ts',
  'src/__tests__/contrato-fecha-portal-dia-civil.test.tsx',
  'src/__tests__/las-preguntas-del-contrato-llegan.test.ts',
  'src/__tests__/marcadores-contrato.test.ts',
  'src/__tests__/la-privacidad-dice-la-ley-y-la-verdad.test.ts',
  'src/__tests__/privacidad-llega-al-visitante.test.ts',
  'src/__tests__/estetica-portal-contract.test.ts',
  'src/__tests__/doble-toque-en-presupuestos-no-duplica-ni-baja-contratos.test.ts',
];
const contractFAQ = process.argv[3] === 'contrato-faq';
if (contractFAQ) suites = ['src/__tests__/qa-737-ajuste-contrato-faq.test.ts'];
const prefix = contractFAQ ? '737-contrato-faq' : contracts ? '736-contratos' : correctedProbes ? '732-contabilidad' : probes ? '730-contabilidad' : isolatedBase ? '734-contabilidad' : baseProfile ? '731-contabilidad' : '729-contabilidad';
const env = {};
for (const key of ['SystemRoot', 'WINDIR', 'PATH', 'TEMP', 'TMP', 'COMSPEC', 'PATHEXT']) if (process.env[key]) env[key] = process.env[key];
Object.assign(env, {
  NODE_ENV: 'test', TZ: 'America/Montevideo', HOME: qa, USERPROFILE: qa,
  AK_USE_LOCAL_JSON_ONLY: 'true', GOOGLE_CLOUD_PROJECT: 'demo-ak-729', GCLOUD_PROJECT: 'demo-ak-729',
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:9', NODE_OPTIONS: `--require=${path.join(__dirname, '725-sin-egreso.cjs')}`,
  AK_QA_EVIDENCE_OUT: path.join(__dirname, contractFAQ ? '737-contrato-faq-observaciones.json' : `${correctedProbes ? '732' : '730'}-contabilidad-observaciones.json`),
});
// Estas dos suites proveen su propia base atomica de mentira, no el modo JSON.
if (baseProfile) delete env.AK_USE_LOCAL_JSON_ONLY;
const before = verify();
const started = new Date().toISOString();
const r = spawnSync(process.execPath, [
  '--max-old-space-size=768', path.join(qa, 'node_modules/jest/bin/jest.js'), '--runInBand', '--silent',
  ...(isolatedBase ? ['--setupFilesAfterEnv', path.join(qa, 'jest.setup.js'), path.join(__dirname, '734-base-sin-proveedor.setup.cjs')] : []),
  '--json', `--outputFile=${path.join(__dirname, `${prefix}-originales.json`)}`, '--runTestsByPath', ...suites,
], { cwd: qa, env, encoding: 'utf8', timeout: 360000, maxBuffer: 8 * 1024 * 1024 });
fs.writeFileSync(path.join(__dirname, `${prefix}-originales.log`), (r.stdout || '') + (r.stderr || ''));
const after = verify();
const report = { started, finished: new Date().toISOString(), before, after, suites, exit: r.status, signal: r.signal, error: r.error?.message || null,
  limits: 'Focales con fronteras controladas; no SDK/HTTP/proveedor/cuentas reales ni nueva compilacion; no repite25suites725' };
fs.writeFileSync(path.join(__dirname, `${prefix}-corrida.json`), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
process.exitCode = r.status ?? 1;
