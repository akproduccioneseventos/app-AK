import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const repo = 'C:/Users/Usuario/.gemini/antigravity/scratch/app-AK';
const base = '7230f9d02b32805952a185f704a0208bd5d643e6';
const candidate = '17d26a631f500a263c48c4973d9c6f57d56ba421';
const git = (...args) => {
  const result = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
};
const files = ['src/lib/auth/perfiles.ts', 'src/app/(app)/contabilidad/crm/agenda/page.tsx',
  'src/app/(app)/empresa/servicios/page.tsx'];
const consumers = files.map((file) => ({ file, baseBlob: git('rev-parse', `${base}:${file}`),
  candidateBlob: git('rev-parse', `${candidate}:${file}`) }));
for (const item of consumers) assert.equal(item.baseBlob, item.candidateBlob);
const cssFile = 'src/app/globals.css';
const cssBefore = git('show', `${base}:${cssFile}`);
const cssAfter = git('show', `${candidate}:${cssFile}`);
assert.notEqual(cssBefore, cssAfter);
assert.match(cssAfter, /header:not\(\.cabecera-documento\)/);
const output = { base, candidate, pr: 1327, consumers,
  printHeader: { file: cssFile, baseBlob: git('rev-parse', `${base}:${cssFile}`),
    candidateBlob: git('rev-parse', `${candidate}:${cssFile}`),
    status: 'Correction present in source; native test on candidate NOT executed' },
  limits: ['Committed Git objects only; dirty Gemini files untouched',
    'No transitive equivalence or whole PR approval', 'Claude private current HEAD NOT CONTRASTADO'],
  helper: { model: 'gpt-6-luna', reasoning: 'low', task: 'Bounded read-only consumer comparison', closed: true } };
fs.writeFileSync(new URL('141-contraste.json', import.meta.url), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ candidate, unchangedConsumers: consumers.length, printHeader: output.printHeader.status }));
