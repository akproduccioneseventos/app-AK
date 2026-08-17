import fs from 'fs';
import path from 'path';

/**
 * La llegada del equipo a la fiesta se guarda como todo lo demas.
 *
 * Por que existe esta prueba: la primera version escribia el archivo JSON a mano
 * con `fs.writeFile` y no pedia sesion. Dos problemas de verdad:
 *
 * 1. En produccion los datos viven en la base, no en los archivos del proyecto.
 *    Escribir el archivo a mano hacia que el "llegue" **no se guardara en ningun
 *    lado**: la persona tocaba el boton y la pantalla la seguia mostrando en
 *    rojo.
 * 2. Sin sesion, cualquiera podia marcar que llego cualquiera, y ademas se podia
 *    leer en que fiestas trabaja cada empleado.
 */

const ARCHIVO = 'src/app/actions/personal-fiestas.ts';

function leer(): string {
  return fs.readFileSync(path.join(process.cwd(), ARCHIVO), 'utf8');
}

describe('la llegada del equipo se guarda y se protege como el resto', () => {
  it('no escribe archivos a mano: usa el guardado comun de la app', () => {
    const fuente = leer();

    expect(fuente).not.toContain('fs.writeFile');
    expect(fuente).not.toContain("from 'fs/promises'");
    expect(fuente).toContain('updateDataPartial');
  });

  it('todas las acciones piden sesion', () => {
    const fuente = leer();

    const exportadas = fuente
      .split('export async function')
      .slice(1)
      .map(bloque => bloque.split('\n')[0].split('(')[0].trim());

    expect(exportadas.length).toBeGreaterThan(0);

    for (const bloque of fuente.split('export async function').slice(1)) {
      expect(bloque).toContain('await requireAppSession()');
    }
  });

  it('no pisa la hora de llegada si ya estaba marcada', () => {
    const fuente = leer();

    // Marcar dos veces no puede cambiar la hora original: sirve para saber si
    // alguien llego tarde.
    expect(fuente).toContain('if (fiesta.personalAsignado[indice].checkInTimestamp) return true;');
  });
});
