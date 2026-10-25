import fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const repo = new URL('../../', import.meta.url);
const run = (...args) => {
  const result = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
};
const executed = '17d26a631f500a263c48c4973d9c6f57d56ba421';
const latest = 'a98a4b25009f9994d7a9cbd3025972a4142634c2';
const changes = run('diff', '--name-only', executed, latest).split('\n').filter(Boolean);
assert.equal(changes.length, 4);
assert.ok(changes.every((file) => file.startsWith('tests/e2e/')));
const output = { executed, latestObservedPR1327: latest, changedFiles: changes,
  runtimeChanges: [], wholePRApproved: false, privateClaude: 'NO CONTRASTADO',
  interpretation: 'Same committed runtime/config/dependencies, only4QA files changed. Reuse targeted runtime evidence, not whole-app acceptance.' };
fs.writeFileSync(new URL('142-contraste-final.json', import.meta.url), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ runtimeChanges: 0, changedQA: changes.length }));
