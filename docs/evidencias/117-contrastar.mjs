import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const raw = read('docs/evidencias/117-configurador-antes-arreglo.json');
const build = read('docs/evidencias/116-build-execution.json');
if (raw.applicationSourceSha !== build.sha || build.exitCode !== 0) throw new Error('Source/build mismatch');
// Reconstruye el informe HISTORICO: no certifica la app actual si cambio la fuente.
const stopped = read('docs/evidencias/117-entorno-detenido-antes-arreglo.json');
const sdk = read('docs/evidencias/117-limpieza-sdk-antes-arreglo.json');
if (!raw.cleanup.bytesRestored || sdk.total !== 0 || stopped.listeners.length !== 0 || stopped.stopped.length !== 2) throw new Error('QA cleanup incomplete');
const suiteFile = 'docs/evidencias/116-jest.json';
const jest = JSON.parse(fs.existsSync(suiteFile) ? fs.readFileSync(suiteFile) : zlib.gunzipSync(fs.readFileSync(suiteFile + '.gz')));
const suite = jest.testResults.find(s => s.name.endsWith('los-documentos-de-plata-piden-permiso.test.ts'));
if (suite?.status !== 'passed' || suite.assertionResults.length !== 51 || suite.assertionResults.some(t => t.status !== 'passed')) throw new Error('Permission evidence absent');
const summary = {
  applicationSourceSha: build.sha,
  evidenceHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  outcome: 'NEW_DEFECT_NOT_CORRECTED', privateClaude: 'NO_CONTRASTADO',
  results: raw.results.map(r => ({ viewport: r.viewport, name: r.name,
    status: r.details?.fullyUncovered === false ? 'FRICTION_EXISTING_152' : r.status,
    details: r.details, error: r.error })),
  lostAck: ['desktop','mobile'].map(viewport => ({ viewport, ...read(`docs/evidencias/117-ack-antes-arreglo-${viewport}.json`) })),
  reuse155: { source: build.sha, suite: 'src/__tests__/los-documentos-de-plata-piden-permiso.test.ts', passed: 51, providerMocked: true, realProviderCertified: false },
  cleanup: { bytesRestored: true, ownSdkDocuments: 0, listeners: [], servicesStopped: 2 },
  rawResultSha256: crypto.createHash('sha256').update(fs.readFileSync('docs/evidencias/117-configurador-antes-arreglo.json')).digest('hex'),
  originalTimeoutPreserved: 'docs/evidencias/117-configurador-inicial.json', historicalOnly: true,
};
if (summary.lostAck.some(r => r.before !== 2 || r.after !== 3 || r.expected !== 2)) throw new Error('Actual ACK defect not reproduced as reported');
fs.writeFileSync('docs/evidencias/117-contraste.json', JSON.stringify(summary, null, 2)+'\n');
console.log(JSON.stringify({ outcome: summary.outcome, source: build.sha, lostAck: summary.lostAck, reusedPermissionTests: 51, cleanup: summary.cleanup }));
