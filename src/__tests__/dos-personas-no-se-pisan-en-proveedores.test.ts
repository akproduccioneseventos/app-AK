/**
 * MATAFUEGO — Dos personas editando el mismo proveedor no se pisan, y las dos no pueden
 * decir que salio bien.
 *
 * Lo encontro Codex el 21 de septiembre de 2026: guardar un proveedor era leer la lista,
 * mezclar y escribir, en tres momentos distintos. Si dos personas guardaban a la vez,
 * el segundo escribia encima con su copia vieja y **el cambio del primero desaparecia**,
 * con las dos pantallas diciendo que se guardo. Lo mismo al crear: el control de repetidos
 * miraba una lista que ya podia estar vieja.
 *
 * Se probo rompiendola a proposito: sacando el turno de `saveProveedor`, se pone en rojo.
 */
import fs from 'fs';
import path from 'path';

const ARCHIVO = path.join(process.cwd(), 'src', 'app', 'actions', 'proveedores.ts');
const CODIGO = fs.readFileSync(ARCHIVO, 'utf-8');

/** El cuerpo de una funcion, para no confundirse con la de al lado. */
function cuerpoDe(nombre: string): string {
  const inicio = CODIGO.indexOf(`export async function ${nombre}(`);
  if (inicio === -1) throw new Error(`No encontre ${nombre} en proveedores.ts`);
  const candidatos = [
    CODIGO.indexOf('\nexport async function ', inicio + 10),
    CODIGO.indexOf('\nasync function ', inicio + 10),
  ].filter((i) => i !== -1);
  const siguiente = candidatos.length > 0 ? Math.min(...candidatos) : -1;
  return CODIGO.slice(inicio, siguiente === -1 ? undefined : siguiente);
}

describe('Dos personas no se pisan en proveedores', () => {
  it('guardar un proveedor pasa por un turno', () => {
    expect(cuerpoDe('saveProveedor')).toContain('turnoDeProveedores.runExclusive');
  });

  it('borrar un proveedor pasa por un turno', () => {
    expect(cuerpoDe('deleteProveedor')).toContain('turnoDeProveedores.runExclusive');
  });

  it('la lectura de la lista queda ADENTRO del turno', () => {
    // Si la lectura quedara afuera, el que espera trabajaria con la lista vieja y el
    // turno no serviria de nada. Es el error que ya se cometio en otros guardados.
    const interno = CODIGO.slice(CODIGO.indexOf('async function saveProveedorInterno('));
    expect(interno).toContain('await getProveedores()');
    expect(cuerpoDe('saveProveedor')).not.toContain('await getProveedores()');
  });

  it('la sesion se comprueba antes del turno, no adentro', () => {
    const cuerpo = cuerpoDe('saveProveedor');
    expect(cuerpo.indexOf('requireAppSession')).toBeLessThan(cuerpo.indexOf('runExclusive'));
  });
});
