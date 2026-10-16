import fs from 'node:fs';
const result = { started: new Date().toISOString(), method: 'GET', url: 'https://akproducciones.uy/api/health',
  scope: 'Public health only, no authentication, provider calls, accounts, messages or charges. Flags are configuration indicators, not proof of integrations.' };
try {
  const start = Date.now();
  const r = await fetch(result.url, { signal: AbortSignal.timeout(20_000), redirect: 'error' });
  result.status = r.status; result.elapsedMs = Date.now() - start;
  const body = await r.json();
  result.health = { status: body.status, timestamp: body.timestamp, version: body.version, services: body.services };
} catch (e) { result.error = String(e); }
fs.writeFileSync(new URL('./139-public-status.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
