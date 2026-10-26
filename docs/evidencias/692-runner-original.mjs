import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import os from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const dir = fileURLToPath(new URL('./', import.meta.url));
const output = path.join(dir, '692-tipos.json');
assert(!fs.existsSync(output), 'Preserve previous receipts');
const install = JSON.parse(fs.readFileSync(path.join(dir, '690-instalacion.json')));
const build = JSON.parse(fs.readFileSync(path.join(dir, '680-entorno.json')));
assert.equal(install.phase, 'install-pass');
assert.equal(install.source, build.source);
const qa = build.qa;
const link = path.join(qa, 'node_modules');
const clean = path.join(install.qa, 'node_modules');
const previous = fs.realpathSync(link);
assert(fs.lstatSync(link).isSymbolicLink(), 'Only replace our QA junction, never a real directory');
assert(path.resolve(qa).startsWith('C:\\Users\\Usuario\\Documents\\Codex\\ak-codex88\\.qa-658-final-') || qa.replaceAll('\\', '/').startsWith('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-658-final-'));
const safe = Object.fromEntries(['PATH', 'TEMP', 'TMP', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'PATHEXT', 'LOCALAPPDATA'].filter(k => process.env[k] !== undefined).map(k => [k, process.env[k]]));
const git = args => { const r = spawnSync('git', args, { cwd: qa, env: safe, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim(); };
assert.equal(git(['rev-parse', 'HEAD']), install.source);
assert.equal(git(['diff', '--name-only']), '');
const record = { source: install.source, started: new Date().toISOString(), phase: 'prepare', qa, install: install.qa, appEdited: false, realServices: false };
const save = () => fs.writeFileSync(output, JSON.stringify(record, null, 2) + '\n');
let replaced = false;
try {
  record.phase = 'waiting-memory'; save();
  const deadline = Date.now() + 5 * 60 * 1000;
  while (os.freemem() < 2 * 1024 ** 3) {
    assert(Date.now() < deadline, 'No safe memory window; TypeScript NOT started');
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
  record.freeBefore = os.freemem();
  fs.unlinkSync(link);
  replaced = true;
  fs.symlinkSync(clean, link, 'junction');
  const req = createRequire(path.join(install.qa, 'package.json'));
  const sharp = req('sharp');
  const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: '#ff3030' } }).png().toBuffer();
  const meta = await sharp(png).metadata();
  assert.equal(meta.width, 4); assert.equal(meta.height, 4);
  record.sharp = { pass: true, width: meta.width, height: meta.height, bytes: png.length };
  const home = path.join(install.qa, '.home');
  const env = { ...safe, HOME: home, USERPROFILE: home, APPDATA: home, XDG_CONFIG_HOME: home, GOOGLE_APPLICATION_CREDENTIALS: '', NODE_OPTIONS: '--max-old-space-size=1536 --require "C:/Users/Usuario/Documents/Codex/ak-codex88/ak-auditoria267-cierre/docs/evidencias/323-egress-unit-canonico.cjs"' };
  const log = fs.createWriteStream(path.join(dir, '692-tipos.log'));
  const child = spawn(process.execPath, [path.join(clean, 'typescript/bin/tsc'), '--noEmit', '--incremental', 'false', '--pretty', 'false'], { cwd: qa, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  record.phase = 'typecheck'; record.pid = child.pid; save();
  child.stdout.pipe(log, { end: false }); child.stderr.pipe(log, { end: false });
  record.exit = await new Promise((resolve, reject) => { child.once('exit', resolve); child.once('error', reject); });
  await new Promise(resolve => log.end(resolve));
  record.phase = record.exit === 0 ? 'types-pass' : 'types-fail';
  record.limits = 'Clean dependency tree from690, lifecycle scripts disabled. TypeScript uses existing D4 generated Next types/build680, not a fresh full build with clean dependencies. Native sharp encode/decode verified. No real services or app mutations.';
} catch (error) { record.phase = 'not-completed'; record.error = String(error.stack || error); process.exitCode = 1; }
finally {
  if (replaced) { if (fs.existsSync(link)) { assert(fs.lstatSync(link).isSymbolicLink()); fs.unlinkSync(link); } fs.symlinkSync(previous, link, 'junction'); }
  record.originalDependenciesRestored = fs.realpathSync(link) === previous;
  record.sourceDiff = git(['diff', '--name-only']);
  record.finished = new Date().toISOString(); save();
  console.log(JSON.stringify(record));
  if (record.exit !== undefined && record.exit !== 0) process.exitCode = 1;
}
