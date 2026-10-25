import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const source = '2e5363f259461a31bf6b31807872c227855415de';
const evidence = process.env.AK_QA_EVIDENCE_DIR;
assert.ok(evidence);
assert.equal(process.env.AK_ENTORNO_AISLADO, 'true');
assert.equal(process.env.AK_USE_LOCAL_JSON_ONLY, 'true');
const target = path.join(evidence, '151-frontera-http.json');
assert.equal(fs.existsSync(target), false, 'Preserve prior receipt');
const base = 'http://127.0.0.1:3300';
const health = await (await fetch(`${base}/api/health`)).json();
assert.ok(health.version?.startsWith(source));
assert.ok(Object.values(health.services).every(v => v === false));
const wanted = new Map([['saveFiesta', new Set()]]);
function scan(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) scan(file);
    else if (entry.name.endsWith('.js')) {
      const text = fs.readFileSync(file, 'utf8');
      if (file.replaceAll('\\', '/').includes('/app/(app)/fiestas/nueva/pagina-web/page-')) {
        for (const match of text.matchAll(/createServerReference\)\("([a-f0-9]+)",[^)]*,"([^"]+)"\)/g)) wanted.get(match[2])?.add(match[1]);
      }
    }
  }
}
scan('.next/static/chunks');
const manifest = JSON.parse(fs.readFileSync('.next/server/server-reference-manifest.json'));
const ids = {};
for (const [name, values] of wanted) {
  assert.equal(values.size, 1, `Compiled action ambiguous: ${name}`);
  ids[name] = [...values][0];
  assert.ok(manifest.node?.[ids[name]] || manifest.edge?.[ids[name]]);
}
const token = perfil => {
  const actor = { email: `qa151.${perfil}@example.invalid`, userId: `qa151-${perfil}`, role: 'admin', perfil };
  const payload = `v1.${Date.now() + 600000}.${crypto.randomUUID()}.${encodeURIComponent(JSON.stringify(actor))}`;
  return `${payload}.${crypto.createHmac('sha256', 'playwright-session-secret-with-enough-entropy').update(payload).digest('hex')}`;
};
function decode(text) {
  const found = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^[0-9a-f]+:(\{.*\}|\[.*\])$/);
    if (m) try { found.push(JSON.parse(m[1])); } catch {}
  }
  return found;
}
const rpc = async (name, args, profile) => {
  const response = await fetch(`${base}/eventos`, { method: 'POST', headers: {
    'Next-Action': ids[name], 'Content-Type': 'text/plain;charset=UTF-8', Origin: base,
    ...(profile ? { Cookie: `ak_session=${encodeURIComponent(token(profile))}` } : {}),
  }, body: JSON.stringify(args), redirect: 'manual', signal: AbortSignal.timeout(60000) });
  const text = await response.text();
  return { status: response.status, text, frames: decode(text) };
};
const cases = [];
const files = [];
try {
  for (const perfil of ['dueno', 'secretaria', 'personal', 'anonymous']) {
    const id = `qa151_${perfil}_${crypto.randomUUID()}`;
    const fixture = { id, configuracion: { nombreEvento: 'QA151 no real', fechaEvento: '2027-08-08' },
      gestionCostos: { total: 9500 }, personalAsignado: [{ empleadoId: 'otro151', rolId: 'dj', eventSalary: 3000 }],
      estadosCompra: [{ proveedorId: 'a151', proveedor: 'QA151', pagado: true, montoPagado: 60.30 }],
      planDePagos: { cuotas: [{ id: 'q151', monto: 1000, pagada: true }] } };
    const paths = ['data', 'src/data'].map(folder => path.join(process.cwd(), folder, 'fiestas', `${id}.json`));
    const seed = Buffer.from(JSON.stringify(fixture, null, 2));
    for (const file of paths) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, seed, { flag: 'wx' }); files.push(file); }
    const input = structuredClone(fixture);
    if (perfil !== 'dueno') {
      delete input.personalAsignado[0].eventSalary;
      delete input.gestionCostos;
    }
    input.invitacionDigital = { titulo: `Edicion QA151 ${perfil}` };
    const saved = await rpc('saveFiesta', [input], perfil === 'anonymous' ? null : perfil);
    const success = saved.frames.some(f => f.success === true);
    const persisted = paths.map(file => ({ file: path.relative(process.cwd(), file), value: JSON.parse(fs.readFileSync(file)) }));
    const changed = persisted.filter(p => p.value.invitacionDigital?.titulo === input.invitacionDigital.titulo);
    const allowed = ['dueno', 'secretaria'].includes(perfil);
    const fieldsPreserved = changed.every(p => p.value.personalAsignado?.[0]?.eventSalary === 3000 && p.value.gestionCostos?.total === 9500);
    const forbiddenOutput = perfil !== 'dueno' && saved.frames.some(f => f.fiesta?.personalAsignado?.some(p => p.eventSalary !== undefined) || f.fiesta?.gestionCostos !== undefined);
    const pass = allowed ? success && changed.length > 0 && fieldsPreserved && !forbiddenOutput : !success && changed.length === 0;
    cases.push({ kind: 'save', perfil, status: saved.status, success, allowed, changedFiles: changed.map(p => p.file),
      fieldsPreserved, forbiddenOutput, salaryAfter: changed.map(p => p.value.personalAsignado?.[0]?.eventSalary ?? null),
      pass, response: saved.text, persisted });
  }
} finally {
  for (const file of files) {
    const resolved = path.resolve(file);
    assert.ok(resolved.startsWith(path.resolve(process.cwd()) + path.sep));
    assert.match(path.basename(resolved), /^qa151_/);
    fs.unlinkSync(resolved);
  }
}
const record = { source, health, ids, cases, summary: { pass: cases.filter(c => c.pass).length, fail: cases.filter(c => !c.pass).length },
  fixturesRemoved: files.every(f => !fs.existsSync(f)),
  scope: 'Actual compiled Next server actions, signed synthetic sessions and local JSON persistence; no function mocks',
  limits: ['Not Firestore SDK atomic path, production, OAuth or real user/data', 'Only full save in these four session cases; not every action or role'] };
fs.writeFileSync(target, JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({ source, summary: record.summary, cases: cases.map(({ kind, perfil, success, pass, salaryAfter }) => ({ kind, perfil, success, pass, salaryAfter })), fixturesRemoved: record.fixturesRemoved }));
if (record.summary.fail) process.exitCode = 1;
