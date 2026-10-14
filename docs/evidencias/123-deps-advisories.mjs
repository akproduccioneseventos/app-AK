import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const token = execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();
const ids = ['GHSA-c6gr-qvv4-5v3f','GHSA-mrv2-3pqr-j5jr','GHSA-cg2g-xh64-v4q7','GHSA-6688-9rhm-gjv2','GHSA-f596-whhp-79r4','GHSA-px8p-9vwx-vf98','GHSA-2883-xcg3-v3hh','GHSA-q2hr-2g5m-vwhr','GHSA-frvp-7c67-39w9','GHSA-4mjr-xmp4-gh2g','GHSA-x5fp-wj9c-mxmx'];
const results = [];
for (const id of ids) {
  const path = ['GHSA-c6gr-qvv4-5v3f','GHSA-mrv2-3pqr-j5jr','GHSA-cg2g-xh64-v4q7','GHSA-6688-9rhm-gjv2'].includes(id) ? `repos/cure53/DOMPurify/security-advisories/${id}` : `advisories/${id}`;
  const data = JSON.parse(execFileSync('curl.exe', ['-4','--fail','--silent','--show-error','--connect-timeout','5','--max-time','20','--config','-',`https://api.github.com/${path}`], { input: `header = "Authorization: Bearer ${token}"\n`, encoding:'utf8', maxBuffer: 2000000 }));
  results.push({ id, url:data.html_url, severity:data.severity, summary:data.summary, updated_at:data.updated_at, vulnerabilities:data.vulnerabilities });
  console.log(JSON.stringify(results.at(-1)));
}
fs.writeFileSync('docs/evidencias/123-deps-advisories.json', JSON.stringify(results,null,2)+'\n');
