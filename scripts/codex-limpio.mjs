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

const RAIZ = process.cwd();

export function cambioDesde(commit, carpetas, git = (args) => execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8' })) {
  try {
    if (git(['diff', '--name-only', `${commit}..HEAD`, '--', ...carpetas]).trim().length > 0) return true;
    // Lo que está tocado y sin commitear —o nuevo, sin seguimiento— también cuenta (auditoría 66):
    // si no, un área se seguía llamando limpia con cambios en la copia local.
    return git(['status', '--porcelain', '--', ...carpetas]).trim().length > 0;
  } catch {
    return true; // sin poder comparar, no se da por limpia
  }
}

export function estadoReal(area, git) {
  if (area.estado !== 'limpia') return area.estado;
  if (!area.commit) return 'sin-revisar';
  return cambioDesde(area.commit, area.carpetas, git) ? 'volver-a-mirar' : 'limpia';
}

export function resumen(areas, git) {
  const filas = areas.map((a) => ({ ...a, real: estadoReal(a, git) }));
  const limpias = filas.filter((f) => f.real === 'limpia');
  return { filas, limpias: limpias.length, total: filas.length, terminado: limpias.length === filas.length };
}

const ETIQUETA = {
  'sin-revisar': 'falta que Codex la revise',
  'con-hallazgos': 'Codex encontró algo: se arregla y la vuelve a mirar',
  'volver-a-mirar': 'estaba limpia, pero su código cambió: Codex la vuelve a mirar',
};

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const datos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'docs/codex/areas.json'), 'utf8'));
  const r = resumen(datos.areas);
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
