import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const cwd = path.join(os.homedir(), 'Documents', 'Codex', 'ak-codex88', 'ak-react19-candidato-103');
if (fs.realpathSync(cwd) !== cwd || fs.lstatSync(path.join(cwd, 'node_modules')).isSymbolicLink()) throw new Error('Private checkout only');
const result = { cwd, deleted: [], preservedCount: 0, finished: null };
for (const relative of ['data/fiestas', 'src/data/fiestas']) {
  const dir = path.join(cwd, relative);
  if (!fs.existsSync(dir)) continue;
  if (!fs.realpathSync(dir).startsWith(cwd + path.sep)) throw new Error('Directory escape');
  for (const name of fs.readdirSync(dir)) {
    if (!/^e2e_105_salon_\d+\.json$/.test(name)) { result.preservedCount++; continue; }
    const file = path.join(dir, name);
    if (path.dirname(fs.realpathSync(file)) !== fs.realpathSync(dir)) throw new Error('File escape');
    const fixture = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (fixture.id !== name.slice(0, -5)) throw new Error('Not the owned fixture');
    fs.unlinkSync(file);
    result.deleted.push(path.relative(cwd, file));
  }
}
result.finished = new Date().toISOString();
fs.writeFileSync('docs/evidencias/105-limpieza.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
