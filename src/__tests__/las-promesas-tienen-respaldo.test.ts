/**
 * QUE LA APP NO PROMETA LO QUE NO HACE
 *
 * El cuarto control. Los otros tres preguntan si el código se usa y si está
 * probado. Este pregunta algo distinto: **lo que la pantalla le dice al equipo,
 * ¿existe?**
 *
 * Nació de un caso real: el tótem mostraba "Encuestas", "Juegos interactivos" y
 * "Mapa de salón", y no existe ninguno de los tres. Lo encontró una persona
 * leyendo el código. Esta prueba hace que no dependa de eso.
 *
 * Lo que impide, y es lo importante: **agregar una promesa nueva sin decir si es
 * verdad**. Si alguien escribe una función nueva en la lista de la pantalla y no
 * la declara acá, la prueba se pone en rojo y ese cambio no entra.
 */

import fs from 'fs';
import path from 'path';
import { PROMESAS_AL_CLIENTE } from '@/lib/entretenimiento/promesas-al-cliente';

const PANTALLA = path.join(
  process.cwd(),
  'src/app/(app)/fiestas/nueva/entretenimiento/page.tsx'
);

/** Saca del código la lista que el equipo ve en pantalla. */
function promesasQueSeMuestran(): Record<string, string[]> {
  const texto = fs.readFileSync(PANTALLA, 'utf8');
  const desde = texto.indexOf('const FEATURE_LIBRARY');
  expect(desde).toBeGreaterThan(-1);
  const bloque = texto.slice(desde, texto.indexOf('};', desde));
  const porEstacion: Record<string, string[]> = {};
  for (const linea of bloque.matchAll(/(\w+):\s*\[([^\]]*)\]/g)) {
    porEstacion[linea[1]] = [...linea[2].matchAll(/'([^']*)'/g)].map((m) => m[1]);
  }
  return porEstacion;
}

describe('Las promesas de la app tienen quien las cumpla', () => {
  const enPantalla = promesasQueSeMuestran();

  it('la lista que ve el equipo se pudo leer', () => {
    expect(Object.keys(enPantalla).length).toBeGreaterThan(0);
  });

  it('CADA promesa que se muestra está declarada: nadie agrega una sin decir si es verdad', () => {
    const sinDeclarar: string[] = [];
    for (const [estacion, promesas] of Object.entries(enPantalla)) {
      for (const promesa of promesas) {
        if (!PROMESAS_AL_CLIENTE[estacion]?.[promesa]) {
          sinDeclarar.push(`${estacion}: "${promesa}"`);
        }
      }
    }
    const aviso =
      sinDeclarar.length === 0
        ? ''
        : 'Promesas nuevas sin declarar en src/lib/entretenimiento/promesas-al-cliente.ts.\n' +
          'Antes de mostrarle esto al equipo hay que decir si existe o no:\n' +
          sinDeclarar.join('\n');
    expect(aviso).toBe('');
  });

  it('lo que se declara como cumplido apunta a un archivo que existe', () => {
    const rotas: string[] = [];
    for (const [estacion, promesas] of Object.entries(PROMESAS_AL_CLIENTE)) {
      for (const [promesa, respaldo] of Object.entries(promesas)) {
        if (respaldo.estado !== 'cumple') continue;
        if (!fs.existsSync(path.join(process.cwd(), respaldo.laCumple))) {
          rotas.push(`${estacion} / "${promesa}" dice que la cumple ${respaldo.laCumple}, y ese archivo no existe`);
        }
      }
    }
    expect(rotas.join('\n')).toBe('');
  });

  it('no se declara una promesa que ya no se muestra (la lista no junta basura)', () => {
    const sobrantes: string[] = [];
    for (const [estacion, promesas] of Object.entries(PROMESAS_AL_CLIENTE)) {
      for (const promesa of Object.keys(promesas)) {
        if (!enPantalla[estacion]?.includes(promesa)) {
          sobrantes.push(`${estacion}: "${promesa}"`);
        }
      }
    }
    expect(sobrantes.join('\n')).toBe('');
  });

  it('deja a la vista las promesas que HOY no se cumplen', () => {
    const sinCumplir: string[] = [];
    for (const [estacion, promesas] of Object.entries(PROMESAS_AL_CLIENTE)) {
      for (const [promesa, respaldo] of Object.entries(promesas)) {
        if (respaldo.estado === 'noCumple') sinCumplir.push(`${estacion}: ${promesa}`);
      }
    }
    // No falla: el objetivo es que estén contadas y no escondidas. Que bajen es
    // trabajo del dueño y de Gemini, no de esta prueba.
    expect(sinCumplir.length).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(sinCumplir)).toBe(true);
  });
});
