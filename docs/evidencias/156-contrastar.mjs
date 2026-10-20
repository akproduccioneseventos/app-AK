import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const source = '894d01603e0e03cebc8f90a6ccf869ef86bbe1de';
const targets = { gemini1337: '45a0b1d4783ad58846c2e2d07ad8f318287024bf', claudePublic: 'fc5e606a4bf8eba0cb93779029440387d06d14af' };
const symbols = [
  ['src/app/actions/google-workspace.ts','getEmployeeWorkspacePortal'],
  ['src/app/actions/empleados.ts','getEmpleados'],
  ['src/app/actions/fiesta/fiesta.actions.ts','getFiestas'],
  ['src/app/actions/fiesta/fiesta.actions.ts','requireEquipo'],
  ['src/lib/auth/equipo-de-la-fiesta.ts','usuarioDelEquipo'],
];
const body = (sha,file,name) => { const p = spawnSync('git',['show',`${sha}:${file}`],{cwd:root,encoding:'utf8'}); assert.equal(p.status,0,p.stderr);
  const ast=ts.createSourceFile(file,p.stdout,ts.ScriptTarget.Latest,true); const n=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name); assert.ok(n,`${sha}:${file}:${name}`); return n.getText(ast); };
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const comparisons=symbols.map(([file,symbol])=>{const a=body(source,file,symbol);return {file,symbol,sourceHash:hash(a),targets:Object.fromEntries(Object.entries(targets).map(([label,sha])=>{const b=body(sha,file,symbol);return[label,{sha,identical:a===b,hash:hash(b)}];}))};});
const result={source,targets,comparisons,limits:'Function-source comparison only; not transitive equivalence or private unpublished work'};
const target=new URL('156-contraste.json',import.meta.url);assert.equal(fs.existsSync(target),false);fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
