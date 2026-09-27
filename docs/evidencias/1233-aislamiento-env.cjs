// Audit only: fake credentials, temporary fixture, no provider calls or app build.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync, execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const loader = path.resolve(process.argv[2]);
const output = process.argv[3];
const bootstrap = spawnSync(process.execPath, ['scripts/entorno-de-pruebas.mjs'], {
  cwd: root,
  env: { ...process.env, INSTAGRAM_ACCESS_TOKEN: 'audit-parent-fake', AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE: 'true' },
  encoding: 'utf8', timeout: 10000,
});
if (bootstrap.status !== 0) throw new Error('Cannot inspect isolated bootstrap: ' + bootstrap.stderr);
const config = JSON.parse(bootstrap.stdout);
const env = Object.fromEntries(config.nombres.filter(k => process.env[k] !== undefined).map(k => [k, process.env[k]]));
Object.assign(env, config.forzadas);
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-env-audit-'));
const fixturePath = path.join(fixture, '.env.local');
fs.writeFileSync(fixturePath, 'INSTAGRAM_ACCESS_TOKEN=audit-file-fake\nSMTP_HOST=mail.invalid\nAK_NEW_PROVIDER_SECRET=audit-new-fake\n');
try {
  const code = `
    const {loadEnvConfig}=require(${JSON.stringify(loader)});
    const before={instagram:!!process.env.INSTAGRAM_ACCESS_TOKEN,smtp:!!process.env.SMTP_HOST,newProvider:!!process.env.AK_NEW_PROVIDER_SECRET};
    loadEnvConfig(${JSON.stringify(fixture)},false,{info(){},error(){}});
    console.log(JSON.stringify({before,after:{instagram:process.env.INSTAGRAM_ACCESS_TOKEN==='audit-file-fake',smtp:process.env.SMTP_HOST==='mail.invalid',newProvider:process.env.AK_NEW_PROVIDER_SECRET==='audit-new-fake'},localJson:process.env.AK_USE_LOCAL_JSON_ONLY}));
  `;
  const child = spawnSync(process.execPath, ['-e', code], { cwd: fixture, env, encoding: 'utf8', timeout: 10000 });
  if (child.status !== 0) throw new Error(child.stderr || 'Probe subprocess failed');
  const observed = JSON.parse(child.stdout);
  const report = {
    sourceSha: execFileSync('git', ['rev-parse', 'HEAD'], {cwd:root,encoding:'utf8'}).trim(),
    nextEnvVersion: require(path.join(loader, 'package.json')).version,
    scope:'Actual environment bootstrap + actual Next env loader; synthetic .env.local. No real secrets, server, build or provider request.',
    observed,
    passed: Object.values(observed.after).every(v => !v),
    expectation:'An isolated launch must not load provider credentials from local env files.',
  };
  fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
} finally {
  // Only the explicitly created fixture file and its now-empty temporary directory.
  fs.unlinkSync(fixturePath);
  fs.rmdirSync(fixture);
}
