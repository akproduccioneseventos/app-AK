#!/usr/bin/env node
/**
 * ¿SE PUEDE PUBLICAR?
 *
 * **Un informe es una opinión. Esto es una puerta.**
 *
 * El dueño lo pidió el 27 de agosto de 2026, después de que una auditoría diera *"cero
 * errores"* mientras la fotocabina imprimía sin fondo, el entretenimiento estaba mal y la
 * web también. Sus palabras: *"quiero que inventes un mecanismo de auditoría que deje mi app
 * en cero errores en código y en funcionamiento; todo debe marchar para poder publicar."*
 *
 * **Por qué las auditorías no servían:** ninguna bloqueaba nada. Se fusionaba y se publicaba
 * pase lo que pase, dijera lo que dijera el informe. Un control que no puede frenar la
 * publicación no es un control: es una sugerencia.
 *
 * Esto devuelve **una sola cosa**: se puede publicar, o no se puede y por qué. Y termina con
 * código de salida distinto de cero cuando no se puede, para que cualquier cosa que lo llame
 * —una persona, otra IA, o el despliegue— pueda frenar sola.
 *
 * **Los pasos van del más barato al más caro, a propósito**: si los acentos están rotos no
 * tiene sentido esperar veinte minutos de pruebas de navegador para enterarse.
 */

import { spawnSync } from 'node:child_process';

const PASOS = [
  {
    nombre: 'Acentos',
    comando: 'npm run check:acentos',
    queSignifica: 'Hay acentos rotos. Además de verse mal, rompen en silencio las comparaciones con eñes: los platos de niños se contaron como de adultos por esto.',
  },
  {
    nombre: 'Revisor de tipos',
    comando: 'npm run typecheck',
    queSignifica: 'Hay código que no encaja. Suele terminar en una pantalla que se rompe al abrirla.',
  },
  {
    nombre: 'Pruebas',
    comando: 'npx jest --silent',
    queSignifica: 'Algo que antes andaba dejó de andar.',
  },
  {
    nombre: 'Compilación',
    comando: 'npm run build',
    queSignifica: 'La app no se puede armar, así que no se puede publicar. El revisor de tipos puede pasar y esto fallar igual: ya dejó la app seis días sin poder publicarse.',
  },
  {
    nombre: 'Seguridad de la base',
    comando: 'npm run test:rules',
    queSignifica: 'Alguien podría ver o tocar datos que no le corresponden.',
  },
  {
    nombre: 'La app usada de verdad',
    comando: 'npm run test:e2e:production',
    queSignifica: 'La app compila pero no funciona: alguna pantalla no hace lo que dice. Es el único control que ve lo que ve el usuario.',
    caro: true,
  },
];

function correr(comando) {
  const r = spawnSync(comando, { shell: true, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return { ok: r.status === 0, salida: `${r.stdout || ''}${r.stderr || ''}` };
}

/** Las últimas líneas que sirven para entender qué falló, sin volcar miles. */
function pistas(salida) {
  return salida.trim().split('\n').filter((l) => l.trim()).slice(-12).join('\n');
}

const soloRapidos = process.argv.includes('--rapido');

/**
 * Modo filtro: lo que corre antes de cada subida.
 *
 * **Deja afuera la compilación y las pruebas de navegador a propósito.** Juntas tardan más
 * de quince minutos, y un filtro que tarda quince minutos **no se usa: se saltea**. Un
 * control que la gente esquiva no protege nada.
 *
 * Con acentos, tipos y pruebas —dos minutos y medio— se atrapa la enorme mayoría de lo que
 * rompe. Lo demás lo agarra la puerta completa antes de fusionar, que es donde de verdad
 * importa.
 */
const modoFiltro = process.argv.includes('--filtro');
const PASOS_DEL_FILTRO = new Set(['Acentos', 'Revisor de tipos', 'Pruebas']);
const fallas = [];

console.log('\n¿SE PUEDE PUBLICAR?\n' + '='.repeat(60));

for (const paso of PASOS) {
  if (soloRapidos && paso.caro) {
    console.log(`  (salteado por --rapido)  ${paso.nombre}`);
    continue;
  }
  if (modoFiltro && !PASOS_DEL_FILTRO.has(paso.nombre)) continue;
  process.stdout.write(`  ${paso.nombre}... `);
  const arranque = Date.now();
  const { ok, salida } = correr(paso.comando);
  const segundos = ((Date.now() - arranque) / 1000).toFixed(0);
  console.log(ok ? `bien (${segundos}s)` : `FALLA (${segundos}s)`);
  if (!ok) {
    fallas.push({ paso, salida });
    break; // se corta acá: lo que sigue es más caro y ya sabemos que no se publica
  }
}

console.log('='.repeat(60));

if (fallas.length === 0) {
  if (modoFiltro) {
    console.log('\n  El filtro pasó. La subida sigue.\n');
    console.log('  Ojo: esto NO alcanza para publicar. Antes de fusionar hay que correr');
    console.log('  la puerta completa: npm run "publicar?"\n');
    process.exit(0);
  }
  if (soloRapidos) {
    console.log('\nLos controles rápidos pasaron. FALTA la prueba de la app usada de verdad:');
    console.log('corré esto mismo sin --rapido antes de publicar.\n');
    process.exit(0);
  }
  console.log('\n  SE PUEDE PUBLICAR.\n');
  console.log('  Todo marcha: acentos, tipos, pruebas, compila, la base protegida');
  console.log('  y la app probada usándose de verdad.\n');
  process.exit(0);
}

const { paso, salida } = fallas[0];
console.log(`\n  NO SE PUEDE PUBLICAR.\n`);
console.log(`  Falló: ${paso.nombre}`);
console.log(`  Qué significa: ${paso.queSignifica}\n`);
console.log('  Detalle:\n');
console.log(pistas(salida).split('\n').map((l) => '    ' + l).join('\n'));
console.log('\n  Se corta acá: los controles que siguen son más lentos y ya sabemos');
console.log('  que no se publica. Arreglá esto y volvé a correrlo.\n');
process.exit(1);
