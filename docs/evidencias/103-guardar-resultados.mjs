import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const name = process.argv[2];
if (!/^10[3456]-[a-z0-9-]+$/.test(name)) throw new Error('Own103/104/105/106 evidence only');
const root = path.resolve('docs/evidencias'), raw = JSON.parse(fs.readFileSync(path.join(root, name + '.json'), 'utf8'));
const artifactDir = name.slice(0, 3) + '-artifactos';
const sourceSha = /^10[56]-/.test(name) ? process.argv[3] : name.startsWith('104-') ? 'a6d2086109e0e1a113307fde23674471f62bc377' : '4c4656d3fb497f00297725059fda5227e979779b';
if (!/^[a-f0-9]{40}$/.test(sourceSha ?? '')) throw new Error('Exact source SHA required');
execFileSync('git', ['cat-file', '-e', `${sourceSha}^{commit}`], { stdio: 'pipe' });
const dir = path.join(root, artifactDir); fs.mkdirSync(dir, { recursive: true });
const results = []; let index = 0;
function visit(suites) {
  for (const suite of suites || []) {
    for (const spec of suite.specs || []) for (const test of spec.tests || []) for (const result of test.results || []) {
      const files = [];
      for (const attachment of result.attachments || []) {
        const ext = { 'image/png': '.png', 'application/json': '.json', 'text/plain': '.txt' }[attachment.contentType] || '.bin';
        const file = `${name}-${String(index++).padStart(3, '0')}${ext}`;
        if (attachment.path && fs.existsSync(attachment.path)) fs.copyFileSync(attachment.path, path.join(dir, file));
        else if (attachment.body) fs.writeFileSync(path.join(dir, file), Buffer.from(attachment.body, 'base64'));
        else continue;
        files.push({ name: attachment.name, path: artifactDir + '/' + file });
      }
      results.push({ title: spec.title, project: test.projectName, status: result.status, duration: result.duration, errors: result.errors, files });
    }
    visit(suite.suites);
  }
}
visit(raw.suites);
fs.writeFileSync(path.join(root, name + '-resumen.json'), JSON.stringify({ sourceSha, stats: raw.stats, results }, null, 2));
console.log(JSON.stringify({ stats: raw.stats, statuses: results.map(r => [r.project, r.title, r.status]) }, null, 2));
