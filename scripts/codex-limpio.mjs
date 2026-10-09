#!/usr/bin/env node
/**
 * ¿CODEX YA NO ENCUENTRA ERRORES? — el contador que tiene un final.
 *
 * Pedido del dueño, 2 de octubre de 2026: *"necesitamos crear un mecanismo que un día llegue a
 * decirme Codex no encontró errores"*. Hasta ese día cada revisión de Codex abría un frente nuevo
 * y no había forma de saber cuánto faltaba.
 *
 * La app se parte en áreas fijas (`docs/codex/areas.json`). Cada una está:
 *   - sin-revisar: Codex todavía no la miró entera.
 *   - con-hallazgos: la miró y encontró algo; se arregla y vuelve a mirarla.
 *   - limpia: la miró sobre la versión principal y no encontró nada.
 * Una área limpia vuelve SOLA a "volver a mirar" si su código cambió desde el commit en que Codex
 * la dio por limpia. El día que las catorce están limpias, esto lo dice.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { archivosAlcanzadosDesde, AFECTAN_TODO } from './pantallas-tocadas.mjs';

const RAIZ = process.cwd();

const enCarpetas = (archivo, carpetas) =>
  carpetas.some((c) => archivo === c || archivo.startsWith(c.endsWith('/') ? c : c + '/'));

const lineas = (texto) => texto.split('\n').map((l) => l.trim()).filter(Boolean);

/**
 * ¿Cambió algo que le toca a esta área desde que Codex la dio por limpia? (orden 112, AUD01)
 * Cuenta lo que cae DENTRO de sus carpetas, lo que ALCANZA a sus carpetas (un archivo de
 * `src/lib` que usa una pantalla del área) y los archivos que afectan a toda la app.
 */
export function cambioDesde(commit, carpetas, git = (args) => execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8' })) {
  try {
    const cambiados = lineas(git(['diff', '--name-only', `${commit}..HEAD`]));
    if (cambiados.some((f) => enCarpetas(f, carpetas))) return true;
    // Lo que está tocado y sin commitear —o nuevo, sin seguimiento— también cuenta (auditoría 66):
    // si no, un área se seguía llamando limpia con cambios en la copia local.
    if (git(['status', '--porcelain', '--', ...carpetas]).trim().length > 0) return true;
    const sueltos = lineas(git(['status', '--porcelain'])).map((l) => l.slice(3).replace(/^"|"$/g, ''));
    const todos = [...new Set([...cambiados, ...sueltos])];
    if (todos.some((f) => AFECTAN_TODO.some((p) => p.test(f)))) return true;
    if (todos.length === 0) return false;
    for (const alcanzado of archivosAlcanzadosDesde(todos, () => '*')) {
      if (enCarpetas(alcanzado, carpetas)) return true;
    }
    return false;
  } catch {
    return true; // sin poder comparar, no se da por limpia
  }
}

function archivosDeRutas(dir, salida = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) archivosDeRutas(abs, salida);
    else if (/^(page\.tsx?|route\.ts)$/.test(e.name)) salida.push(path.relative(RAIZ, abs).replace(/\\/g, '/'));
  }
  return salida;
}

/** Pantallas y rutas de `src/app` que no caen en ninguna carpeta de ninguna área: Codex no las mira. */
export function rutasSinArea(areas) {
  const carpetas = areas.flatMap((a) => a.carpetas);
  const raiz = path.join(RAIZ, 'src/app');
  if (!fs.existsSync(raiz)) return [];
  return archivosDeRutas(raiz).filter((f) => !enCarpetas(f, carpetas)).sort();
}

export function estadoReal(area, git) {
  if (area.estado !== 'limpia') return area.estado;
  if (!area.commit) return 'sin-revisar';
  return cambioDesde(area.commit, area.carpetas, git) ? 'volver-a-mirar' : 'limpia';
}

export function resumen(areas, git) {
  const filas = areas.map((a) => ({ ...a, real: estadoReal(a, git) }));
  const limpias = filas.filter((f) => f.real === 'limpia');
  const sinArea = rutasSinArea(areas);
  return {
    filas,
    limpias: limpias.length,
    total: filas.length,
    sinArea,
    terminado: limpias.length === filas.length && sinArea.length === 0,
  };
}

const ETIQUETA = {
  'sin-revisar': 'falta que Codex la revise',
  'con-hallazgos': 'Codex encontró algo: se arregla y la vuelve a mirar',
  'volver-a-mirar': 'estaba limpia, pero su código cambió: Codex la vuelve a mirar',
};

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const datos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'docs/codex/areas.json'), 'utf8'));
  const r = resumen(datos.areas);
  if (r.sinArea.length > 0) {
    console.log(`\n  ${r.sinArea.length} pantallas sin area: Codex no las mira`);
  }
  if (r.terminado) {
    console.log('\n  CODEX NO ENCUENTRA ERRORES: las ' + r.total + ' áreas de la app están limpias.\n');
  } else {
    console.log(`\n  Codex: ${r.limpias} de ${r.total} áreas limpias.`);
    for (const f of r.filas.filter((x) => x.real !== 'limpia')) {
      const abiertos = f.hallazgosAbiertos ? ` (${f.hallazgosAbiertos} abiertos)` : '';
      console.log(`   - ${f.nombre}: ${ETIQUETA[f.real]}${abiertos}`);
    }
    console.log('');
  }
}
