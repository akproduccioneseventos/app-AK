import { readData } from '@/lib/data-service';
import type { ServicioEmpresa } from '@/types/empresa';

/**
 * La lectura de insumos SIN comprobar quien pregunta.
 *
 * Por que vive aca y no en el archivo de acciones: ahi cada funcion exportada es
 * una direccion de internet, y la lista de insumos trae lo que cuesta cada cosa y
 * cuanto queda en deposito. La puerta publica (`getInsumos`) ahora pide cuenta; el
 * armado de menus, que corre para el prospecto sin cuenta, usa esta lectura, que
 * solo se puede llamar desde adentro del servidor.
 */
const INSUMOS_FILE = 'insumos.json';

let cache: ServicioEmpresa[] | null = null;

export function limpiarCacheInsumos() {
  cache = null;
}

export async function leerInsumosCrudos(): Promise<ServicioEmpresa[]> {
  if (cache) return cache;
  const items = await readData<Array<Record<string, unknown>>>(INSUMOS_FILE, []);
  const mapped = (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    tipoItem: item.tipoItem || 'Insumo/Ingrediente',
    valorUnitarioEstimado:
      item.valorUnitarioEstimado !== undefined && !isNaN(Number(item.valorUnitarioEstimado))
        ? Number(item.valorUnitarioEstimado)
        : 0,
    cantidadDisponible:
      item.cantidadDisponible !== undefined && !isNaN(Number(item.cantidadDisponible))
        ? Number(item.cantidadDisponible)
        : undefined,
  })) as ServicioEmpresa[];
  cache = mapped;
  return mapped;
}
