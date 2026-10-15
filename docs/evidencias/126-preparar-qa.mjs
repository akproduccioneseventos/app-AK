import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

// Reuse the accepted harness without overwriting its historical evidence.
const source = 'b520f7cee28546634e1c87391efd7a80e1a40f48';
const build = JSON.parse(fs.readFileSync('docs/evidencias/125-build-execution.json'));
if (build.sha !== source || build.exitCode !== 0) throw Error('Accepted build required');
const changed = execFileSync('git', ['diff', '--name-only', source, 'HEAD'], {encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
if (changed.some(f => !/^(docs\/|tests\/|src\/__tests__\/|ESTADO-ACTUAL\.md$|AGENTS\.md$)/.test(f))) throw Error('App source changed');
const files = [];
for (const name of ['ejecutar.mjs', 'fixtures.mjs', 'proveedor-doble.mjs', 'detener-entorno.ps1']) {
  const from = `docs/evidencias/125-${name}`, to = `docs/evidencias/126-${name}`;
  if (fs.existsSync(to)) throw Error(`Refusing to replace ${to}`);
  const original = fs.readFileSync(from, 'utf8');
  let output = original.replaceAll('125-', '126-').replaceAll('qa125', 'qa126').replaceAll('QA125', 'QA126');
  if (name === 'ejecutar.mjs') {
    output = output.replaceAll('126-build-execution.json', '125-build-execution.json')
      .replaceAll('126-java21-local.json', '125-java21-local.json')
      .replace("['types', 'lint', 'unit', 'jest', 'acentos', 'build', 'emulator', 'rules', 'start', 'probe'].includes(mode)", "['emulator', 'start', 'probe'].includes(mode)");
  }
  fs.writeFileSync(to, output);
  const hash = text => crypto.createHash('sha256').update(text).digest('hex');
  files.push({from, to, inputSha256:hash(original), outputSha256:hash(output)});
}
fs.writeFileSync('docs/evidencias/126-harness-procedencia.json', JSON.stringify({applicationSourceSha:source, buildReused:true, applicationEdited:false, files}, null, 2)+'\n');
console.log(JSON.stringify({applicationSourceSha:source, generated:files.map(x=>x.to), buildReused:true}));
