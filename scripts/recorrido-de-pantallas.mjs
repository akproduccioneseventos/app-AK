import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { pantallasTocadas } from './pantallas-tocadas.mjs';

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

console.log('='.repeat(60));
console.log('RECORRIDO DE PANTALLAS');
console.log('='.repeat(60));

let soloEstas = null;

/**
 * QUE CAMBIO EL 8 DE SEPTIEMBRE DE 2026, Y POR QUE IMPORTA.
 *
 * Antes, cualquier cambio dentro de `src/` que no fuera una pantalla se
 * consideraba "algo compartido" y **se recorrian las 358 igual**. Como casi todo
 * cambio toca un componente o una libreria, en la practica se recorria todo
 * siempre: quince minutos por corrida. El dueno lo marco: *"tiene que recorrer
 * lo que se cambia, no todo"*.
 *
 * Ahora, cuando el cambio toca algo compartido **se averigua a quien afecta**:
 * se sube por el arbol de quien importa a quien y salen las pantallas que lo
 * usan. Solo se recorren las 358 cuando el cambio toca algo que afecta a la app
 * entera -la configuracion, el armazon comun- o cuando alcanza a mas de la mitad
 * de las pantallas, que es cuando acotar no ahorra nada.
 */
if (!TODO) {
  const tocadas = pantallasTocadas();
  if (tocadas === 'TODO') {
    console.log('El cambio toca la app entera: se recorren TODAS.');
    console.log('Mejor perder tiempo que publicar algo roto.\n');
  } else if (tocadas.length === 0) {
    console.log('El cambio no toca ninguna pantalla. No hay nada que recorrer.\n');
    process.exit(0);
  } else {
    soloEstas = tocadas;
    console.log(`Solo las ${soloEstas.length} pantalla(s) que toca este cambio:`);
    for (const r of soloEstas) console.log(`   ${r}`);
    console.log('\nPara recorrer las 358: npm run recorrido -- --todo\n');
  }
} else {
  console.log('Las 358, porque se pidio --todo.\n');
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
