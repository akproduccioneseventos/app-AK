// Audit harness only: target source is read, while each probe replaces external IO.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');

const target = path.resolve(process.argv[2] || '.');
const typescript = process.argv[3];
if (!typescript) throw new Error('Usage: node contrastar-sondas.cjs <checkout> <typescript module>');
const git = args => cp.execFileSync('git', ['-C', target, ...args], { encoding: 'utf8' }).trim();
const sha = git(['rev-parse', 'HEAD']);
if (git(['status', '--porcelain'])) throw new Error('Target must be clean to associate evidence with its SHA');
const results = [];
for (const file of ['51-sondas-planificacion.cjs', '52-sondas-decoracion-3d.cjs', '54-sondas-portal-cliente.cjs']) {
  const probePath = path.join(__dirname, file);
  const code = fs.readFileSync(probePath, 'utf8');
  const runner = `process.argv[2]=${JSON.stringify(typescript)};
    new Function('require','__dirname','process','console',${JSON.stringify(code)})
      (require,${JSON.stringify(path.join(target, 'docs/evidencias'))},process,console);`;
  const child = cp.spawnSync(process.execPath, ['-e', runner], { encoding: 'utf8', timeout: 30000 });
  let checks;
  try { checks = JSON.parse(child.stdout); } catch { checks = null; }
  results.push({ file, probeSha256: crypto.createHash('sha256').update(code).digest('hex'),
    exit: child.status, checks, error: child.error?.message || child.stderr || null });
}
if (git(['rev-parse', 'HEAD']) !== sha || git(['status', '--porcelain'])) {
  throw new Error('Target changed during probes; evidence invalid');
}
console.log(JSON.stringify({ targetSha: sha, node: process.version, results }, null, 2));
process.exitCode = results.some(result => result.exit !== 0) ? 1 : 0;
