import type { CargaOperativaCategoria, CargaOperativaItem } from '@/types/fiesta';

export const PREFIJO_QR_EQUIPO = 'ak-equipo:';

export interface ResultadoEscaneoQR {
  encontrado: boolean;
  equipoId?: string;
  itemModificado?: CargaOperativaItem;
  accion?: 'cargado' | 'retornado';
  error?: string;
  categoriasActualizadas: CargaOperativaCategoria[];
}

/**
 * Función pura que procesa el escaneo de un código QR de equipo operativo:
 * - un id existente con ak-equipo:<id> marca cargado;
 * - escaneado dos veces (ya cargado), marca retornado;
 * - un id ajeno o no existente no marca nada y devuelve error informativo.
 */
export function procesarEscaneoQREquipo(
  codigoQR: string,
  categorias: CargaOperativaCategoria[],
): ResultadoEscaneoQR {
  if (!codigoQR || typeof codigoQR !== 'string' || !codigoQR.startsWith(PREFIJO_QR_EQUIPO)) {
    return {
      encontrado: false,
      error: 'El código QR no pertenece a un equipo de AK Producciones.',
      categoriasActualizadas: categorias,
    };
  }

  const equipoId = codigoQR.slice(PREFIJO_QR_EQUIPO.length).trim();
  if (!equipoId) {
    return {
      encontrado: false,
      error: 'Código QR de equipo sin identificador válido.',
      categoriasActualizadas: categorias,
    };
  }

  let encontrado = false;
  let itemModificado: CargaOperativaItem | undefined;
  let accion: 'cargado' | 'retornado' | undefined;

  const categoriasActualizadas = categorias.map((cat) => {
    const items = cat.items.map((item) => {
      // Coincide por origenId (el ID del equipo/activo fijo) o por id directo
      if ((item.origenId === equipoId || item.id === equipoId) && !encontrado) {
        encontrado = true;
        if (!item.cargado) {
          accion = 'cargado';
          itemModificado = { ...item, cargado: true };
          return itemModificado;
        } else if (!item.retornado) {
          accion = 'retornado';
          itemModificado = { ...item, retornado: true };
          return itemModificado;
        } else {
          itemModificado = item;
          return item;
        }
      }
      return item;
    });

    return { ...cat, items };
  });

  if (!encontrado) {
    return {
      encontrado: false,
      equipoId,
      error: `El equipo con ID "${equipoId}" no está asignado a la carga de esta fiesta.`,
      categoriasActualizadas: categorias,
    };
  }

  return {
    encontrado: true,
    equipoId,
    itemModificado,
    accion,
    categoriasActualizadas,
  };
}
