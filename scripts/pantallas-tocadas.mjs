#!/usr/bin/env node
/**
 * QUE PANTALLAS TOCA ESTE CAMBIO.
 *
 * **Por que existe.** El recorrido abria las 358 pantallas siempre, aunque el
 * cambio tocara una sola. Son quince minutos por corrida, y el dueno lo dijo
 * claro el 8 de septiembre de 2026: *"tiene que recorrer lo que se cambia, no
 * todo"*.
 *
 * **Como decide, y por que no se le escapa nada.** No mira solo el archivo de la
 * pantalla: arma el arbol de quien importa a quien y sube. Si se toca un boton
 * que usan cuarenta pantallas, salen las cuarenta.
 *
 * **Y ante la duda, recorre todo.** Si se toca algo que afecta a la app entera
 * -la configuracion, el armazon comun, el guardian de sesion, las dependencias-
 * o si lo tocado alcanza a mas de la mitad de las pantallas, devuelve `TODO`.
 * Un recorrido de mas cuesta minutos; uno de menos deja pasar una pantalla rota.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const RAIZ = process.cwd();
const SRC = path.join(RAIZ, 'src');
const APP = path.join(SRC, 'app');

/** Tocar cualquiera de estos cambia toda la app: se recorre entera. */
const AFECTAN_TODO = [
  /^next\.config\.js$/,
  /^middleware\.ts$/,
  /^package(-lock)?\.json$/,
  /^tailwind\.config\./,
  /^src\/app\/layout\.tsx$/,
  /^src\/app\/globals\.css$/,
  /^src\/middleware\.ts$/,
  /^scripts\/helpers\/route-inventory\.mjs$/,
  /^tests\/e2e\/recorrido-de-pantallas\.spec\.ts$/,
];

function archivosCambiados() {
  const base = spawnSync('git merge-base origin/main HEAD', { shell: true, encoding: 'utf8' });
  const ref = base.status === 0 && base.stdout.trim() ? base.stdout.trim() : null;
  if (!ref) return null; // sin base no se puede acotar: se recorre todo
  const guardados = spawnSync(`git diff --name-only ${ref}...HEAD`, { shell: true, encoding: 'utf8' });
  const sinGuardar = spawnSync('git status --porcelain', { shell: true, encoding: 'utf8' });
  if (guardados.status !== 0) return null;
  return [
    ...(guardados.stdout || '').split('\n'),
    ...(sinGuardar.stdout || '').split('\n').map((l) => l.slice(3)),
  ]
    .map((f) => f.trim())
    .filter(Boolean);
}

function todosLosArchivosDeCodigo(dir, acc = []) {
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const completo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) todosLosArchivosDeCodigo(completo, acc);
    else if (/\.(ts|tsx|js|jsx)$/.test(entrada.name)) acc.push(completo);
  }
  return acc;
}

const EXTENSIONES = ['.ts', '.tsx', '.js', '.jsx'];

function resolverImport(desde, especificador) {
  let base;
  if (especificador.startsWith('@/')) base = path.join(SRC, especificador.slice(2));
  else if (especificador.startsWith('.')) base = path.resolve(path.dirname(desde), especificador);
  else return null; // biblioteca de afuera
  for (const ext of EXTENSIONES) {
    if (fs.existsSync(base + ext)) return base + ext;
  }
  for (const ext of EXTENSIONES) {
    const indice = path.join(base, 'index' + ext);
    if (fs.existsSync(indice)) return indice;
  }
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  return null;
}

/** Mapa: archivo -> quienes lo importan. */
function armarQuienUsaAQuien(archivos) {
  const usadoPor = new Map();
  const regex = /(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g;
  for (const archivo of archivos) {
    let texto;
    try { texto = fs.readFileSync(archivo, 'utf8'); } catch { continue; }
    let m;
    while ((m = regex.exec(texto))) {
      const destino = resolverImport(archivo, m[1]);
      if (!destino) continue;
      if (!usadoPor.has(destino)) usadoPor.set(destino, new Set());
      usadoPor.get(destino).add(archivo);
    }
  }
  return usadoPor;
}

function rutaDePagina(archivo) {
  const rel = path.relative(APP, path.dirname(archivo)).replace(/\\/g, '/');
  const segmentos = rel ? rel.split('/') : [];
  const visibles = segmentos.filter((s) => !(s.startsWith('(') && s.endsWith(')')));
  return '/' + visibles.join('/');
}

export function pantallasTocadas() {
  return pantallasTocadasDesde(archivosCambiados());
}

/**
 * La parte que se puede probar sin git: se le pasa la lista de archivos
 * cambiados y devuelve las pantallas, o `TODO`.
 */
export function pantallasTocadasDesde(cambiados) {
  if (!cambiados) return 'TODO';
  if (cambiados.length === 0) return [];
  if (cambiados.some((f) => AFECTAN_TODO.some((p) => p.test(f)))) return 'TODO';

  const archivos = todosLosArchivosDeCodigo(SRC);
  const usadoPor = armarQuienUsaAQuien(archivos);

  const semillas = cambiados
    .filter((f) => f.startsWith('src/'))
    .map((f) => path.join(RAIZ, f))
    .filter((f) => fs.existsSync(f));
  if (semillas.length === 0) return [];

  const alcanzados = new Set(semillas);
  const cola = [...semillas];
  while (cola.length) {
    const actual = cola.pop();
    for (const quien of usadoPor.get(actual) || []) {
      if (!alcanzados.has(quien)) {
        alcanzados.add(quien);
        cola.push(quien);
      }
    }
  }

  const rutas = new Set();
  for (const archivo of alcanzados) {
    const nombre = path.basename(archivo);
    if (!archivo.startsWith(APP)) continue;
    if (nombre === 'page.tsx' || nombre === 'page.ts') {
      rutas.add(rutaDePagina(archivo));
    } else if (nombre === 'layout.tsx' || nombre === 'template.tsx') {
      // Un armazon manda sobre todas las pantallas que cuelgan de el.
      const carpeta = path.dirname(archivo);
      for (const otro of archivos) {
        if (otro.startsWith(carpeta) && /page\.tsx?$/.test(otro)) rutas.add(rutaDePagina(otro));
      }
    }
  }

  const totalPantallas = archivos.filter((f) => f.startsWith(APP) && /page\.tsx?$/.test(f)).length;
  if (rutas.size > totalPantallas * 0.5) return 'TODO';
  return [...rutas];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = pantallasTocadas();
  if (r === 'TODO') console.log('TODO');
  else console.log(r.join(','));
}
