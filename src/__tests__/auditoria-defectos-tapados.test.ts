/**
 * CONTROL AUTOMÁTICO 1 — Un valor de ejemplo no puede tapar el dato real.
 *
 * El defecto, que apareció cuatro veces y siempre terminó impreso en una mesa:
 *
 *   defaults = { protagonistaNombre: 'La Agasajada' }      // valor de ejemplo
 *   ...
 *   if (!datos.protagonistaNombre)                          // nunca se cumple
 *     datos.protagonistaNombre = nombreRealDeLaFiesta;      // nunca se ejecuta
 *
 * Como el valor por defecto no está vacío, la línea que pondría el dato de verdad
 * queda muerta. En pantalla: los números de mesa salían con "La Agasajada" y
 * "01/01/2025", y la carta de tragos de una boda decía "Mis XV".
 *
 * Esta prueba lo busca sola: junta todos los campos que alguna pantalla intenta
 * rellenar con `if (!algo.campo)`, y verifica que ese campo esté vacío en los
 * valores por defecto. Si alguien pone un ejemplo, falla acá y no en una mesa.
 */
import fs from 'fs';
import path from 'path';
import * as defaults from '@/lib/fiesta-defaults';

const RAIZ = process.cwd();
const PANTALLAS = 'src/app/(app)/fiestas/nueva';

function archivos(carpeta: string): string[] {
  const completa = path.join(RAIZ, carpeta);
  if (!fs.existsSync(completa)) return [];
  const salida: string[] = [];
  for (const e of fs.readdirSync(completa, { withFileTypes: true })) {
    const r = path.join(carpeta, e.name);
    if (e.isDirectory()) salida.push(...archivos(r));
    else if (/\.tsx?$/.test(e.name)) salida.push(r);
  }
  return salida;
}

/**
 * Campos que alguna pantalla intenta completar **con el dato real de la fiesta**.
 *
 * Ojo con la distinción, que es la que hace útil a esta prueba: hay rellenos que
 * ponen un valor fijo (`if (!x.fontFamily) x.fontFamily = 'Playfair Display'`) y
 * ésos son inofensivos, porque el defecto y el relleno dicen lo mismo. Los que
 * importan son los que van a buscar el dato a la fiesta: si el defecto no está
 * vacío, ese dato **nunca** se usa.
 */
function camposQueSeRellenan(): Set<string> {
  const campos = new Set<string>();
  // Captura el campo y lo que se le asigna, en la misma línea o en las dos siguientes.
  const patron = /if\s*\(\s*!\s*[A-Za-z0-9_]+\.([A-Za-z0-9_]+)\s*\)\s*\{?([^;]*;)/g;
  for (const archivo of archivos(PANTALLAS)) {
    const texto = fs.readFileSync(path.join(RAIZ, archivo), 'utf8');
    for (const m of texto.matchAll(patron)) {
      const campo = m[1];
      const loQueAsigna = m[2] || '';
      // Sólo cuenta si el relleno sale de la fiesta, no de un valor fijo.
      if (/fiesta|configuracion|config\./i.test(loQueAsigna)) campos.add(campo);
    }
  }
  return campos;
}

describe('Un valor de ejemplo no puede tapar el dato real', () => {
  const campos = camposQueSeRellenan();

  it('encuentra los rellenos de las pantallas', () => {
    expect(campos.size).toBeGreaterThan(1);
  });

  it('ningún valor por defecto tapa su propio relleno', () => {
    const problemas: string[] = [];

    for (const [nombreDelDefault, valor] of Object.entries(defaults)) {
      if (!valor || typeof valor !== 'object' || Array.isArray(valor)) continue;
      for (const [campo, contenido] of Object.entries(valor as Record<string, unknown>)) {
        if (!campos.has(campo)) continue;
        if (typeof contenido !== 'string' || contenido.trim() === '') continue;
        problemas.push(`${nombreDelDefault}.${campo} = "${contenido}"`);
      }
    }

    if (problemas.length > 0) {
      throw new Error(
        'Estos valores por defecto tapan el codigo que pondria el dato real de la ' +
        'fiesta, porque ese codigo pregunta "esta vacio?" y nunca lo esta:\n' +
        problemas.join('\n') +
        '\n\nDejalos vacios (""). El dato real lo pone la pantalla al cargar la fiesta.'
      );
    }
  });
});
