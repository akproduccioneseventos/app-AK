import fs from 'node:fs';
import crypto from 'node:crypto';
import net from 'node:net';
import { gzipSync } from 'node:zlib';
const dir = new URL('./', import.meta.url);
const read = (name) => fs.readFileSync(new URL(name, dir));
const json = (name) => JSON.parse(read(name));
const output = { source: '7230f9d02b32805952a185f704a0208bd5d643e6',
  mode: 'JSON local ficticio, no acepta SDK ni integraciones reales',
  sdkPreflight: json('139-execution.json'), publicStatus: json('139-public-status.json'),
  runs: [], checkpoints: [], archives: [] };
for (const port of [3300, 8085]) {
  await new Promise((resolve, reject) => {
    const s = net.connect({ port, host: '127.0.0.1' });
    s.setTimeout(1000);
    s.on('connect', () => { s.destroy(); reject(new Error(`Runtime still listening: ${port}`)); });
    s.on('error', resolve); s.on('timeout', () => { s.destroy(); reject(new Error(`Cleanup uncertain: ${port}`)); });
  });
}
for (const prefix of ['139-json', '139-json-mobile']) {
  const result = json(`${prefix}-results.json`);
  const execution = json(`${prefix}-execution.json`);
  if (execution.source !== output.source || execution.sourceDiff || !execution.finished) throw new Error('Source/cleanup mismatch');
  output.runs.push({ prefix, stats: result.stats, execution });
  function walk(suite) {
    for (const spec of suite.specs || []) for (const t of spec.tests || []) for (const r of t.results || []) {
      const docs = (r.attachments || []).filter((a) => /store-|diagnostico/.test(a.name)).map((a) => ({ name: a.name,
        value: JSON.parse(Buffer.from(a.body, 'base64').toString()) }));
      const shot = (r.attachments || []).find((a) => a.name === 'cliente-recarga.jpeg');
      const screenshot = shot ? `${prefix}-${t.projectName}-cliente.jpeg` : null;
      if (shot) fs.writeFileSync(new URL(screenshot, dir), Buffer.from(shot.body, 'base64'));
      output.checkpoints.push({ prefix, project: t.projectName, status: r.status, durationMs: r.duration,
        error: r.error?.message?.replace(/\u001b\[[0-9;]*m/g, '').slice(0, 1400), screenshot, docs });
    }
    for (const c of suite.suites || []) walk(c);
  }
  walk(result);
}
for (const name of ['139-json-results.json', '139-json-mobile-results.json']) {
  const bytes = read(name); fs.writeFileSync(new URL(name + '.gz', dir), gzipSync(bytes));
  output.archives.push({ file: name + '.gz', originalSha256: crypto.createHash('sha256').update(bytes).digest('hex') });
}
output.cleanup = { portsListening: [], sourceDiff: '', realDataOrMessages: false };
output.acceptance = {
  desktop: output.checkpoints.find((c) => c.project === 'chromium-desktop')?.status === 'passed',
  mobile: output.checkpoints.find((c) => c.prefix === '139-json-mobile')?.status === 'passed',
  productionSDK: false, profiles180Fixed: false, externalIntegrations: false, originals19: false, physicalHardware: false,
};
fs.writeFileSync(new URL('139-consolidado.json', dir), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify(output.acceptance));
