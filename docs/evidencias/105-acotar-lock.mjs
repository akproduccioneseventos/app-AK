import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const cwd = path.join(os.homedir(), 'Documents', 'Codex', 'ak-codex88', 'ak-react19-candidato-103');
if (fs.realpathSync(cwd) !== cwd) throw new Error('Private checkout only');
const lock = JSON.parse(execFileSync('git', ['show', 'd0c8d8588dae37b91419aa6a1574b5b3f7eeb679:package-lock.json'], { cwd, encoding: 'utf8', maxBuffer: 20000000 }));
const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
lock.packages[''].dependencies = pkg.dependencies;
lock.packages[''].devDependencies = pkg.devDependencies;
const direct = ['react', 'react-dom', 'qrcode.react', 'react-day-picker', 'next', 'eslint-config-next', '@types/react', '@types/react-dom', '@react-three/fiber', '@react-three/drei'];
const oldRenderers = ['@react-spring/animated', '@react-spring/core', '@react-spring/shared', '@react-spring/three', '@react-spring/types', 'react-composer', 'react-reconciler', '@types/react-reconciler'];
for (const key of Object.keys(lock.packages)) {
  if ([...direct, ...oldRenderers].some(name => key === `node_modules/${name}` || key.startsWith(`node_modules/${name}/node_modules/`)) || key.startsWith('node_modules/@next/')) delete lock.packages[key];
}
fs.writeFileSync(path.join(cwd, 'package-lock.json'), JSON.stringify(lock, null, 2) + '\n');
console.log('Seed lock retains unrelated locked versions; npm must resolve and validate affected dependencies without force.');
