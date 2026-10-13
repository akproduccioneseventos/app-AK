import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
const result = [];
for (const file of ['data/marketing-checklist.json','src/data/marketing-checklist.json']) {
  const original = execFileSync('git',['show',`HEAD:${file}`]);
  const current = fs.readFileSync(file);
  const a = JSON.parse(original), b = JSON.parse(current);
  if (JSON.stringify(b.slice(0,a.length)) !== JSON.stringify(a) || b.slice(a.length).some(row => row.semana !== '2026-W42')) throw new Error('Unexpected data change: '+file);
  fs.writeFileSync(file,original);
  result.push({file,generatedRowsRemoved:b.length-a.length,restoredSha256:crypto.createHash('sha256').update(original).digest('hex')});
}
fs.writeFileSync('docs/evidencias/110-inicializacion-restaurada.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
