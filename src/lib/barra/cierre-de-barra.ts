import type { BarDrinkOrder } from '@/types/barra-tecnologica';
import type { Trago } from '@/types/fiesta';

/**
 * EL CIERRE DE BARRA (28/09/2026).
 *
 * Cada trago pedido por la app descuenta sus botellas del depósito. Pero lo que se sirve
 * sin pasar por la app —un trago de cortesía, una copa que se rompió, lo que se sirvió de
 * más— no descuenta nada, y hasta ahora nadie se enteraba. Al cerrar la barra se cuentan
 * las botellas que quedan y la app compara con lo que el sistema cree que hay: la
 * diferencia es lo que salió sin registrarse.
 */

export interface FilaDelCierre {
  insumoId: string;
  nombre: string;
  unidad: string;
  /** Lo que el sistema cree que queda, ya descontados los pedidos. */
  enSistema: number;
  /** Lo que descontaron los pedidos de esta fiesta. */
  consumidoPorPedidos: number;
  /** Lo que se contó al cerrar. `undefined` si todavía no se contó. */
  contado?: number;
  /** enSistema − contado: positivo es lo que salió sin registrarse; negativo, lo que sobra. */
  diferencia?: number;
}

/** Los insumos que usa la carta de tragos de la fiesta, sin repetir. */
export function insumosDeLaBarra(tragos: Pick<Trago, 'recetaIngredientes'>[]): string[] {
  const ids = new Set<string>();
  for (const trago of tragos) {
    for (const ingrediente of trago.recetaIngredientes || []) {
      if (ingrediente?.insumoId) ids.add(ingrediente.insumoId);
    }
  }
  return [...ids];
}

/** Lo que descontaron los pedidos que siguen en pie (ni cancelados ni devueltos). */
export function consumoPorPedidos(pedidos: BarDrinkOrder[]): Map<string, number> {
  const consumo = new Map<string, number>();
  for (const pedido of pedidos) {
    if (pedido.status === 'cancelado' || pedido.stockRestoredAt) continue;
    for (const movimiento of pedido.stockMovements || []) {
      consumo.set(movimiento.insumoId, (consumo.get(movimiento.insumoId) || 0) + (Number(movimiento.cantidad) || 0));
    }
  }
  return consumo;
}

/** Suma el conteo a cada fila. Un conteo vacío, negativo o inválido no cuenta. */
export function compararConElConteo(
  filas: FilaDelCierre[],
  conteo: Record<string, number | undefined>,
): FilaDelCierre[] {
  return filas.map((fila) => {
    const valor = conteo[fila.insumoId];
    if (valor === undefined || !Number.isFinite(valor) || valor < 0) {
      return { ...fila, contado: undefined, diferencia: undefined };
    }
    return { ...fila, contado: valor, diferencia: redondear(fila.enSistema - valor) };
  });
}

/** Cuánto hay que mover el depósito para que quede en lo contado. Sólo filas contadas. */
export function ajustesAlConteo(filas: FilaDelCierre[]): Array<{ insumoId: string; ajuste: number }> {
  return filas
    .filter((fila) => fila.contado !== undefined && fila.diferencia !== undefined && fila.diferencia !== 0)
    .map((fila) => ({ insumoId: fila.insumoId, ajuste: redondear((fila.contado as number) - fila.enSistema) }));
}

function redondear(valor: number): number {
  return Math.round(valor * 1000) / 1000;
}
