import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const source = '7230f9d02b32805952a185f704a0208bd5d643e6';
const runtime = JSON.parse(fs.readFileSync('docs/evidencias/136-sdk-serve-execution.json'));
if (runtime.status !== 'running' || runtime.source !== source || runtime.project !== 'demo-ak-producciones' ||
    runtime.emulator !== '127.0.0.1:8085') throw new Error('Requires owned isolated demo runtime');
const base = 'http://127.0.0.1:3300';
const health = await (await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(15000) })).json();
if (!health.version.startsWith(source) || Object.entries(health.services).some(([name, active]) => active && name !== 'firebase')) throw new Error('Source/services gate failed');
const filename = `qa138-absent-${crypto.randomUUID()}.pdf`;
const qa = JSON.parse(fs.readFileSync('docs/evidencias/135-entorno.json')).qa;
if (fs.existsSync(path.join(qa, 'src/data/budgets', filename))) throw new Error('File must not exist');
const cases = [];
for (const perfil of ['inventado','constructor','toString','__proto__']) {
  const user = { email: 'qa138@example.invalid', userId: 'qa138-fiction', role: 'user', perfil };
  const payload = `v1.${Date.now() + 60000}.${crypto.randomUUID()}.${encodeURIComponent(JSON.stringify(user))}`;
  const token = `${payload}.${crypto.createHmac('sha256', 'playwright-session-secret-with-enough-entropy').update(payload).digest('hex')}`;
  const response = await fetch(`${base}/api/budgets/${filename}`, {
    headers: { cookie: `ak_session=${encodeURIComponent(token)}` }, redirect: 'manual', signal: AbortSignal.timeout(15000),
  });
  const body = Buffer.from(await response.arrayBuffer());
  cases.push({ perfil, expected: 404, actual: response.status, pass: response.status === 404,
    bodyBytes: body.length, bodySha256: crypto.createHash('sha256').update(body).digest('hex') });
}
const result = { source, buildFinishedAt: runtime.buildFinishedAt, health, cases,
  pass: cases.filter((row) => row.pass).length, fail: cases.filter((row) => !row.pass).length,
  scope: 'GET only, nonexistent synthetic filename, signed fictitious user. Existing invalid-profile legacy-user policy expects secretary then404, not500. No account changed, login or real file/data read.' };
fs.writeFileSync('docs/evidencias/138-perfiles-http-results.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
if (result.fail) process.exitCode = 1;
