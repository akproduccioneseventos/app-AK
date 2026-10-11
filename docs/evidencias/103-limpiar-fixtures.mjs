import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import admin from 'firebase-admin';
const cwd = path.join(os.homedir(), 'Documents', 'Codex', 'ak-codex88', 'ak-entorno-aislado-103');
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085' || !fs.existsSync(path.join(cwd, '.git'))) throw new Error('Own demo only');
const app = admin.initializeApp({ projectId: 'demo-ak-producciones' }, 'cleanup103');
const db = app.firestore(), known = new Set(['q92rmv2yk9b9', 'e2e_99_qr_corto_1791695521018', 'e2e_99_qr_uuid_1791695586308']);
const own = id => id.startsWith('e2e_103_') || known.has(id);
const result = { cwd, deleted: [], preserved: [], localDeleted: [], finished: null };
try {
  for (const collection of await db.listCollections()) {
    for (const doc of (await collection.get()).docs) {
      if (own(doc.id)) { await doc.ref.delete(); result.deleted.push(doc.ref.path); }
      else result.preserved.push(doc.ref.path);
    }
  }
  for (const relative of ['data/fiestas', 'src/data/fiestas']) {
    const dir = path.join(cwd, relative);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) if (name.endsWith('.json') && own(name.slice(0, -5))) {
      const file = path.join(dir, name);
      if (path.dirname(fs.realpathSync(file)) !== fs.realpathSync(dir)) throw new Error('Path escape');
      fs.unlinkSync(file); result.localDeleted.push(path.relative(cwd, file));
    }
  }
  result.finished = new Date().toISOString();
  fs.writeFileSync('docs/evidencias/103-limpieza.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally { await app.delete(); }
