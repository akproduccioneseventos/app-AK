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
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';

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
    /**
     * EL CORTAFUEGOS. Va ANTES de la tanda completa, y por algo medido.
     *
     * La puerta entera son unos cincuenta minutos y, cuando frena, frena casi siempre
     * en las pruebas de navegador, al minuto cuarenta. Se miraron las ultimas fallas:
     * **ocho de ocho estaban en pruebas nuevas o recien tocadas**, ninguna en las
     * viejas. Correr solo esas cuesta dos o tres minutos.
     *
     * No reemplaza a la tanda completa -dos pruebas que pasan por separado pueden
     * romper juntas-: lo unico que hace es **fallar temprano y barato**.
     */
    nombre: 'Las pruebas nuevas, primero',
    comando: 'node scripts/pruebas-nuevas-primero.mjs',
    queSignifica: 'Una prueba de navegador nueva o recien tocada no pasa. Antes esto se descubria a los cuarenta minutos.',
    caro: true,
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

/**
 * LA PUERTA RETOMA DONDE QUEDO.
 *
 * **Esto costo dos horas la noche del 14 de septiembre de 2026.** El contenedor se cayo
 * dos veces con la puerta a la mitad y las dos veces hubo que empezar de cero: acentos,
 * tipos, pruebas y una compilacion de seis minutos que ya habian dado bien sobre el
 * MISMO codigo, sin que nadie tocara un archivo. Cincuenta minutos de reloj por cada
 * caida. El dueno lo marco asi: *"tenes que buscar un mecanismo mas corto a prueba de
 * errores"*.
 *
 * Lo que se guarda es **que paso bien Y sobre que codigo exacto**. La huella mezcla el
 * commit, lo que esta sin guardar y lo que esta sin agregar: si se toca una coma en
 * cualquier archivo, la huella cambia y **no se saltea nada**. Por eso esto no puede
 * dejar pasar un cambio sin verificar: no hay forma de reusar un paso viejo con codigo
 * nuevo.
 *
 * Se tira a la basura sola a las doce horas, por si el entorno cambio abajo (una
 * biblioteca reinstalada, otro navegador) aunque el codigo sea el mismo.
 *
 * Para ignorarla a proposito: `AK_PUERTA_DESDE_CERO=true`.
 */
const AVANCE = '.ak-puerta-avance.json';
const HORAS_QUE_VALE = 12;

/**
 * Lo que la propia corrida escribe NO cuenta para la huella.
 *
 * Primer intento fallido, la misma noche: la puerta anotaba su medicion de deuda y los
 * datos de prueba, la huella cambiaba sola **entre una corrida y la siguiente sin que
 * nadie tocara una linea**, y el avance no servia para nada. Se miran solo los archivos
 * del codigo.
 */
const NO_ES_CODIGO_PARA_LA_HUELLA = [
  ':(exclude)data',
  ':(exclude)src/data',
  ':(exclude)docs/deuda-medida.json',
  ':(exclude)docs/auditado.json',
  ':(exclude)test-results',
];

/**
 * DOS HUELLAS, PORQUE NO TODO DEPENDE DE TODO.
 *
 * **El dueno lo pidio dos veces: "reduci a la mitad el proceso".** La mitad del tiempo se
 * iba repitiendo la compilacion y las pruebas de navegador —45 de los 55 minutos— por
 * cambios que **no pueden afectarlas**: escribir una orden, anotar un arreglo, corregir un
 * texto de la documentacion.
 *
 * Asi que cada paso mira lo que de verdad lo puede cambiar:
 *
 * - Los pasos que miran **el codigo** —tipos, pruebas, compilacion, seguridad de la base y
 *   las dos de navegador— usan la huella del codigo: no la mueve tocar un documento.
 *   Y las dos de navegador usan una todavia mas acotada: tampoco las mueve agregar una
 *   prueba de Jest, que no entra en la aplicacion.
 * - Los pasos que miran **todo** —acentos, "lo que se dijo es lo que es" y el trinquete—
 *   usan la huella completa, porque leen los documentos tambien.
 *
 * **Esto no afloja nada:** lo que cambia el codigo sigue obligando a correr todo. Lo unico
 * que se evita es repetir cincuenta minutos por una coma en un documento.
 */
const SOLO_DOCUMENTOS = [
  ':(exclude)docs',
  ':(exclude)*.md',
  ':(exclude)ESTADO-ACTUAL.md',
];

const PASOS_QUE_MIRAN_TODO = new Set([
  'Acentos',
  'Lo que se dijo es lo que es',
  'El trinquete',
]);

/**
 * LAS PRUEBAS DE JEST NO PUEDEN CAMBIAR LO QUE VE EL USUARIO.
 *
 * **Orden del dueno, 17 de septiembre de 2026: "el navegador es el que hay que optimizar".**
 * Medido: el navegador son 24 de los 30 minutos. Y se repetia entero por agregar **una prueba
 * de Jest**, que no entra en la aplicacion: no se compila en la pagina, no la ve nadie desde el
 * navegador, no puede romper una pantalla.
 *
 * En una tanda normal se agregan tres o cuatro pruebas de esas. Eso era una hora de navegador
 * repetido para nada.
 */
const NO_AFECTA_AL_NAVEGADOR = [
  ':(exclude)src/__tests__',
  ':(exclude)jest.config.js',
  ':(exclude)jest.setup.js',
];

const PASOS_DEL_NAVEGADOR = new Set([
  'La app usada de verdad',
  'Recorrido de todas las pantallas',
]);

/**
 * La huella mira el CONTENIDO de los archivos que le importan a ese paso, no en que commit
 * estamos.
 *
 * Antes entraba `git rev-parse HEAD`, asi que **cualquier commit invalidaba todo**: anotar un
 * arreglo en la documentacion y volver a esperar media hora de navegador. Ahora se miran los
 * archivos: si su contenido es el mismo, el paso ya se sabe que da bien.
 */
function huellaCon(filtros) {
  const filtro = filtros.map((p) => `'${p}'`).join(' ');
  const partes = [
    spawnSync(`git ls-files -s -- . ${filtro}`, { shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).stdout || '',
    spawnSync(`git status --porcelain -- . ${filtro}`, { shell: true, encoding: 'utf8' }).stdout || '',
    spawnSync(`git diff HEAD -- . ${filtro}`, { shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).stdout || '',
  ];
  return createHash('sha1').update(partes.join('|')).digest('hex');
}

function huellaDelCodigo() {
  return huellaCon([...NO_ES_CODIGO_PARA_LA_HUELLA, ...SOLO_DOCUMENTOS]);
}

function huellaDeTodo() {
  return huellaCon(NO_ES_CODIGO_PARA_LA_HUELLA);
}

/** El codigo que de verdad puede cambiar lo que se ve en el navegador. */
function huellaDeLaApp() {
  return huellaCon([...NO_ES_CODIGO_PARA_LA_HUELLA, ...SOLO_DOCUMENTOS, ...NO_AFECTA_AL_NAVEGADOR]);
}

/** Que huella le corresponde a cada paso. */
function huellaDelPaso(nombre, huellas) {
  if (PASOS_QUE_MIRAN_TODO.has(nombre)) return huellas.todo;
  if (PASOS_DEL_NAVEGADOR.has(nombre)) return huellas.app;
  return huellas.codigo;
}

function leerAvance() {
  if (process.env.AK_PUERTA_DESDE_CERO === 'true') return {};
  try {
    const guardado = JSON.parse(readFileSync(AVANCE, 'utf8'));
    if (Date.now() - (guardado.cuando || 0) > HORAS_QUE_VALE * 3600 * 1000) return {};
    return guardado.pasos || {};
  } catch {
    return {};
  }
}

function anotarAvance(pasos) {
  try {
    writeFileSync(AVANCE, JSON.stringify({ cuando: Date.now(), pasos }, null, 2));
  } catch {}
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
    // Jest marca la falla con el circulo Y el nombre de la prueba. El compilador
    // tambien imprime circulos -"(SSG) prerendered as static HTML"-, asi que se
    // pide que despues del circulo venga algo con forma de prueba.
    (l) => /^\s*\d+\)\s+\S+\.spec\.ts/.test(l) || /^\s*\u25cf\s+\S.*\s\u203a\s/.test(l),
  );
  /**
   * Lo que imprime el corredor de navegador por su cuenta, y que hay que mostrar
   * SIEMPRE. Sin esto la puerta decia "una pantalla tiro un error de React" y no
   * decia CUAL: para saberlo habia que volver a correr 45 minutos. Paso el 4 de
   * septiembre de 2026, despues de que el mismo agujero costara ocho horas.
   */
  const delCorredor = lineas.filter(
    (l) => /^\s*\u2715\s/.test(l) || /^\s{2,}\S+\s+->\s/.test(l) || /DONDE SE VA EL TIEMPO/.test(l),
  );
  // Las rutas que fallaron, que es el dato que uno busca cuando una pantalla se rompe.
  const rutas = [...new Set(
    lineas.flatMap((l) => [...l.matchAll(/(\/[a-z0-9\[\]_-]+(?:\/[a-z0-9\[\]_.-]+)*)\s+(?:tir|no |qued)/gi)].map((m) => m[1])),
  )];

  const extra = [];
  if (rutas.length > 0) extra.push('', 'PANTALLAS QUE FALLARON:', ...rutas.map((r) => '  ' + r));
  if (delCorredor.length > 0) extra.push('', ...delCorredor.map((l) => l.replace(/\s+$/, '')));

  if (fallas.length === 0) {
    return [...lineas.slice(-14), ...extra].join('\n');
  }
  const listadas = [...new Set(fallas.map((l) => l.trim()))];
  return [
    listadas.length + ' prueba(s) fallaron. SON TODAS: arreglalas juntas.',
    '',
    ...listadas,
    ...extra,
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
/**
 * UNA PUERTA POR VEZ.
 *
 * **Esto costo casi dos horas el 9 de septiembre de 2026.** Quedaron DOS puertas
 * corriendo a la vez sobre la misma carpeta: se pelean la maquina, se pisan la
 * compilacion y una da fallas inventadas. Peor todavia, una quedo huerfana escribiendo
 * en un archivo que nadie miraba.
 *
 * El turno vale para la puerta entera, no solo para las pruebas de navegador: es el
 * unico lugar donde se puede frenar antes de gastar los cincuenta minutos.
 */
const TURNO_DE_LA_PUERTA = '.ak-puerta-en-curso';

function hayOtraPuertaAndando() {
  if (!existsSync(TURNO_DE_LA_PUERTA)) return false;
  try {
    const pid = Number(readFileSync(TURNO_DE_LA_PUERTA, 'utf8').trim());
    if (!pid || pid === process.pid) return false;
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

if (hayOtraPuertaAndando()) {
  console.error('\nYA HAY UNA PUERTA CORRIENDO. Esta no arranca.\n');
  console.error('  Dos a la vez se pelean la maquina y se pisan la compilacion:');
  console.error('  la que sale de eso no dice nada cierto.\n');
  console.error('  Espera a que termine la que esta andando.\n');
  process.exit(1);
}

try {
  writeFileSync(TURNO_DE_LA_PUERTA, String(process.pid));
  const soltar = () => {
    try {
      if (existsSync(TURNO_DE_LA_PUERTA) && readFileSync(TURNO_DE_LA_PUERTA, 'utf8').trim() === String(process.pid)) {
        unlinkSync(TURNO_DE_LA_PUERTA);
      }
    } catch {}
  };
  process.on('exit', soltar);
  process.on('SIGINT', () => { soltar(); process.exit(130); });
  process.on('SIGTERM', () => { soltar(); process.exit(143); });
} catch {}

const fallas = [];
const salteadosPorqueLaAppNoCambio = [];
const appPudoCambiar = laAppPudoCambiar();

const huellas = { codigo: huellaDelCodigo(), todo: huellaDeTodo(), app: huellaDeLaApp() };
const yaEstabanBien = leerAvance();

/**
 * NO SE ARRANCA LA VERIFICACION CON TRABAJO A MEDIO TERMINAR.
 *
 * **Error propio del 17 de septiembre de 2026, y costo mas de una hora.** Lance la verificacion
 * tres veces en una sesion: dos de ellas la arranque antes de terminar de trabajar y despues
 * segui tocando archivos. Cada vez que se toca codigo, lo que la corrida ya hizo **deja de
 * valer**, y son treinta minutos tirados.
 *
 * La regla estaba escrita —"la puerta se corre UNA vez, al final"— y no estaba enganchada, que
 * es el mismo defecto que esta app persigue en el codigo. Ahora esta enganchada: avisa antes de
 * gastar el tiempo, y al final dice si el resultado sigue valiendo.
 */
const huellaAlEmpezar = huellas.codigo;
const hayTrabajoSinCommitear = (spawnSync(
  `git status --porcelain -- . ${[...NO_ES_CODIGO_PARA_LA_HUELLA, ...SOLO_DOCUMENTOS].map((p) => `'${p}'`).join(' ')}`,
  { shell: true, encoding: 'utf8' },
).stdout || '').trim();

console.log('\n¿SE PUEDE PUBLICAR?\n' + '='.repeat(60));
if (hayTrabajoSinCommitear) {
  console.log('  OJO: hay codigo sin guardar. Si lo seguis tocando mientras esto corre,');
  console.log('  lo que ya se hizo deja de valer y hay que empezar de nuevo.');
  console.log('  Conviene terminar y commitear ANTES de arrancar.');
}
if (Object.keys(yaEstabanBien).length > 0) {
  console.log('  (se retoma lo que ya dio bien: cada paso mira solo lo que de verdad lo puede cambiar)');
}

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
  const huellaAhora = huellaDelPaso(paso.nombre, huellas);
  const anterior = yaEstabanBien[paso.nombre];
  if (anterior && anterior.huella === huellaAhora) {
    console.log(`  ${paso.nombre}... ya estaba bien (${anterior.segundos}s, corrida anterior sobre lo mismo)`);
    continue;
  }
  process.stdout.write(`  ${paso.nombre}... `);
  const arranque = Date.now();
  const { ok, salida } = correr(paso.comando);
  const segundos = ((Date.now() - arranque) / 1000).toFixed(0);
  console.log(ok ? `bien (${segundos}s)` : `FALLA (${segundos}s)`);
  if (ok) {
    yaEstabanBien[paso.nombre] = { segundos: Number(segundos), huella: huellaAhora };
    anotarAvance(yaEstabanBien);
  }
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
  if (huellaDelCodigo() !== huellaAlEmpezar) {
    console.log('\n  ESTE RESULTADO NO VALE.\n');
    console.log('  Se toco el codigo mientras la verificacion corria, asi que lo que');
    console.log('  paso se probo sobre una version que ya no existe. Hay que correrla');
    console.log('  de nuevo, entera, con el trabajo terminado.\n');
    process.exit(1);
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
