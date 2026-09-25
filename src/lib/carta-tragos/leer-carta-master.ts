import type { Trago } from '@/types/fiesta';
import { readData } from '@/lib/data-service';
import { defaultCartaTragosData } from '@/lib/fiesta-defaults';

/**
 * La lectura de la carta de tragos de la empresa SIN comprobar quien pregunta.
 *
 * Por que vive aca y no en el archivo de acciones: ahi cada funcion exportada es una
 * direccion de internet, y esa lectura pide sesion del equipo. La barra atiende a
 * invitados, que no la tienen: hasta el 25 de septiembre de 2026 la barra llamaba a la
 * accion, fallaba en silencio y al invitado le mostraba la carta de fabrica, con recetas
 * que no son las cargadas. Esta lectura solo se puede llamar desde adentro del servidor.
 */
export const CARTA_TRAGOS_MASTER_FILE = 'carta-tragos-master.json';

export function normalizeMasterItems(items: Trago[]): Trago[] {
  return items.map((item) => {
    const { ingredientes, recetaIngredientes, stockDisponible, ...rest } = item;
    return {
      ...rest,
      ingredientes: ingredientes || [],
      recetaIngredientes: recetaIngredientes || [],
      stockDisponible: stockDisponible ?? 0,
    };
  });
}

export async function leerCartaTragosMaster(): Promise<Trago[]> {
  const fallback = normalizeMasterItems(defaultCartaTragosData.items);
  const data = await readData<Trago[]>(CARTA_TRAGOS_MASTER_FILE, fallback);
  return normalizeMasterItems(Array.isArray(data) ? data : fallback);
}
