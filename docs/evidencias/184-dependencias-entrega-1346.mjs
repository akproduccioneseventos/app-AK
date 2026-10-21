import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = 'd95c35ba27c6ff5a3c1a8adac28e29c3ff02ae09';
const target = new URL('184-dependencias-entrega-1346.json', import.meta.url);
assert.equal(fs.existsSync(target), false, 'Preserve previous observations');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-qa184-audit-'));
const hashes = {}, runs = [];
try {
  for (const name of ['package.json', 'package-lock.json']) {
    const result = spawnSync('git', ['show', `${source}:${name}`], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    assert.equal(result.status, 0, result.stderr);
    hashes[name] = crypto.createHash('sha256').update(result.stdout).digest('hex');
    fs.writeFileSync(path.join(temp, name), result.stdout);
  }
  const npmrc = path.join(temp, 'qa.npmrc');
  fs.writeFileSync(npmrc, 'registry=https://registry.npmjs.org/\n');
  const env = Object.fromEntries(['PATH', 'Path', 'SystemRoot', 'WINDIR', 'ComSpec', 'TEMP', 'TMP'].filter(key => process.env[key]).map(key => [key, process.env[key]]));
  Object.assign(env, { HOME: temp, USERPROFILE: temp, APPDATA: temp, LOCALAPPDATA: temp, NODE_OPTIONS: '--max-old-space-size=256',
    npm_config_userconfig: npmrc, npm_config_globalconfig: path.join(temp, 'empty-global.npmrc'), npm_config_cache: path.join(temp, 'cache'),
    npm_config_registry: 'https://registry.npmjs.org/', npm_config_fetch_retries: '0', npm_config_fetch_timeout: '20000', npm_config_update_notifier: 'false' });
  for (const scope of ['all', 'production']) {
    const args = ['C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js', 'audit', '--json', '--ignore-scripts', '--package-lock-only'];
    if (scope === 'production') args.push('--omit=dev');
    const result = spawnSync(process.execPath, args, { cwd: temp, env, encoding: 'utf8', timeout: 60000, maxBuffer: 12 * 1024 * 1024 });
    let report;
    try { report = JSON.parse(result.stdout); } catch { report = { parseFailure: true, stdout: result.stdout.slice(0, 1000) }; }
    fs.writeFileSync(new URL(`184-npm-audit-${scope}.json.gz`, import.meta.url), zlib.gzipSync(JSON.stringify(report, null, 2) + '\n'));
    const advisories = [...new Map(Object.values(report.vulnerabilities || {}).flatMap(item => item.via || []).filter(item => typeof item === 'object').map(item => [item.url || String(item.source), item])).values()];
    runs.push({ scope, exitCode: result.status, signal: result.signal, processError: result.error?.message, stderr: result.stderr,
      error: report.error, counts: report.metadata?.vulnerabilities, uniqueAdvisories: advisories.length,
      advisories: advisories.map(item => ({ name: item.name, severity: item.severity, title: item.title, range: item.range, url: item.url })),
      directDependencies: Object.entries(report.vulnerabilities || {}).filter(([, value]) => value.isDirect).map(([name, value]) => ({ name, severity: value.severity, range: value.range, fixAvailable: value.fixAvailable })) });
  }
  const currentHashes = Object.fromEntries(Object.keys(hashes).map(name => [name, crypto.createHash('sha256').update(fs.readFileSync(path.join(temp, name))).digest('hex')]));
  assert.deepEqual(currentHashes, hashes, 'Audit must not alter the lock or package');
} finally {
  assert.equal(path.dirname(temp), os.tmpdir());
  assert.ok(path.basename(temp).startsWith('ak-qa184-audit-'));
  fs.rmSync(temp, { recursive: true, force: true });
  const receipt = { source, checkedAt: new Date().toISOString(), hashes, runs, appChanged: false, dependenciesInstalled: false, scriptsExecuted: false,
    scope: 'Registry advisory lookup for frozen lock only; no exploitability, reachability or application-wide security acceptance', temporaryWorkspaceRemoved: !fs.existsSync(temp) };
  fs.writeFileSync(target, JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ source, runs: runs.map(({ scope, counts, error, uniqueAdvisories }) => ({ scope, counts, error, uniqueAdvisories })) }));
}
