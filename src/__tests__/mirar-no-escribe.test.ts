/**
 * MATAFUEGO — Auditoría profunda del 23/11/2026 (hallazgos 1 y 2), pregunta 207: mirar no escribe.
 * La lista de fiestas inventaba y guardaba un código por cada fiesta sin código al abrirse, y la lista de presupuestos
 * reescribía todas las fechas al montarse, también con la sesión del auditor. Abrir una pantalla no cambia datos.
 */
import fs from 'fs';
import path from 'path';
import { codigoDeFiesta } from '@/lib/fiesta/codigo-de-fiesta';

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');
function cuerpo(fuente: string, firma: string): string {
  const i = fuente.indexOf(firma);
  expect(i).toBeGreaterThan(-1);
  const sig = fuente.indexOf('\nexport async function', i + firma.length);
  return fuente.slice(i, sig === -1 ? undefined : sig);
}

describe('mirar no escribe', () => {
  const fiestaActions = leer('src/app/actions/fiesta/fiesta.actions.ts');
  it('leer la lista de fiestas no guarda nada', () => {
    expect(cuerpo(fiestaActions, 'export async function getFiestas(')).not.toMatch(/updateDataPartial|writeData|mutate/);
  });
  it('abrir una fiesta no guarda nada', () => {
    const i = fiestaActions.indexOf('leerFiestaConEstado');
    const desde = fiestaActions.indexOf('async function leerFiestaConEstado', i);
    expect(desde).toBeGreaterThan(-1);
    const hasta = fiestaActions.indexOf('export async function getFiestaParaPantalla', desde);
    expect(fiestaActions.slice(desde, hasta)).not.toMatch(/updateDataPartial|writeData/);
  });
  it('el código de la fiesta sale igual siempre, sin guardarlo, y respeta el guardado', () => {
    const a = codigoDeFiesta({ id: 'fiesta_1' });
    expect(a).toMatch(/^[2-9A-HJKMNP-Z]{6}$/);
    expect(codigoDeFiesta({ id: 'fiesta_1' })).toBe(a);
    expect(codigoDeFiesta({ id: 'fiesta_2' })).not.toBe(a);
    expect(codigoDeFiesta({ id: 'fiesta_1', codigoFiesta: 'abc234' })).toBe('ABC234');
  });
  it('el que entra con el código encuentra la fiesta aunque el código no esté guardado', () => {
    expect(leer('src/app/actions/entrar-como-invitado.ts')).toMatch(/codigoDeFiesta\(f\) === codigoNormalizado/);
  });
  it('la reparación de fechas de presupuestos no reescribe nada con una sesión de sólo mirar', () => {
    expect(cuerpo(leer('src/app/actions/presupuestos.ts'), 'export async function repairVerifiedBudgetDates(')).toMatch(
      /esSesionDeSoloLectura\(\)\) return \{ success: true, changedCount: 0 \}/,
    );
  });
});
