import { execFileSync } from 'node:child_process';
const env = { ...process.env, GIT_NO_LAZY_FETCH: '1' };
const git = (args, input) => execFileSync('git', args, { env, input, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
const paths = git(['diff', '--name-only', '4c5ef2f9', '096f228f']).trim().split(/\r?\n/);
const ids = new Set();
for (const ref of ['4c5ef2f9', 'HEAD', '096f228f']) {
  for (const row of git(['ls-tree', '-r', ref, '--', ...paths]).trim().split(/\r?\n/)) {
    const match = row.match(/^\d+ blob ([a-f0-9]{40})\t/);
    if (match) ids.add(match[1]);
  }
}
const missing = git(['cat-file', '--batch-check'], [...ids].join('\n') + '\n').trim().split(/\r?\n/).filter(row => row.endsWith(' missing')).map(row => row.split(' ')[0]);
console.log(JSON.stringify({ candidates: ids.size, missing: missing.length }));
const token = execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();
for (const id of missing) {
  const reply = JSON.parse(execFileSync('curl.exe', ['-4', '--fail', '--silent', '--show-error', '--retry', '2', '--connect-timeout', '5', '--max-time', '20', '--config', '-', `https://api.github.com/repos/akproduccioneseventos/app-AK/git/blobs/${id}`], { input: `header = "Authorization: Bearer ${token}"\nheader = "Accept: application/vnd.github+json"\n`, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, timeout: 70000 }));
  if (reply.sha !== id || reply.encoding !== 'base64') throw new Error('Unexpected blob identity/encoding');
  const actual = git(['hash-object', '-w', '--stdin'], Buffer.from(reply.content, 'base64')).trim();
  if (actual !== id) throw new Error(`Blob mismatch ${id}`);
  console.log(`verified ${id}`);
}
