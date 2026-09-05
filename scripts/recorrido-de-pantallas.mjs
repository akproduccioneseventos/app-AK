import { execFileSync, spawnSync } from 'node:child_process';
import process from 'node:process';

/**
 * El recorrido: abre las pantallas en el navegador y mira que anden.
 *
 * **POR QUE NO RECORRE LAS 357 SIEMPRE.** Lo marco el dueno el 2 de septiembre de
 * 2026: *"cada PR corre eso 40 minutos, una locura, son muchas PR que hacemos"*.
 * Tenia razon: un control que cuesta 40 minutos por propuesta no se sostiene, y
 * lo que no se sostiene termina apagado.
 *
 * Entonces recorre **solo las pantallas que el cambio pudo romper**:
 *
 * - Si el cambio toca una pantalla (`src/app/**\/page.tsx`), se recorre esa.
 * - Si toca algo COMPARTIDO —un componente, una libreria, los estilos— no se
 *   sabe a quien afecta: **se recorren todas**. Mejor perder 40 minutos que
 *   publicar algo roto.
 * - Si no toca nada de la app, no se recorre nada.
 *
 * Con `--todo` se recorren siempre las 357. Eso es lo que conviene correr una
 * vez por dia o antes de publicar de verdad, no en cada propuesta.
 */

const TODO = process.argv.includes('--todo');

/** Lo que cambio respecto de la version principal. */
function loQueCambio() {
  for (const base of ['origin/main', 'main']) {
    try {
      const salida = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      return salida.split('\n').map((l) => l.trim()).filter(Boolean);
    } catch {
      // Se prueba con la siguiente.
    }
  }
  return null; // No se pudo saber: se recorre todo, por las dudas.
}

/** ¿El cambio toca algo compartido, que puede romper cualquier pantalla? */
function tocaAlgoCompartido(archivos) {
  return archivos.some(
    (a) =>
      (a.startsWith('src/') && !a.includes('/page.tsx')) ||
      a.endsWith('.css') ||
      a === 'package.json' ||
      a === 'next.config.js' ||
      a === 'tailwind.config.ts',
  );
}

/** Las pantallas que cambiaron, como direcciones. */
function pantallasQueCambiaron(archivos) {
  return archivos
    .filter((a) => a.startsWith('src/app/') && a.endsWith('/page.tsx'))
    .map((a) =>
      '/' +
      a
        .replace('src/app/', '')
        .replace('/page.tsx', '')
        .split('/')
        .filter((s) => !s.startsWith('(')) // los grupos de carpetas no van en la direccion
        .join('/'),
    )
    .map((r) => (r === '/' ? '/' : r.replace(/\/$/, '')));
}

console.log('='.repeat(60));
console.log('RECORRIDO DE PANTALLAS');
console.log('='.repeat(60));

let soloEstas = null;

if (!TODO) {
  const archivos = loQueCambio();
  if (archivos === null) {
    console.log('No se pudo saber que cambio. Se recorren todas, por las dudas.\n');
  } else if (archivos.length === 0) {
    console.log('No cambio nada respecto de la version principal. No hay nada que recorrer.\n');
    process.exit(0);
  } else if (tocaAlgoCompartido(archivos)) {
    console.log('El cambio toca algo compartido: no se sabe a que pantallas afecta.');
    console.log('Se recorren TODAS. Mejor perder tiempo que publicar algo roto.\n');
  } else {
    soloEstas = pantallasQueCambiaron(archivos);
    if (soloEstas.length === 0) {
      console.log('El cambio no toca ninguna pantalla. No hay nada que recorrer.\n');
      process.exit(0);
    }
    console.log(`Solo las ${soloEstas.length} pantalla(s) que toca este cambio:`);
    for (const r of soloEstas) console.log(`   ${r}`);
    console.log('\nPara recorrer las 357: npm run recorrido -- --todo\n');
  }
} else {
  console.log('Las 357, porque se pidio --todo.\n');
}

const r = spawnSync(
  'node',
  ['scripts/run-playwright-production.mjs', 'tests/e2e/recorrido-de-pantallas.spec.ts'],
  {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      // Sin esto el recorrido queda excluido de la corrida y no se ejecuta nunca:
      // esta apagado a proposito para que no haga eterna la tanda de pruebas.
      AK_RECORRIDO: 'true',
      ...(soloEstas ? { AK_RECORRIDO_SOLO: soloEstas.join(',') } : {}),
    },
  },
);

process.exit(r.status || 0);
