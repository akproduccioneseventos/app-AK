import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sha = 'b8491bda3f25aadc71f36f42d5878a47261bb1bf';
const sourcePath = 'src/app/(app)/fiestas/nueva/invitados/checkin-scanner/page.tsx';
const here = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(here, '149-checkin-cola.json');
const report = {
  targetSha: sha,
  sourcePath,
  status: 'NOT_RUN',
  extraction: null,
  cases: [],
  note: 'Sonda pura. No app, build, Jest, navegador, red ni credenciales.',
};

function saveReport() {
  // Never replace prior evidence, including evidence from a partial run.
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function assertEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, observed ${JSON.stringify(actual)}`);
  }
}

async function main() {
  const freeMiB = Math.floor(os.freemem() / 1048576);
  if (freeMiB < 256) {
    report.status = 'BLOCKED_LOW_MEMORY';
    report.memory = { freeMiB, requiredMiB: 256 };
    saveReport();
    return;
  }
  report.memory = { freeMiB, requiredMiB: 256 };

  const dependencyPackage = 'C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json';
  const require = createRequire(dependencyPackage);
  let ts;
  try {
    ts = require('typescript');
  } catch (error) {
    report.status = 'BLOCKED_TYPESCRIPT_PARSER_UNAVAILABLE';
    report.parserError = String(error?.message ?? error);
    saveReport();
    return;
  }

  const source = execFileSync('git', ['show', `${sha}:${sourcePath}`], {
    cwd: path.resolve(here, '../..'), encoding: 'utf8', maxBuffer: 2 * 1024 * 1024,
  });
  const sourceHash = (await import('node:crypto')).createHash('sha256').update(source).digest('hex');
  const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let callback;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'sincronizarCola' &&
        node.initializer && ts.isCallExpression(node.initializer) &&
        node.initializer.arguments.length && ts.isArrowFunction(node.initializer.arguments[0])) {
      callback = node.initializer.arguments[0];
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  if (!callback) throw new Error('TypeScript AST did not find sincronizarCola callback');

  const extracted = callback.getText(ast);
  const compiled = ts.transpileModule(`module.exports = (${extracted});`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  report.extraction = {
    sha256: sourceHash,
    symbol: 'CheckinScannerContent/sincronizarCola',
    sourceLines: [source.slice(0, callback.pos).split('\n').length,
      source.slice(0, callback.end).split('\n').length],
    parser: `TypeScript ${ts.version}`,
    method: 'git show SHA:path -> TypeScript AST variable initializer -> transpileModule',
  };

  const serverPath = 'src/app/actions/fiesta/invitados.actions.ts';
  const serverSource = execFileSync('git', ['show', `${sha}:${serverPath}`], {
    cwd: path.resolve(here, '../..'), encoding: 'utf8', maxBuffer: 2 * 1024 * 1024,
  });
  const serverAst = ts.createSourceFile(serverPath, serverSource, ts.ScriptTarget.Latest, true);
  let checkInServer;
  function findServerFunction(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'checkInGuest') checkInServer = node;
    ts.forEachChild(node, findServerFunction);
  }
  findServerFunction(serverAst);
  if (!checkInServer) throw new Error('TypeScript AST did not find server checkInGuest');
  const serverBody = checkInServer.getText(serverAst);
  const alreadyCheckedIn = serverBody.match(/if\s*\(inv\.checkedIn\)\s*\{\s*invitadoActualizado\s*=\s*inv;\s*return\s+inv;\s*\}/);
  report.serverContract = {
    path: serverPath,
    sha256: (await import('node:crypto')).createHash('sha256').update(serverSource).digest('hex'),
    symbol: 'checkInGuest',
    sourceLines: [serverSource.slice(0, checkInServer.pos).split('\n').length,
      serverSource.slice(0, checkInServer.end).split('\n').length],
    repeatedCheckinReturnsExistingGuest: Boolean(alreadyCheckedIn),
    implication: 'Repeated requests are possible; this branch does not create a second checked-in guest record.',
  };

  const fiestaId = 'fixture-fiesta';
  const key = `ak_checkin_pendientes_${fiestaId}`;
  const itemA = { guestId: 'A', token: null, escaneadoEn: '2026-10-19T12:00:00.000Z' };
  const itemB = { guestId: 'B', token: null, escaneadoEn: '2026-10-19T12:01:00.000Z' };

  async function runScenario(initial, actionPlan, duringWait) {
    let serialized = JSON.stringify(initial);
    const writes = [];
    const requests = [];
    const localStorage = {
      getItem(name) { return name === key ? serialized : null; },
      setItem(name, value) {
        if (name !== key) throw new Error(`unexpected localStorage key ${name}`);
        serialized = value;
        writes.push(JSON.parse(value));
      },
    };
    const deps = {
      fiestaId,
      window: {},
      localStorage,
      setPendientesCount() {},
      getColaPendientes() {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : [];
      },
      guardarColaPendientes(queue) { localStorage.setItem(key, JSON.stringify(queue)); },
      checkInGuestFiestaActual: async (...args) => {
        requests.push(args);
        return actionPlan(requests.length, args);
      },
    };
    const fn = new Function('deps', `with (deps) { return (${compiled.replace('module.exports = ', '').replace(/;\s*$/, '')}); }`)(deps);
    const syncing = fn();
    await Promise.resolve();
    if (duringWait) await duringWait({ localStorage, key, writes, requests });
    await syncing;
    return { finalQueue: JSON.parse(serialized), writes, requests };
  }

  const control = await runScenario([itemA], async () => ({ success: true }));
  assertEqual(control.finalQueue, [], 'sequential acknowledged control final queue');
  report.cases.push({ name: 'single_sync_ack_control', expected: [], observed: control.finalQueue,
    requests: control.requests.length, pass: true });

  const gate = deferred();
  const loss = await runScenario([itemA], () => gate.promise, async ({ localStorage }) => {
    // Model the actual enqueue result of processCheckIn while the extracted sync callback awaits.
    const current = JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify([...current, itemB]));
    gate.resolve({ success: true });
  });
  const lossObserved = loss.finalQueue.map(item => item.guestId);
  const lossExpected = ['B'];
  report.cases.push({ name: 'new_entry_added_during_await', expected: lossExpected,
    observed: lossObserved, lostEntryIds: ['B'].filter(id => !lossObserved.includes(id)),
    requests: loss.requests.length, pass: JSON.stringify(lossExpected) === JSON.stringify(lossObserved) });

  const ackGate = deferred();
  let serverCheckedIn = false;
  const ackLost = await runScenario([itemA], async (attempt) => {
    serverCheckedIn = true;
    if (attempt === 1) return ackGate.promise;
    return { success: true };
  }, async () => {
    // Simulate server commit followed by a lost response; offline retry retains the queue item.
    ackGate.reject(new Error('simulated lost acknowledgement'));
  }).catch(error => ({ error: String(error?.message ?? error) }));
  report.cases.push({ name: 'ack_lost_one_attempt', expected: { serverCheckedIn: true, queuedIds: ['A'], requests: 1 },
    observed: { serverCheckedIn, queuedIds: ackLost.finalQueue?.map(item => item.guestId), requests: ackLost.requests?.length,
      harnessError: ackLost.error }, pass: serverCheckedIn && ackLost.finalQueue?.length === 1 && ackLost.requests?.length === 1 });

  report.status = report.cases.every(test => test.pass) ? 'PASS' : 'FAIL';
  report.summary = 'FAIL means an observed local queue invariant violation only; request retries do not establish duplicate server entries.';
  saveReport();
}

main().catch(error => {
  report.status = 'HARNESS_ERROR';
  report.error = String(error?.stack ?? error);
  try { saveReport(); } catch (writeError) { process.stderr.write(`Evidence not overwritten: ${writeError.message}\n`); }
  process.exitCode = 1;
});
