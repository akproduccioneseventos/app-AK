#!/usr/bin/env node
/**
 * "DIJO QUE SI Y NO PASO NADA" — EL CONTROL QUE LO FRENA EN TODA LA APP.
 *
 * **De donde sale.** El 8 de septiembre de 2026 aparecieron cinco defectos contables
 * con la misma forma exacta: se llamaba a una funcion que **devuelve** el error en vez
 * de tirarlo, nadie miraba el resultado, y la pantalla contestaba que salio bien. Una
 * cuota anunciada como cobrada sin guardarse. Un contrato firmado que no quedaba
 * registrado. Documentos subidos que no aparecian.
 *
 * Arreglarlos de a uno no alcanza: el dueno lo dijo claro —*"hay que cambiar el metodo
 * para que no suceda en toda la app"*—. Esto lo busca solo, en todos lados.
 *
 * **Que busca.** Una llamada `await unaFuncion(...)` sola en su linea —sin guardar el
 * resultado— cuando esa funcion promete devolver `{ success, error }`. Eso es tirar el
 * error a la basura.
 *
 * **Cuando de verdad no importa el resultado**, se deja dicho en la linea de arriba:
 *
 *     // no-mira-el-resultado: es un aviso secundario, si falla no cambia nada
 *     await avisarPorMail(...);
 *
 * Escribir ese motivo obliga a pensarlo una vez. Sin motivo, no pasa.
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.join(process.cwd(), 'src');
const PERMISO = 'no-mira-el-resultado:';

function archivos(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const completo = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'node_modules') continue;
      archivos(completo, acc);
    } else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) {
      acc.push(completo);
    }
  }
  return acc;
}

/** Funciones que PROMETEN devolver `{ success, error }`. */
function funcionesQueDevuelvenElError(lista) {
  const nombres = new Set();
  for (const archivo of lista) {
    const texto = fs.readFileSync(archivo, 'utf8');
    // Los parametros no pueden traer llaves ni punto y coma: sin ese limite la
    // busqueda se estiraba desde una funcion hasta la firma de OTRA y se comia las
    // del medio.
    //
    // OJO: la expresion se arma ADENTRO del bucle a proposito. Con `g`, una sola
    // compartida entre archivos se guarda por donde iba y **se saltea funciones**:
    // asi fue como este mismo control no veia `saveFiesta`, que es justo la que
    // empezo todo. Un control que mira de menos es peor que no tenerlo.
    const regex = /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*(?:<[^>]*>)?\s*\(([^;{}]{0,2000}?)\)\s*:\s*Promise<\s*\{([^}]*)\}/g;
    let m;
    while ((m = regex.exec(texto))) {
      if (/\bsuccess\b/.test(m[3])) nombres.add(m[1]);
    }
  }
  return nombres;
}

/**
 * LAS PUERTAS DE PASO. Aca se escapo el defecto que encontro Codex el 10 de
 * septiembre de 2026.
 *
 * `src/app/actions/fiesta-actual.ts` tiene 57 funciones de una linea que no hacen
 * mas que pasarle la pelota al modulo de abajo:
 *
 *     export async function updateDecoracionFiestaActual(id, d) { return await DecoracionModule.updateDecoracion(id, d); }
 *
 * Ninguna dice `: Promise<{ success }>` —lo hereda sin escribirlo—, asi que el
 * control no las veia. Y esas son justo las que llaman las pantallas. Resultado: el
 * autoguardado de la distribucion del salon anunciaba "guardado" aunque el guardado
 * hubiera fallado, y este control daba verde.
 *
 * Por eso ahora se sigue la cadena: si una funcion no hace mas que devolver lo que
 * devuelve otra que SI promete `{ success }`, tambien devuelve el error.
 */
function siguiendoLasPuertasDePaso(lista, nombres) {
  const pasos = [];
  for (const archivo of lista) {
    const texto = fs.readFileSync(archivo, 'utf8');
    const regex = /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*(?:<[^>]*>)?\s*\([^;{}]{0,2000}?\)\s*\{\s*return\s+(?:await\s+)?(?:[A-Za-z0-9_]+\s*\.\s*)?([A-Za-z0-9_]+)\s*\(/g;
    let m;
    while ((m = regex.exec(texto))) pasos.push({ de: m[1], a: m[2] });
  }
  // Se repite hasta que no aparece ninguna nueva: una puerta puede dar a otra puerta.
  let crecio = true;
  while (crecio) {
    crecio = false;
    for (const paso of pasos) {
      if (nombres.has(paso.a) && !nombres.has(paso.de)) {
        nombres.add(paso.de);
        crecio = true;
      }
    }
  }
  return nombres;
}

export function llamadasQueTiranElError() {
  const lista = archivos(SRC);
  const devuelven = siguiendoLasPuertasDePaso(lista, funcionesQueDevuelvenElError(lista));
  const hallazgos = [];

  for (const archivo of lista) {
    const lineas = fs.readFileSync(archivo, 'utf8').split('\n');
    for (let i = 0; i < lineas.length; i++) {
      const m = lineas[i].match(/^\s*await\s+([A-Za-z0-9_]+)\s*\(/);
      if (!m) continue;
      if (!devuelven.has(m[1])) continue;
      // Un `.catch(...)` en la misma linea ya es una decision tomada.
      if (lineas[i].includes('.catch(')) continue;
      const anterior = (lineas[i - 1] || '') + (lineas[i - 2] || '');
      if (anterior.includes(PERMISO)) continue;
      hallazgos.push({
        archivo: path.relative(process.cwd(), archivo),
        linea: i + 1,
        funcion: m[1],
      });
    }
  }
  return hallazgos;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('nadie-dice-que-si-sin-mirar.mjs')) {
  const hallazgos = llamadasQueTiranElError();
  if (hallazgos.length === 0) {
    console.log('Nadie dice que si sin mirar: bien, no hay llamadas que tiren el error.');
    process.exit(0);
  }
  console.error(`SE TIRA EL ERROR EN ${hallazgos.length} LUGAR(ES):\n`);
  for (const h of hallazgos) {
    console.error(`  ${h.archivo}:${h.linea}  ->  ${h.funcion}() devuelve el error y nadie lo mira`);
  }
  console.error('\n  Si de verdad no importa, poner arriba de la linea:');
  console.error(`  // ${PERMISO} <motivo en una linea>\n`);
  process.exit(1);
}
