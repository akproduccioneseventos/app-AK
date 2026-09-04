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
    nombre: 'Lo que se dijo es lo que es',
    comando: 'node scripts/lo-que-se-dijo-es-lo-que-es.mjs',
    queSignifica:
      'Se agregó algo que dice hacer una cosa y nadie comprobó que la haga: código que no llama nadie, una pantalla sin una prueba que mire el resultado, o una prueba que sólo confirma que la pantalla abrió. Es la forma exacta que tuvieron las fallas de la fotocabina y del tablero: escritas, compilando, en verde, y sin hacer nada.',
  },
  {
    nombre: 'El trinquete',
    comando: 'node scripts/lo-que-se-dijo-es-lo-que-es.mjs --trinquete',
    queSignifica:
      'La deuda vieja de la app CRECIO. No hace falta repararla toda —son cientos y frenar por ellas dejaria la app sin poder subir nada—, pero lo nuevo no puede sumar. Arregla lo que agregaste, o repara la misma cantidad de lo viejo. Es una rueda que gira para un solo lado.',
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
    caro: true,
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
  {
    nombre: 'Recorrido de todas las pantallas',
    comando: 'npm run recorrido',
    queSignifica: 'Alguna de las pantallas del sistema falló al abrirse o renderizarse en producción.',
    caro: true,
  },
];

/**
 * ¿PUEDE ESTE CAMBIO ALTERAR LO QUE VE EL USUARIO?
 *
 * Los dos pasos caros —compilar y abrir la app en un navegador— tardan casi
 * cincuenta minutos juntos. Correrlos para un cambio que toca sólo documentos
 * es tiempo tirado, y ya se fue medio dia asi.
 *
 * Se saltean **solo** cuando nada de lo que cambio puede alterar la app. Y
 * cuando se saltean **se dice**, no se marcan como aprobados: un paso que no
 * corrio no es un paso que paso.
 */
const PUEDE_CAMBIAR_LA_APP = [
  /^src\/(?!__tests__\/)/,
  /^public\//,
  /^middleware\.ts$/,
  /^next\.config\./,
  /^package(-lock)?\.json$/,
  /^tsconfig\.json$/,
  /^apphosting\.yaml$/,
  /^firestore\.rules$/,
  // Tocar el corredor de pruebas o su configuracion CAMBIA como se prueba la app.
  // Sin esto, un cambio al corredor de navegador se salteaba justo el paso del
  // navegador: la puerta se sacaba sola el control que ese cambio afecta.
  /^scripts\/run-playwright-production\.mjs$/,
  /^scripts\/build-next-with-memory\.mjs$/,
  /^playwright\.config\.ts$/,
];

/** Un cambio de comentario en una prueba de navegador no cambia la app. */
function soloComentarios(archivo, base) {
  const r = spawnSync(
    `git diff -U0 ${base}...HEAD -- ${JSON.stringify(archivo)}`,
    { shell: true, encoding: 'utf8' }
  );
  if (r.status !== 0) return false;
  const lineas = (r.stdout || '')
    .split('\n')
    .filter((l) => (l.startsWith('+') || l.startsWith('-')) && !l.startsWith('+++') && !l.startsWith('---'))
    .map((l) => l.slice(1).trim())
    .filter(Boolean);
  if (lineas.length === 0) return false;
  return lineas.every((l) => l.startsWith('*') || l.startsWith('//') || l.startsWith('/*') || l === '*/');
}

function laAppPudoCambiar() {
  const base = spawnSync('git merge-base origin/main HEAD', { shell: true, encoding: 'utf8' });
  if (base.status !== 0 || !base.stdout.trim()) return true; // ante la duda, se corre todo
  const ref = base.stdout.trim();
  // Lo ya guardado Y lo que todavia esta sin guardar. Sin esto, un cambio en la
  // app hecho y no commiteado se saltaba los pasos caros.
  const r = spawnSync(`git diff --name-only ${ref}...HEAD`, { shell: true, encoding: 'utf8' });
  if (r.status !== 0) return true;
  const sinGuardar = spawnSync('git status --porcelain', { shell: true, encoding: 'utf8' });
  const archivos = [
    ...(r.stdout || '').split('\n'),
    ...(sinGuardar.stdout || '').split('\n').map((l) => l.slice(3)),
  ]
    .map((f) => f.trim())
    .filter(Boolean);
  if (archivos.length === 0) return true;
  for (const archivo of archivos) {
    if (PUEDE_CAMBIAR_LA_APP.some((patron) => patron.test(archivo))) return true;
    if (archivo.startsWith('tests/e2e/') && !soloComentarios(archivo, ref)) return true;
  }
  return false;
}

function correr(comando) {
  const r = spawnSync(comando, { shell: true, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return { ok: r.status === 0, salida: `${r.stdout || ''}${r.stderr || ''}` };
}

/** Las últimas líneas que sirven para entender qué falló, sin volcar miles. */
/**
 * Lo que se muestra cuando un paso falla.
 *
 * **ANTES MOSTRABA LAS ULTIMAS 12 LINEAS, Y ESO COSTO OCHO HORAS EL 3 DE
 * SEPTIEMBRE DE 2026.** Las pruebas de navegador corren TODAS y encuentran
 * TODAS las fallas, pero las ultimas 12 lineas son el rastro de UNA SOLA. Asi
 * que se arreglaba una, se corrian 45 minutos de vuelta, y aparecia la
 * siguiente. Cuatro veces seguidas.
 *
 * Ahora, cuando la salida trae varias fallas, **se listan todas juntas** y
 * recien despues el detalle de la ultima. Se arreglan de una sola vez.
 */
function pistas(salida) {
  const lineas = salida.trim().split('\n').filter((l) => l.trim());
  const fallas = lineas.filter(
    (l) => /^\s*\d+\)\s+\S+\.spec\.ts/.test(l) || /^\s*\u25cf\s/.test(l),
  );
  if (fallas.length === 0) return lineas.slice(-12).join('\n');
  const listadas = [...new Set(fallas.map((l) => l.trim()))];
  return [
    listadas.length + ' prueba(s) fallaron. SON TODAS: arreglalas juntas.',
    '',
    ...listadas,
    '',
    '--- detalle de la ultima ---',
    ...lineas.slice(-12),
  ].join('\n');
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
const PASOS_DEL_FILTRO = new Set([
  'Acentos',
  'Lo que se dijo es lo que es',
  'Revisor de tipos',
  'Pruebas',
]);
const fallas = [];
const salteadosPorqueLaAppNoCambio = [];
const appPudoCambiar = laAppPudoCambiar();

console.log('\n¿SE PUEDE PUBLICAR?\n' + '='.repeat(60));

for (const paso of PASOS) {
  if (soloRapidos && paso.caro) {
    console.log(`  (salteado por --rapido)  ${paso.nombre}`);
    continue;
  }
  if (modoFiltro && !PASOS_DEL_FILTRO.has(paso.nombre)) continue;
  if (paso.caro && !appPudoCambiar) {
    console.log(`  ${paso.nombre}: NO CORRE. La app no cambio: este cambio no toca nada que el usuario vea.`);
    salteadosPorqueLaAppNoCambio.push(paso.nombre);
    continue;
  }
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

async function mostrarMetricasAuditadas() {
  try {
    const { calcularMetricasAuditadas } = await import('./actualizar-auditado.mjs');
    const metricas = calcularMetricasAuditadas();
    console.log(`  Auditadas de verdad: ${metricas.totalAuditadasNivel4Mas} de ${metricas.totalPantallas} pantallas (${metricas.porcentaje}%).`);
    console.log(`  Módulos auditados con el método completo: ${metricas.modulosCompletos} de ${metricas.totalModulos}.`);
  } catch {}

  try {
    const { verificarConexionesNode } = await import('./conexiones-estado.mjs');
    const con = verificarConexionesNode();
    console.log(`  ${con.resumenTexto}`);
  } catch {}

  try {
    const { verificarEsteticaNode } = await import('./control-estetica.mjs');
    const est = verificarEsteticaNode();
    console.log(`  ${est.resumenTexto}\n`);
  } catch {}
}

if (fallas.length === 0) {
  if (modoFiltro) {
    console.log('\n  El filtro pasó. La subida sigue.\n');
    await mostrarMetricasAuditadas();
    console.log('  Ojo: esto NO alcanza para publicar. Antes de fusionar hay que correr');
    console.log('  la puerta completa: npm run "publicar?"\n');
    process.exit(0);
  }
  if (soloRapidos) {
    console.log('\nLos controles rápidos pasaron. FALTA la prueba de la app usada de verdad:');
    await mostrarMetricasAuditadas();
    console.log('corré esto mismo sin --rapido antes de publicar.\n');
    process.exit(0);
  }
  if (salteadosPorqueLaAppNoCambio.length > 0) {
    console.log('\n  SE PUEDE PUBLICAR.\n');
    console.log('  Este cambio NO toca la app: son documentos, notas o comentarios.');
    console.log(`  Por eso no corrio: ${salteadosPorqueLaAppNoCambio.join(', ')}.`);
    console.log('  No es que hayan pasado: es que no hacia falta correrlos, y se dice.');
    console.log('  Lo demas —acentos, tipos, pruebas y la base protegida— si paso.\n');
    await mostrarMetricasAuditadas();
    process.exit(0);
  }
  console.log('\n  SE PUEDE PUBLICAR.\n');
  console.log('  Todo marcha: acentos, tipos, pruebas, compila, la base protegida');
  console.log('  y la app probada usándose de verdad.\n');
  await mostrarMetricasAuditadas();
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
