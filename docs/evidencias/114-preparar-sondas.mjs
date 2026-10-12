import fs from 'node:fs';
for (const [src, dst] of [['112-mantenimiento-fallos.mjs', '114-mantenimiento-fallos.mjs'], ['113-costos-probe.mjs', '114-costos-probe.mjs']]) {
  const old = fs.readFileSync('docs/evidencias/' + src, 'utf8');
  const revised = old.replaceAll('112', '114').replaceAll('113', '114')
    .replaceAll("'60d1fc7d1c0cd726b1d4f0ff53b270f6162d4d7cb0'", 'process.env.QA_MAINTENANCE_ACTION')
    .replaceAll("'7fbfcc131a7fb8bd4c8edc7a63c449b8b71a60d4c9'", 'process.env.QA_COST_ACTION');
  const target = 'docs/evidencias/' + dst;
  if (fs.existsSync(target)) throw new Error('Evidence already exists');
  fs.writeFileSync(target, revised);
}
