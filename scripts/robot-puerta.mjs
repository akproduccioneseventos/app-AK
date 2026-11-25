#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { pantallasTocadas } from './pantallas-tocadas.mjs';

const RAIZ = process.cwd();
const tocadas = pantallasTocadas();

if (Array.isArray(tocadas) && tocadas.length === 0) {
  console.log('[robot:puerta] Este cambio no toca ninguna pantalla. Nada que probar.');
  process.exit(0);
}

const env = { ...process.env };
if (tocadas === 'TODO') {
  console.log('[robot:puerta] El cambio toca la app entera: el robot audita todas las pantallas.');
  delete env.ROBOT_RUTAS;
} else {
  console.log(`[robot:puerta] El robot audita ${tocadas.length} pantalla(s) tocada(s): ${tocadas.join(', ')}`);
  env.ROBOT_RUTAS = tocadas.join(',');
}

const firebaseBin = path.join(RAIZ, 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js');
const res = spawnSync(
  process.execPath,
  [
    firebaseBin,
    'emulators:exec',
    '--config',
    'firebase.pruebas.json',
    '--only',
    'firestore,storage',
    '--project',
    'demo-ak-producciones',
    'node scripts/robot-correr.mjs --puerta',
  ],
  {
    cwd: RAIZ,
    env,
    stdio: 'inherit',
  },
);

process.exit(res.status || 0);
