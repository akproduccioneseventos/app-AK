/**
 * QUE PRUEBAS DE NAVEGADOR TOCA ESTE CAMBIO.
 *
 * Orden del dueno, 23 de septiembre de 2026: *"se debe probar lo nuevo, no toda la app;
 * optimizalo al maximo"*. Las 80 pruebas de navegador tardaban media hora por cada
 * arreglo, aunque el arreglo tocara una sola pantalla.
 *
 * Como elige, en este orden:
 *  1. Si el cambio toca algo que manda sobre toda la app (configuracion, el armazon
 *     general, los ayudantes de las pruebas), corren TODAS. Eso no se acota.
 *  2. Las pruebas que el cambio agrego o toco, siempre.
 *  3. Las pantallas que el cambio alcanza —subiendo por quien importa a quien, lo mismo
 *     que ya usa el recorrido (`pantallas-tocadas.mjs`)— y las pruebas que visitan esas
 *     direcciones.
 *  4. Siempre, tres pruebas de humo: la portada, el ingreso y el panel del equipo.
 *
 * `AK_PRUEBAS_TODAS=true` corre las 80 igual, cuando se quiera.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pantallasTocadasDesde } from './pantallas-tocadas.mjs';

const RAIZ = process.cwd();
const E2E = path.join(RAIZ, 'tests', 'e2e');

/** Tocar esto cambia como corren TODAS las pruebas: no se acota. */
const OBLIGAN_A_TODAS = [
  /^playwright\.config\.ts$/,
  /^tests\/e2e\/helpers\//,
  /^tests\/e2e\/fixtures\//,
];

/** Siempre corren: si la app no abre, esto lo dice en un minuto. */
export const HUMO = [
  'tests/e2e/public-smoke.spec.ts',
  'tests/e2e/internal-smoke.spec.ts',
  'tests/e2e/la-puerta-de-entrada-anda.spec.ts',
];

function archivosCambiados() {
  const base = spawnSync('git merge-base origin/main HEAD', { shell: true, encoding: 'utf8' });
  const ref = base.status === 0 && base.stdout.trim() ? base.stdout.trim() : null;
  if (!ref) return null;
  const guardados = spawnSync(`git diff --name-only ${ref}...HEAD`, { shell: true, encoding: 'utf8' });
  const sinGuardar = spawnSync('git status --porcelain', { shell: true, encoding: 'utf8' });
  if (guardados.status !== 0) return null;
  return [
    ...(guardados.stdout || '').split('\n'),
    ...(sinGuardar.stdout || '').split('\n').map((l) => l.slice(3)),
  ]
    .map((f) => f.trim())
    // Lo que escribe la corrida no es un cambio.
    .filter((f) => f && !/^(src\/)?data\//.test(f));
}

function todasLasPruebas() {
  return fs.readdirSync(E2E)
    .filter((f) => f.endsWith('.spec.ts'))
    .map((f) => `tests/e2e/${f}`);
}

/** La parte fija de una direccion, hasta el primer tramo variable: /portal/c/[accessKey] -> /portal/c/ */
export function parteFija(ruta) {
  const corte = ruta.indexOf('[');
  const fija = corte === -1 ? ruta : ruta.slice(0, corte);
  return fija;
}

/** Si el texto de una prueba visita esa direccion. */
export function visita(texto, ruta) {
  const fija = parteFija(ruta);
  if (fija === '/' || fija === '') {
    return /goto\(\s*['"`]\/['"`?#]/.test(texto) || /['"`]\/['"`]/.test(texto);
  }
  const sinBarraFinal = fija.endsWith('/') ? fija.slice(0, -1) : fija;
  // La direccion tiene que aparecer como direccion: seguida de fin, barra, ? o #.
  const escapada = sinBarraFinal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`${escapada}(?=['"\`/?#]|$)`, 'm').test(texto);
}

/**
 * Devuelve 'TODAS' o la lista de archivos de prueba a correr.
 * `leer` se inyecta para poder probarlo sin disco.
 */
export function pruebasQueTocanDesde(cambiados, pruebas, leer = (f) => fs.readFileSync(path.join(RAIZ, f), 'utf8')) {
  if (!cambiados) return 'TODAS';
  if (cambiados.some((f) => OBLIGAN_A_TODAS.some((p) => p.test(f)))) return 'TODAS';

  const elegidas = new Set(HUMO.filter((f) => pruebas.includes(f)));
  for (const f of cambiados) if (pruebas.includes(f)) elegidas.add(f);

  const pantallas = pantallasTocadasDesde(cambiados.filter((f) => !f.startsWith('tests/')));
  if (pantallas === 'TODO') return 'TODAS';

  if (pantallas.length > 0) {
    for (const prueba of pruebas) {
      if (elegidas.has(prueba)) continue;
      let texto = '';
      try { texto = leer(prueba); } catch { continue; }
      if (pantallas.some((ruta) => visita(texto, ruta))) elegidas.add(prueba);
    }
  }
  return [...elegidas];
}

export function pruebasQueTocan() {
  if (process.env.AK_PRUEBAS_TODAS === 'true') return 'TODAS';
  return pruebasQueTocanDesde(archivosCambiados(), todasLasPruebas());
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = pruebasQueTocan();
  console.log(r === 'TODAS' ? 'TODAS' : r.join('\n'));
}
