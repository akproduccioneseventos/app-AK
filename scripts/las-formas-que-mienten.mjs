#!/usr/bin/env node
/**
 * LAS FORMAS QUE MIENTEN: busca solo las formas exactas de defecto que ya aparecieron.
 *
 * **Orden del dueno, 18 de septiembre de 2026: "mejorá el mecanismo, Codex sigue encontrando
 * cosas".** Tenia razon y el problema era de fondo: **mis preguntas son preguntas.** Dependen de
 * que alguien se acuerde de hacerselas. Codex encuentra cosas porque LEE el codigo, no porque
 * tenga mejores preguntas.
 *
 * Lo que si funciona en esta app son los controles que corren solos —el de "dijo que si y no paso
 * nada", el de las animaciones de mentira—. Este es de esos: **cada forma de defecto que Codex
 * encontro, buscada mecanicamente en todo el codigo, cada vez.**
 *
 * Informa siempre; **frena solo por lo que cambio en esta rama**, igual que el control de "lo que
 * se dijo es lo que es". Si frenara por lo viejo, no se podria subir nada y terminaria apagado.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const RAIZ = process.cwd();
const CARPETAS = ['src'];
const EXTENSIONES = ['.ts', '.tsx', '.mjs'];
const NO_MIRAR = ['node_modules', '.next', '__tests__', 'tests/e2e'];

function archivos(dir, acumulado = []) {
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    const rel = relative(RAIZ, ruta);
    if (NO_MIRAR.some((n) => rel.includes(n))) continue;
    if (statSync(ruta).isDirectory()) archivos(ruta, acumulado);
    else if (EXTENSIONES.some((e) => entrada.endsWith(e))) acumulado.push(rel);
  }
  return acumulado;
}

/**
 * Cada forma lleva el caso real del que salio. Eso importa: cuando esto se ponga en rojo dentro
 * de dos meses, el que lo lea tiene que entender POR QUE en diez segundos.
 */
const FORMAS = [
  {
    nombre: 'El error que se tira a la basura',
    porque: 'Un borrado o un envio que falla y se traga el error, y despues se devuelve exito. Paso con el borrado de fotos del video de vida: decia "fotos eliminadas" con las fotos ahi.',
    buscar: /\.catch\(\s*\(\s*\w*\s*\)\s*=>\s*\{\s*(\/\*[^*]*\*\/|\/\/[^\n]*)?\s*\}\s*\)/g,
    comoSeArregla: 'Contar los que fallaron y devolver exito solo si no quedo ninguno. Si quedaron, decir cuantos.',
  },
  {
    nombre: 'El cartel de exito sin esperar el resultado',
    porque: 'Se anuncia "copiado" o "compartido" sin mirar si funciono. Paso en la hoja del DJ: decia "Enlace Copiado" con el portapapeles bloqueado.',
    // No cuenta cuando se encadena `.then(...).catch(...)`: ahi si se esta mirando el resultado.
    buscar: /(?<!await\s)(?<!return\s)navigator\.(?:clipboard\.writeText|share)\((?:[^;\n]*)\)(?!\s*\.(?:then|catch))/g,
    comoSeArregla: 'Esperar el resultado y avisar distinto si fallo, dejando al que lo usa una forma de seguir.',
  },
  {
    nombre: 'La comparacion que apaga al revisor de tipos',
    porque: 'Un control que compara un campo con `as any` puede estar mirando un campo que no existe, y entonces no frena nunca. Paso con el borrado de equipos: comparaba `activoId`, que no existe.',
    buscar: /\(\s*\w+\s+as\s+any\s*\)\.\w+\s*===/g,
    comoSeArregla: 'Poner el campo en el tipo, o comprobar contra el campo que el dato tiene de verdad.',
  },
  {
    nombre: 'La fecha suelta convertida por el navegador',
    porque: 'Una fecha escrita como dia suelto se entiende como hora de Greenwich y en Uruguay retrocede un dia. Paso en la hoja del DJ: se imprimia el dia anterior.',
    buscar: /new Date\(\s*\w*[Ff]echa\w*\s*\)\s*\.toLocale/g,
    comoSeArregla: 'Armar la fecha con los tres numeros del texto, sin que la zona horaria la mueva. Mirar `src/lib/reportes/rango-de-dias.ts`.',
  },
  // ── Desde la pregunta 117, cada pregunta nueva del método trae su escaneo acá, o figura en
  // ── PREGUNTAS_QUE_NO_SE_PUEDEN_ESCANEAR con el control que la cubre. Lo exige
  // ── src/__tests__/cada-pregunta-nueva-tiene-su-escaneo.test.ts (orden del dueño, 12/11/2026).
  {
    pregunta: 88,
    nombre: 'La hora de Greenwich puesta en un campo de fecha y hora local',
    porque: '"Crear publicación" proponía la hora tres horas adelantada, y cada edición la corría otras tres (auditor, 12/11/2026).',
    buscar: /toISOString\(\)\.(?:substring|slice)\(0,\s*16\)/g,
    comoSeArregla: 'Armar AAAA-MM-DDTHH:mm con la hora de Uruguay (src/lib/fechas/).',
  },
  {
    pregunta: 135,
    nombre: 'Una nota interna a la vista del cliente',
    porque: 'La página del Club Uruguay mostraba "Condición comercial del dueño" y "Foto cargada desde el módulo maestro de salones" (revisión comercial, 13/11/2026).',
    buscar: /m[oó]dulo maestro de salones|Condici[oó]n comercial del due[nñ]o|cuentas regresivas inventadas|no habilitaci[oó]n legal certificada/g,
    comoSeArregla: 'Escribir lo que le sirve al cliente; lo que es para el equipo va en un comentario o en el panel.',
  },
  {
    pregunta: 121,
    nombre: 'El texto para mandar afuera con marcadores sin completar',
    porque: 'El generador de marketing dejaba salir "[NOMBRE]" y "[X] años" en textos para redes (auditor, 12/11/2026).',
    buscar: /\[(?:NOMBRE|FECHA|MES\/AÑO|CLIENTE|EVENTO)\]|\[X\] años/g,
    comoSeArregla: 'Usar {{CLAVE}} con su reemplazo, y no dejar copiar si queda alguno sin dato.',
  },
  {
    pregunta: 124,
    nombre: 'La pantalla que corre una corrección antes de mostrar nada',
    porque: 'Presupuestos esperaba una corrección de fechas que lee la lista entera: 22 segundos en el celular (auditor, 12/11/2026).',
    buscar: /await\s+(?:withTimeout\(\s*)?(?:repair|migrate|reparar|migrar)\w*\(/g,
    comoSeArregla: 'Mostrar primero y correr la corrección después, sin esperarla, o una sola vez.',
  },
  {
    pregunta: 128,
    nombre: 'El booleano que no puede volver a falso',
    porque: 'isCeliac se calculaba "=== Celiaco || inv.isCeliac": pasar a "Ninguna" dejaba al invitado celíaco para la cocina (auditor, 12/11/2026).',
    buscar: /===\s*'[^']+'\s*\|\|\s*\w+\.is[A-Z]\w*/g,
    comoSeArregla: 'Calcular el campo sólo del valor nuevo; si el valor nuevo no vino, conservar los dos campos juntos.',
  },
  {
    pregunta: 138,
    nombre: 'La conversación filtrada por la pestaña activa',
    porque: 'El chat del equipo escondía la respuesta del especialista porque filtraba por el agente elegido (evaluación de Sofía, 13/11/2026).',
    buscar: /\.agentType\s*&&\s*\w+\.agentType\s*!==\s*active\w*/g,
    comoSeArregla: 'Mostrar en la conversación en curso todo lo que llega, con el nombre de quien contestó.',
  },
];

/**
 * Preguntas del método que no tienen una forma buscable con una expresión: cada una nombra el
 * control que la cubre. Si no se puede nombrar ninguno, la pregunta no está terminada.
 */
const PREGUNTAS_QUE_NO_SE_PUEDEN_ESCANEAR = {
  145: 'Reemplazos de servicios pagos: pruebas test_fotos_edita_cada_foto y test_fotos_cara_principal (orden 307).',
  143: 'Etiquetas de plata que dicen otra cosa: prueba la-contabilidad-dice-lo-que-cuenta (orden 301).',
  144: 'Cobros con la fecha real: tests/firebase/poner-al-dia-guarda-la-fecha-real.test.ts (orden 301) y poner-al-dia-no-marca-cobros-solo.',
  137: 'Lo que se limpia en una pantalla y no en las otras: prueba cada-fiesta-se-cuenta-una-vez (orden 305), con la lectura central en getFiestas.',
  139: 'Pantallas del portal sin sesión: prueba el-portal-y-los-recuerdos-piden-al-cliente (orden 303), que recorre decoración, moodboard, mesas y recuerdos.',
  140: 'Promesas de la IA: prueba sofia-no-improvisa-paquetes-ni-fechas (orden 304).',
  141: 'Ejemplos que no dan resultado: prueba el-buscador-encuentra-lo-que-sugiere (orden 306).',
  142: 'Demostraciones contadas como reales: prueba cada-fiesta-se-cuenta-una-vez (orden 305, bloque 2).',
  117: 'Las fechas que salen a Google Calendar o a un .ics: prueba de la orden 285 (calendar-links con ctz).',
  118: 'Botones que arman enlaces con un dato guardado: el recorrido de pantallas abre cada destino.',
  119: 'Pantallas de estado que dicen "listo": prueba el-control-del-respaldo-mira-si-anda (orden 286).',
  120: 'Tareas que fallan seguido sin avisar: prueba el-respaldo-que-falla-avisa (orden 286) y tareas-no-marcan-exito-al-fallar.',
  122: 'Estados "subido" sin comprobar del otro lado: prueba test_wfolio_no_dice_subido_sin_ver (orden 288).',
  123: 'Forma esperada contra forma guardada: src/__tests__/el-respaldo-espera-la-forma-que-se-guarda.test.ts.',
  125: 'IA que cae al respaldo sin avisar: prueba la-ia-que-cae-al-respaldo-avisa (orden 291), con la anotación de raíz en genkit.',
  126: 'Lo que incluye un paquete sale de los datos: prueba sofia-no-inventa-los-paquetes (orden 291).',
  130: 'Destinos que no existen: src/__tests__/ningun-enlace-lleva-a-una-pagina-que-no-existe.test.ts revisa todos en cada publicación.',
  131: 'Gasto de IA sin freno antes: prueba el-asistente-frena-antes-de-gastar (orden 294).',
  132: 'Fechas pasadas desde afuera: prueba de public-simulator-persistence (servidor) y el-simulador-no-ofrece-dias-pasados (orden 295).',
  129: 'Pruebas contra la base de verdad: lo exige src/__tests__/lo-que-guarda-se-prueba-contra-la-base.test.ts con docs/ida-y-vuelta-pendientes.json.',
  133: 'Lo accesorio no tumba la respuesta: src/__tests__/el-auditor-prueba-la-ia-sin-guardar.test.ts (registrarConsumoIA no lanza nunca).',
  134: 'Lo generado al compilar llega al paquete publicado: scripts/copiar-pwa-al-standalone.mjs frena la compilación, con src/__tests__/el-modo-sin-conexion-llega-a-la-version-publicada.test.ts.',
  136: 'Testimonios y demostraciones reales: src/__tests__/la-web-no-inventa-testimonios.test.ts (orden 297).',
  127: 'Bajas que no llegan a la base: raíz en firebase-sync, pruebas borrar-el-ultimo-queda-borrado y sacar-un-dato-lo-saca-de-la-base (orden 292).',
};


const soloLoQueCambio = process.argv.includes('--lo-que-cambio');

function loQueCambio() {
  const base = spawnSync('git merge-base HEAD origin/main', { shell: true, encoding: 'utf8' }).stdout.trim();
  if (!base) return null;
  const salida = spawnSync(`git diff --name-only ${base} HEAD; git diff --name-only HEAD; git ls-files --others --exclude-standard`, { shell: true, encoding: 'utf8' }).stdout || '';
  return new Set(salida.split('\n').map((l) => l.trim()).filter(Boolean));
}

const cambiados = soloLoQueCambio ? loQueCambio() : null;
const hallazgos = [];

for (const carpeta of CARPETAS) {
  for (const archivo of archivos(join(RAIZ, carpeta))) {
    const texto = readFileSync(join(RAIZ, archivo), 'utf8');
    for (const forma of FORMAS) {
      forma.buscar.lastIndex = 0;
      let encontrado;
      while ((encontrado = forma.buscar.exec(texto)) !== null) {
        const linea = texto.slice(0, encontrado.index).split('\n').length;
        // LA PUERTA DE ESCAPE, Y PIDE UN MOTIVO ESCRITO.
        // A veces esta bien ignorar una falla —que no suene la musica de fondo no rompe nada—.
        // Pero "esta bien" hay que poder decirlo con palabras: si no se escribe el motivo, el
        // control lo cuenta. Eso es lo que separa una decision de un descuido.
        const renglones = texto.split('\n');
        const contexto = renglones.slice(Math.max(0, linea - 4), linea).join('\n');
        if (/no pasa nada si falla:/i.test(contexto)) continue;
        hallazgos.push({ archivo, linea, forma, esNuevo: cambiados ? cambiados.has(archivo) : false });
      }
    }
  }
}

const aMirar = soloLoQueCambio ? hallazgos.filter((h) => h.esNuevo) : hallazgos;

if (aMirar.length === 0) {
  console.log(`Las formas que mienten: ninguna${soloLoQueCambio ? ' en lo que cambió' : ''}.`);
  process.exit(0);
}

console.log(`\nLAS FORMAS QUE MIENTEN — ${aMirar.length} lugar(es)${soloLoQueCambio ? ' en lo que cambió' : ''}:\n`);
console.log('  Si en algun caso esta bien ignorar la falla, se escribe el motivo en un comentario');
console.log('  que empiece con "no pasa nada si falla:" y este control lo deja pasar.\n');
for (const forma of FORMAS) {
  const suyos = aMirar.filter((h) => h.forma === forma);
  if (suyos.length === 0) continue;
  console.log(`  ${forma.nombre} — ${suyos.length}`);
  console.log(`    ${forma.porque}`);
  console.log(`    Se arregla asi: ${forma.comoSeArregla}`);
  for (const h of suyos.slice(0, 12)) console.log(`      ${h.archivo}:${h.linea}`);
  if (suyos.length > 12) console.log(`      ...y ${suyos.length - 12} mas`);
  console.log('');
}

process.exit(soloLoQueCambio ? 1 : 0);
