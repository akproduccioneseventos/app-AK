import type { CompraProveedorEstado, RenglonPedidoEnviado } from '@/types/fiesta';

/**
 * EL SEGUIMIENTO DEL PEDIDO AL PROVEEDOR (28/09/2026).
 *
 * Antes el pedido era sólo un mensaje: se mandaba y nadie sabía si había llegado todo.
 * Si el proveedor mandaba de menos, la cocina se enteraba el día de la fiesta. Ahora
 * se guarda qué se pidió y se anota cuánto llegó de cada cosa, y la app dice sola si
 * llegó completo o qué falta.
 *
 * El stock del depósito NO se toca acá, a propósito: la comida que se consume en cada
 * fiesta no se descuenta del depósito, así que sumarle lo que llega lo inflaría.
 */

export type EtapaDelPedido = 'sin_pedir' | 'pedido' | 'llego_completo' | 'llego_incompleto';

export interface Faltante {
  nombre: string;
  unit: string;
  faltan: number;
}

type RenglonDeLista = { nombre: string; unit: string; cantidadAComprar: number; origenId?: string };

/** Lo que va a salir en el pedido: sólo lo que hay que comprar. */
export function renglonesDelPedido(items: RenglonDeLista[]): RenglonPedidoEnviado[] {
  return items
    .filter((item) => Number(item.cantidadAComprar) > 0)
    .map((item) => ({
      clave: item.origenId || item.nombre,
      nombre: item.nombre,
      unit: item.unit,
      cantidad: Number(item.cantidadAComprar),
    }));
}

/** El estado del proveedor después de mandar el pedido: queda marcado como pedido. */
export function registrarPedidoEnviado(
  estado: CompraProveedorEstado | undefined,
  proveedor: string,
  proveedorId: string,
  renglones: RenglonPedidoEnviado[],
  ahora: Date = new Date(),
): CompraProveedorEstado {
  return {
    pagado: false,
    montoPagado: 0,
    ...(estado ?? {}),
    proveedor,
    proveedorId,
    pedido: true,
    pedidoEnviadoAt: ahora.toISOString(),
    pedidoRenglones: renglones,
    // Un pedido nuevo empieza sin nada recibido.
    recibidos: {},
    entregadoParcial: false,
  };
}

/** Anota cuánto llegó de un renglón. Un número inválido o negativo cuenta como cero. */
export function anotarRecibido(
  estado: CompraProveedorEstado,
  clave: string,
  cantidad: number,
): CompraProveedorEstado {
  const valor = Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 0;
  const recibidos = { ...(estado.recibidos ?? {}), [clave]: valor };
  const siguiente = { ...estado, recibidos };
  return { ...siguiente, entregadoParcial: estadoDelPedido(siguiente).etapa === 'llego_completo' };
}

/** Anota que llegó todo lo pedido. */
export function anotarQueLlegoTodo(estado: CompraProveedorEstado): CompraProveedorEstado {
  const recibidos: Record<string, number> = {};
  for (const renglon of estado.pedidoRenglones ?? []) recibidos[renglon.clave] = renglon.cantidad;
  return { ...estado, recibidos, entregadoParcial: true };
}

/**
 * En qué anda el pedido. "Llegó incompleto" sólo cuando ya se anotó lo que llegó y
 * falta algo: un pedido del que todavía no se anotó nada sigue en "pedido".
 */
export function estadoDelPedido(estado: CompraProveedorEstado | undefined): {
  etapa: EtapaDelPedido;
  faltantes: Faltante[];
} {
  const renglones = estado?.pedidoRenglones ?? [];
  if (!estado?.pedido || renglones.length === 0) {
    return { etapa: estado?.pedido ? 'pedido' : 'sin_pedir', faltantes: [] };
  }
  const recibidos = estado.recibidos ?? {};
  const anotoAlgo = renglones.some((r) => recibidos[r.clave] !== undefined);
  if (!anotoAlgo) return { etapa: 'pedido', faltantes: [] };

  const faltantes = renglones
    .map((r) => ({ nombre: r.nombre, unit: r.unit, faltan: r.cantidad - (Number(recibidos[r.clave]) || 0) }))
    .filter((f) => f.faltan > 0);
  return { etapa: faltantes.length === 0 ? 'llego_completo' : 'llego_incompleto', faltantes };
}
