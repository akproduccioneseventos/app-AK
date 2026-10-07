const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync, spawn } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const copy = fs.realpathSync(process.argv[2]);
const sha = 'f790a002426aecb6598efa239fa948db57571752';
const temp = fs.realpathSync(process.env.TEMP);
if (!copy.startsWith(`${temp}${path.sep}ak-entorno-aislado-`)) throw new Error('Not an isolated copy');
if (execFileSync('git', ['-C', copy, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() !== sha) throw new Error('Wrong SHA');
if (!fs.existsSync(path.join(copy, '.next/BUILD_ID'))) throw new Error('No compiled build');
if (fs.readdirSync(copy).some(name => /^\.env(\.(local|production|development|test)(\.local)?)?$/.test(name))) throw new Error('Unexpected environment file');

// Reuse the original script's environment policy, without its build/start side effects.
const source = fs.readFileSync(path.join(root, 'scripts/entorno-de-pruebas.mjs'), 'utf8');
const first = source.indexOf('const CLAVE_DEL_EQUIPO =');
const last = source.indexOf('/** Los archivos que Next carga');
const policy = source.slice(first, last).replace(/^const SALIDA =.*$/m, '').replace('export function ambienteAislado', 'function ambienteAislado');
const env = vm.runInNewContext(`${policy}\nambienteAislado(allowed)`, { allowed: process.env });
console.log(JSON.stringify({ sourceCommit: sha, copy, buildId: fs.readFileSync(path.join(copy, '.next/BUILD_ID'), 'utf8').trim(), localOnly: env.AK_USE_LOCAL_JSON_ONLY }));
const child = spawn(process.execPath, [path.join(copy, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', '3300'], { cwd: copy, env, stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill('SIGTERM'));
child.on('exit', code => process.exit(code || 0));
