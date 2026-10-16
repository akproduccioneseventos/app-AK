import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import net from 'node:net';
import { gzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dir = path.join(root, 'docs/evidencias');
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const read = (name) => fs.readFileSync(path.join(dir, name));
const json = (name) => JSON.parse(read(name));
const write = (name, value) => fs.writeFileSync(path.join(dir, name), JSON.stringify(value, null, 2) + '\n');
for (const port of [3300, 8085]) {
  const available = await new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    socket.setTimeout(1000);
    socket.on('connect', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => resolve(true));
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
  });
  if (!available) throw new Error(`Runtime still listening on ${port}`);
}
const execution = json('137-execution.json');
const result = json('137-results.json');
const specs = [];
function walk(suite) {
  specs.push(...(suite.specs || []));
  for (const child of suite.suites || []) walk(child);
}
walk(result);
if (execution.source !== '7230f9d02b32805952a185f704a0208bd5d643e6' || execution.exitCode !== 1 || specs.length !== 2) throw new Error('Unexpected evidence');
const checks = specs.map((spec) => {
  const run = spec.tests[0].results[0];
  const attachments = run.attachments || [];
  const stored = attachments.filter((a) => /store-/.test(a.name)).map((a) => ({ name: a.name, value: JSON.parse(Buffer.from(a.body, 'base64').toString()) }));
  const final = attachments.find((a) => a.name === 'estado-final.txt');
  const text = final ? Buffer.from(final.body, 'base64').toString() : '';
  const screen = attachments.find((a) => a.name === 'salon.png');
  if (screen) fs.writeFileSync(path.join(dir, '137-salon-recarga.png'), Buffer.from(screen.body, 'base64'));
  return {
    title: spec.title, runnerStatus: run.status, durationMs: run.duration,
    error: run.error?.message?.replace(/\u001b\[[0-9;]*m/g, '').slice(0, 1100),
    storeChecks: stored,
    storeStable: stored.length === 2 && JSON.stringify(stored[0].value) === JSON.stringify(stored[1].value),
    finalTextSha256: sha(text), finalText: text.slice(-4500),
  };
});
const archives = [];
for (const name of ['137-results-inicial.json', '137-execution-inicial.json', '137-inicial.log',
  '137-runtime-emulator.log', '137-runtime-serve.log', '137-results.json', '137.log',
  '136-sdk-emulator.log', '136-sdk-serve.log']) {
  const bytes = read(name);
  const output = name.startsWith('136-sdk-') ? name.replace('136-sdk-', '137-diagnostico-') + '.gz' : name + '.gz';
  fs.writeFileSync(path.join(dir, output), gzipSync(bytes));
  archives.push({ original: name, archive: output, sha256: sha(bytes), bytes: bytes.length });
}
for (const mode of ['emulator', 'serve']) {
  fs.copyFileSync(path.join(dir, `136-sdk-${mode}-execution.json`), path.join(dir, `137-diagnostico-${mode}-execution.json`));
}
const restored = [];
for (const name of ['135-entorno.json', '136-sdk-emulator-execution.json', '136-sdk-serve-execution.json']) {
  const rel = `docs/evidencias/${name}`;
  const old = spawnSync('git', ['show', `HEAD:${rel}`], { cwd: root });
  if (old.status !== 0) throw new Error(`No historical receipt: ${name}`);
  if (name === '135-entorno.json') {
    const current = json(name); const previous = JSON.parse(old.stdout);
    for (const key of ['serverPid', 'serverStartedAt', 'serverStoppedAt']) { delete current[key]; delete previous[key]; }
    if (JSON.stringify(current) !== JSON.stringify(previous)) throw new Error('Non-runtime receipt changes');
    write('137-entorno-previo.json', json(name));
  }
  fs.writeFileSync(path.join(dir, name), old.stdout);
  restored.push({ path: rel, sha256: sha(old.stdout) });
}
const qa = json('135-entorno.json').qa;
const difference = spawnSync('git', ['diff', '--name-only'], { cwd: qa, encoding: 'utf8' });
if (difference.status !== 0 || difference.stdout.trim()) throw new Error(`QA source changed: ${difference.stdout}`);
write('137-consolidado.json', {
  source: execution.source, buildFinishedAt: execution.buildFinishedAt, execution,
  stats: result.stats, checks, archives, restored,
  scope: 'Native desktop only. Runner0PASS/2nonPASS. Salon durable+UI reload checkpoints observed; client incomplete. No new application defect established.',
  cleanup: { portsListening: [], sourceDiff: [], emulator: 'in-memory process stopped', ownProcessesStopped: true },
});
console.log(JSON.stringify({ source: execution.source, checks: checks.map(({title,runnerStatus,storeStable}) => ({title,runnerStatus,storeStable})), archives: archives.length, sourceDiff: [] }));
