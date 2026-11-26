import { readData } from '@/lib/data-service';
import { esLecturaFallida, marcarLecturaFallida } from '@/lib/marca-de-lectura';
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
const CACHE_TTL_MS = 60_000;

let cache: ServicioEmpresa[] | null = null;
let cacheAt = 0;

export function limpiarCacheInsumos() {
  cache = null;
  cacheAt = 0;
}

export async function leerInsumosCrudos(): Promise<ServicioEmpresa[]> {
  if (cache && Date.now() - cacheAt < CACHE_TTL_MS) return cache;
  const items = await readData<Array<Record<string, unknown>>>(INSUMOS_FILE, []);
  const fallida = esLecturaFallida(items);
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
  if (fallida) {
    return marcarLecturaFallida(mapped, 'No se pudo leer la lista de insumos');
  }
  cache = mapped;
  cacheAt = Date.now();
  return mapped;
}
