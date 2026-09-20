/**
 * MATAFUEGO — Una prueba apagada es un defecto que nadie va a encontrar.
 *
 * Paso el 20 de septiembre de 2026 y es la respuesta a la pregunta del dueño:
 * *"¿como se hace para que Codex no encuentre mas errores?"*. Casi nada de lo que
 * encuentra esta recien roto: **es viejo y estaba tapado por un control dormido.**
 *
 * Ese dia aparecieron dos:
 * - `tests/e2e/importar-invitados-de-una-planilla.spec.ts` estaba apagada entera con
 *   `test.describe.skip`, porque la pantalla interna no veia la fiesta de prueba. Eso se
 *   arreglo (la sesion se ponia a medias) y la prueba seguia apagada.
 * - `tests/e2e/la-hoja-de-cocina.spec.ts` se salteaba sola cuando la pantalla de comida
 *   "pedia elegir un evento", que era el mismo problema.
 *
 * Las dos son de COMIDA. Estuvieron dormidas semanas.
 *
 * Este control mira que ninguna prueba quede apagada del todo. Una prueba que **no puede
 * correr hoy** se arregla o se borra; dejarla dormida es lo peor de los dos mundos.
 *
 * Si de verdad hay que dejar una apagada, se escribe arriba un comentario que empiece con
 * "apagada a proposito:" y el motivo. Queda a la vista y se puede contar.
 */
import fs from 'fs';
import path from 'path';

const CARPETAS = [
  { dir: path.join(process.cwd(), 'tests', 'e2e'), ext: '.spec.ts' },
  { dir: path.join(process.cwd(), 'src', '__tests__'), ext: '.test.ts' },
];

/** Las formas de apagar una prueba entera. `.only` tambien: deja a las demas afuera. */
const FORMAS_DE_APAGAR: Array<{ patron: RegExp; que: string }> = [
  // Apagar el archivo entero.
  { patron: /\b(test|describe|it)\.describe\.skip\s*\(/, que: 'describe.skip (apaga el archivo entero)' },
  // Declarar una prueba ya apagada: test.skip('...'), it.skip('...'), describe.skip('...').
  { patron: /\b(describe|test|it)\.skip\s*\(\s*['"`]/, que: 'declarada con .skip (no corre nunca)' },
  // Apagarse sola siempre: test.skip(true, ...) o test.skip() pelado.
  { patron: /\btest\.skip\s*\(\s*true\b/, que: 'test.skip(true) (se apaga sola siempre)' },
  { patron: /\btest\.skip\s*\(\s*\)/, que: 'test.skip() pelado (se apaga sola siempre)' },
  // Dejar afuera a todas las demas.
  { patron: /\b(describe|test|it)\.only\s*\(/, que: 'only (deja afuera a todas las demas)' },
];

/**
 * NO cuenta como apagada la que se saltea por navegador
 * -`test.skip(testInfo.project.name !== 'chromium-desktop', ...)`-: eso es elegir en cual
 * de los dos navegadores corre, y corre igual.
 */

function archivosDe(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const completo = path.join(dir, e.name);
    if (e.isDirectory()) return archivosDe(completo, ext);
    return e.name.endsWith(ext) ? [completo] : [];
  });
}

/** Un apagado declarado: lleva arriba, hasta 4 lineas, el motivo escrito. */
function estaDeclarado(lineas: string[], indice: number): boolean {
  for (let i = Math.max(0, indice - 4); i <= indice; i++) {
    if (/apagada a proposito:/i.test(lineas[i] || '')) return true;
  }
  return false;
}

describe('Ninguna prueba esta apagada', () => {
  // Este archivo queda afuera: adentro tiene escritas las formas que busca.
  const archivos = CARPETAS.flatMap(({ dir, ext }) => archivosDe(dir, ext)).filter(
    (a) => !a.endsWith('ninguna-prueba-esta-apagada.test.ts'),
  );

  it('hay pruebas para mirar (si no, este control no mira nada)', () => {
    expect(archivos.length).toBeGreaterThan(50);
  });

  it('ninguna prueba quedo apagada sin decir por que', () => {
    const apagadas: string[] = [];

    for (const archivo of archivos) {
      const lineas = fs.readFileSync(archivo, 'utf-8').split('\n');
      lineas.forEach((linea, i) => {
        for (const { patron, que } of FORMAS_DE_APAGAR) {
          if (patron.test(linea) && !estaDeclarado(lineas, i)) {
            apagadas.push(`${path.relative(process.cwd(), archivo)}:${i + 1} — ${que}`);
          }
        }
      });
    }

    if (apagadas.length > 0) {
      throw new Error(
        'Estas pruebas estan apagadas. Una prueba apagada es un defecto que nadie va a\n' +
          'encontrar: arreglala, borrala, o escribi arriba un comentario que empiece con\n' +
          '"apagada a proposito:" y el motivo.\n  ' +
          apagadas.join('\n  '),
      );
    }
    expect(apagadas).toEqual([]);
  });
});
