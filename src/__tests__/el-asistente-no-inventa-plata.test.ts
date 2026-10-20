/**
 * Pregunta 82 de COMO-AUDITAR (20/10/2026). La entrega 1337 trajo "los dots de AK" con el Contador
 * respondiendo "Este mes se cobraron $240.000 y restan por cobrar $85.000": un texto fijo, igual para
 * cualquier mes y cualquier empresa, presentado como un dato real. Lo mismo con la voz y los agentes.
 *
 * Lo que el asistente, la voz o un agente dice de plata sale de los datos. Este control recorre esas
 * carpetas enteras y no deja pasar un importe escrito a mano dentro de un texto.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const RAIZ = process.cwd();
const CARPETAS = [
  'src/lib/agentes',
  'src/lib/asistente',
  'src/lib/multiagent',
  'src/app/api/asistente',
];

// Un importe con separador de miles dentro de un texto: '$180.000', `$85.000`.
const IMPORTE_A_MANO = /['"`][^'"`\n]*\$\s?\d{1,3}(?:\.\d{3})+[^'"`\n]*['"`]/;

function archivos(dir: string, salida: string[] = []): string[] {
  let nombres: string[] = [];
  try {
    nombres = readdirSync(dir);
  } catch {
    return salida;
  }
  for (const nombre of nombres) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) archivos(ruta, salida);
    else if (/\.(ts|tsx)$/.test(nombre) && !/\.(test|spec)\.tsx?$/.test(nombre)) salida.push(ruta);
  }
  return salida;
}

export function importesAMano(raiz: string = RAIZ): string[] {
  const hallazgos: string[] = [];
  for (const carpeta of CARPETAS) {
    for (const ruta of archivos(join(raiz, carpeta))) {
      readFileSync(ruta, 'utf8')
        .split('\n')
        .forEach((linea, i) => {
          const sinComentario = linea.replace(/^\s*(\/\/|\*).*$/, '');
          if (IMPORTE_A_MANO.test(sinComentario)) hallazgos.push(`${relative(raiz, ruta)}:${i + 1}`);
        });
    }
  }
  return hallazgos;
}

describe('el asistente no inventa plata', () => {
  it('ningún texto del asistente, la voz o los agentes trae un importe escrito a mano', () => {
    expect(importesAMano()).toEqual([]);
  });

  it('el control frena un importe a mano (se rompe a propósito)', () => {
    expect(IMPORTE_A_MANO.test("respuesta: 'Este mes se cobraron $240.000.'")).toBe(true);
    expect(IMPORTE_A_MANO.test('respuesta: `Restan ${formatCurrency(total)}`')).toBe(false);
  });
});
