/**
 * Se prueba sólo lo que cambió de un archivo (pedido del dueño, 2/10/2026: "revisar no toda la
 * app, sólo lo modificado"). La 1249 corrió las 80 pruebas de navegador (22 minutos) porque tocó
 * los textos del contrato en un archivo que importan casi todas las pantallas por otros nombres.
 */
import { nombresCambiadosDesde, exportsQueUsan, nombresImportados, esSoloTipo } from '../../scripts/pantallas-tocadas.mjs';

const archivo = [
  "import { x } from './x';",
  '',
  '/** Comentario */',
  'export interface Ajustes {',
  '  a: string;',
  '}',
  'export const defaultContrato = {',
  "  texto: 'viejo',",
  '};',
  'const ayudante = () => 1;',
  'export function usaAyudante() {',
  '  return ayudante();',
  '}',
  'export const plantilla = `TEXTO',
  'CLÁUSULA 1 con texto suelto',
  '`;',
].join('\n');
const lineas = archivo.split('\n');

describe('Se prueba sólo lo que cambió de un archivo', () => {
  it('un cambio adentro de una declaración nombra sólo esa', () => {
    expect(nombresCambiadosDesde(lineas, [8])).toEqual(['defaultContrato']);
  });

  it('un cambio en el texto de un string largo nombra la declaración, no "todo"', () => {
    expect(nombresCambiadosDesde(lineas, [15])).toEqual(['plantilla']);
  });

  it('un comentario no cuenta, y un cambio en los imports es "todo"', () => {
    expect(nombresCambiadosDesde(lineas, [3])).toEqual([]);
    expect(nombresCambiadosDesde(lineas, [1])).toBe('*');
  });

  it('un ayudante interno sube a lo exportado que lo usa', () => {
    expect(exportsQueUsan(archivo, ['ayudante'])).toEqual(['usaAyudante']);
    expect(exportsQueUsan(archivo, ['defaultContrato'])).toEqual(['defaultContrato']);
  });

  it('qué nombres trae cada import', () => {
    expect(nombresImportados("import { a, b as c, type D } from 'x'")).toEqual(['a', 'b', 'D']);
    expect(nombresImportados("import X from 'x'")).toBe('*');
    expect(nombresImportados("import * as X from 'x'")).toBe('*');
    expect(esSoloTipo("import type { A } from 'x';", 19)).toBe(true);
    expect(esSoloTipo("import { A } from 'x';", 14)).toBe(false);
  });
});
