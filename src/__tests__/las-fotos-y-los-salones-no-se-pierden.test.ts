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

/**
 * Segunda vuelta, 23 de setiembre de 2026: **el turno en memoria no alcanza con varios
 * servidores.** La app puede correr en hasta cuatro, cada uno con su propio turno, y Codex
 * midio que dos altas de fotos en servidores distintos seguian perdiendo una. Y **los pagos de
 * los salones** ni siquiera tenian turno.
 *
 * Con la base de verdad, cada cambio tiene que tocar UN registro, dentro de una transaccion.
 * Se probo rompiendolo: volviendo cualquiera de estos a la escritura de la lista entera, se
 * pone en rojo.
 */
describe('Con varios servidores, cada cambio toca un solo registro', () => {
  it('las fotos del catalogo se crean, cambian y borran de a una en la base', () => {
    expect(cuerpo(FOTOS, 'addCatalogoFoto')).toContain('createDataItem(');
    expect(cuerpo(FOTOS, 'updateCatalogoFoto')).toContain('mutateDataItem');
    expect(cuerpo(FOTOS, 'deleteCatalogoFoto')).toContain('deleteDataItem(');
    expect(cuerpo(FOTOS, 'toggleCatalogoFotoDestacada')).toContain('mutateDataItem');
  });

  it.each(['saveSalon', 'uploadSalonFoto', 'deleteSalonFoto', 'addSalonPago', 'deleteSalonPago'])(
    '%s cambia un solo salon dentro de una transaccion',
    (nombre) => {
      expect(cuerpo(SALONES, nombre)).toContain('cambiarUnSalon(');
    },
  );

  it('con la base de verdad, cambiar un salon es una transaccion sobre ese salon', () => {
    const inicio = SALONES.indexOf('async function cambiarUnSalon(');
    const fn = SALONES.slice(inicio, SALONES.indexOf('\n}', inicio));
    expect(fn).toContain('mutateDataItem<Salon>(');
  });

  it('la transaccion lee Y escribe adentro de la base, no afuera', () => {
    const DATOS = leer('src', 'lib', 'data-service.ts');
    const inicio = DATOS.indexOf('export async function mutateDataItem');
    const fn = DATOS.slice(inicio, DATOS.indexOf('\nexport ', inicio + 10));
    const transaccion = fn.slice(fn.indexOf('runTransaction'));
    expect(transaccion).toContain('transaction.get(ref)');
    expect(transaccion).toContain('transaction.set(ref');
  });
});
