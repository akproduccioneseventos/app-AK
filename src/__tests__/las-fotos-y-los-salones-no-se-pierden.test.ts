/**
 * MATAFUEGO — Dos personas a la vez no se pisan en fotos ni en salones, y borrar el ULTIMO
 * queda guardado.
 *
 * Tres defectos que encontro Codex el 22 de setiembre de 2026:
 *
 * 1. **Subir dos fotos al mismo tiempo perdia una.** Cada guardado lee la lista entera, la
 *    cambia y la escribe entera; sin turno, la segunda escribe encima de la primera y las dos
 *    pantallas dicen que salio bien.
 * 2. **Dos personas editando salones DISTINTOS perdian un cambio**, por lo mismo.
 * 3. **Borrar la ultima foto o el ultimo salon no quedaba guardado.** La escritura de lista
 *    vacia se ignora a proposito para no perder datos de golpe, asi que la tarjeta
 *    desaparecia de la pantalla y al recargar volvia a estar.
 *
 * Y la mitad que siempre se olvida: **la lectura va ADENTRO del turno**. Con la lectura
 * afuera el candado no sirve de nada, que es la forma exacta que ya habia aparecido en cobros
 * y en proveedores.
 *
 * Se probo rompiendolo a proposito: sacando el turno de cualquiera de los dos archivos, o
 * sacando el permiso de vaciado, la comprobacion que le corresponde se pone en rojo.
 */
import fs from 'fs';
import path from 'path';

const leer = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), 'utf-8');

const FOTOS = leer('src', 'app', 'actions', 'catalogo-fotos.ts');
const SALONES = leer('src', 'app', 'actions', 'salones.ts');
const SINCRONIZACION = leer('src', 'lib', 'firebase-sync.ts');

function cuerpo(codigo: string, nombre: string): string {
  const inicio = codigo.indexOf(`export async function ${nombre}(`);
  if (inicio === -1) throw new Error(`No encontre ${nombre}`);
  const fin = codigo.indexOf('\nexport async function ', inicio + 10);
  return codigo.slice(inicio, fin === -1 ? undefined : fin);
}

describe('Las fotos y los salones no se pierden', () => {
  const guardadosDeFotos = ['addCatalogoFoto', 'updateCatalogoFoto', 'deleteCatalogoFoto', 'toggleCatalogoFotoDestacada'];

  it.each(guardadosDeFotos)('%s toca el catalogo por turno', (nombre) => {
    expect(cuerpo(FOTOS, nombre)).toContain('turnoDelCatalogo.runExclusive');
  });

  it.each(guardadosDeFotos)('%s lee la lista ADENTRO del turno, no afuera', (nombre) => {
    const fn = cuerpo(FOTOS, nombre);
    expect(fn.indexOf('runExclusive')).toBeLessThan(fn.indexOf('await getCatalogoFotos()'));
  });

  it.each(['saveSalon', 'deleteSalon'])('%s toca los salones por turno, leyendo adentro', (nombre) => {
    const fn = cuerpo(SALONES, nombre);
    expect(fn).toContain('turnoDeSalones.runExclusive');
    expect(fn.indexOf('runExclusive')).toBeLessThan(fn.indexOf('await leerSalones()'));
  });

  it('borrar la ultima foto y el ultimo salon queda guardado', () => {
    const inicio = SINCRONIZACION.indexOf('ALLOW_EMPTY_ARRAY_RESET_FILES');
    const lista = SINCRONIZACION.slice(inicio, SINCRONIZACION.indexOf(']);', inicio));
    expect(lista).toContain("'catalogo-fotos.json'");
    expect(lista).toContain("'salones.json'");
  });
});
