import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const lock = JSON.parse(fs.readFileSync('package-lock.json'));
const results = [];
function check(name, run) { const details = run(); results.push({name, status:'PASS', details}); }
check('firebase-cli-local-version', () => {
  const actual = execFileSync(process.execPath, ['node_modules/firebase-tools/lib/bin/firebase.js','--version'], {encoding:'utf8'}).trim();
  assert.equal(actual, '15.33.0'); return {version:actual, projectCommands:0};
});
check('tar-cli-fictitious-archive', () => {
  const cliRequire = createRequire(path.resolve('node_modules/firebase-tools/package.json'));
  const tar = cliRequire('tar');
  const dir = fs.mkdtempSync(path.join(process.env.TEMP || '.', 'ak125-tar-'));
  try {
    fs.writeFileSync(path.join(dir, 'ficticio.txt'), 'QA125 ficticio');
    tar.c({sync:true, cwd:dir, file:path.join(dir,'test.tar')}, ['ficticio.txt']);
    const names=[]; tar.t({sync:true, file:path.join(dir,'test.tar'), onReadEntry:e=>names.push(e.path)});
    assert.deepEqual(names,['ficticio.txt']);
    const packageFile = cliRequire.resolve('tar/package.json');
    const version=JSON.parse(fs.readFileSync(packageFile)).version;
    assert.equal(version,'7.5.21'); return {version, names};
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
check('re2-legacy-consumer-api-node24-not-security-fixed', () => {
  const consumer = createRequire(require.resolve('superstatic/package.json'));
  const RE2 = consumer('re2'); const r = new RE2('^fiesta[0-9]+$');
  assert(r.test('fiesta125')); assert(!r.test('otra'));
  assert.equal(consumer('re2/package.json').version,'1.24.0'); return {version:'1.24.0',nativeLoaded:true,securityFixed:false};
});
check('selector-parser-compatible-major6', () => {
  const parser=require('postcss-selector-parser'); const input='.evento > .menu[data-tipo="boda"]:hover';
  assert.equal(parser().processSync(input),input);
  assert.equal(require('postcss-selector-parser/package.json').version,'6.1.4'); return {version:'6.1.4',selectorPreserved:true};
});
for(const [p, data] of Object.entries(lock.packages).filter(([p])=>p.endsWith('/tar'))) {
  assert(!data.version.startsWith('6.'), 'Legacy tar6 remains: '+p);
}
fs.writeFileSync('docs/evidencias/125-deps-smoke.json', JSON.stringify({
  applicationSourceSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  node:process.version,results,allDependencySecurityCertified:false,
},null,2)+'\n');
console.log(JSON.stringify(results));
