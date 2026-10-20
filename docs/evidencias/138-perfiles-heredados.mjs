import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const record = JSON.parse(fs.readFileSync('docs/evidencias/135-entorno.json'));
const source = '7230f9d02b32805952a185f704a0208bd5d643e6';
if (execFileSync('git', ['rev-parse','HEAD'], { cwd: record.qa, encoding: 'utf8' }).trim() !== source) throw new Error('Source mismatch');
const require = createRequire(path.join(record.qa, 'package.json'));
const ts = require('typescript');
const file = 'src/lib/auth/perfiles.ts';
const bytes = fs.readFileSync(path.join(record.qa, file));
const generated = ts.transpileModule(bytes.toString(), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
vm.runInNewContext(generated, { exports }, { filename: file });
const cases = [];
for (const perfil of ['constructor','toString','__proto__','inventado']) {
  const accepted = exports.esPerfilValido(perfil);
  let allowed, error;
  try { allowed = exports.puede({ role: 'user', perfil }, exports.PERMISOS.ORGANIZACION); }
  catch (err) { error = String(err); }
  cases.push({ perfil, expectedValid: false, actualValid: accepted, expectedLegacyUserPermission: true,
    allowed, error, pass: accepted === false && allowed === true && !error });
}
const result = { source, file, fileSha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  scope: 'Pure real source transpiled in VM; no session forgery, live API, user update or real data',
  cases, pass: cases.filter((row) => row.pass).length, fail: cases.filter((row) => !row.pass).length };
fs.writeFileSync('docs/evidencias/138-perfiles-heredados-results.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
if (result.fail) process.exitCode = 1;
