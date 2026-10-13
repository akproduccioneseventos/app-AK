import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export function fixtureGuard() {
  if (process.env.AK_ENTORNO_AISLADO !== 'true') throw new Error('Local QA only');
  const originals = new Map();
  function scan(folder, target) {
    if (!fs.existsSync(folder)) return;
    for (const item of fs.readdirSync(folder,{withFileTypes:true})) {
      const file = path.join(folder,item.name);
      if (item.isSymbolicLink()) throw new Error('No fixture symlinks');
      if (item.isDirectory()) scan(file,target);
      else target.set(file,fs.readFileSync(file));
    }
  }
  for (const folder of ['src/data','data']) scan(folder,originals);
  return function restore() {
    const current = new Map();
    for (const folder of ['src/data','data']) scan(folder,current);
    const restored = [];
    for (const file of new Set([...originals.keys(),...current.keys()])) {
      const a = originals.get(file), b = current.get(file);
      if (a?.equals(b)) continue;
      if (a) { fs.mkdirSync(path.dirname(file),{recursive:true}); fs.writeFileSync(file,a); }
      else fs.unlinkSync(file);
      restored.push({file,beforeSha256:a?crypto.createHash('sha256').update(a).digest('hex'):null,qaSha256:b?crypto.createHash('sha256').update(b).digest('hex'):null});
    }
    return { restored, bytesRestored: [...originals].every(([file,bytes]) => fs.readFileSync(file).equals(bytes)) };
  };
}
