import type { PagoCliente } from '@/types/presupuesto';
import { roundMoney } from '@/lib/budget/financial-guardrails';

/**
 * La regla que evita que un mismo cobro se cuente dos veces.
 *
 * El caso, que es de todos los dias en un equipo chico: alguien cobra la cuota y la
 * carga a mano (en pagos rapidos o en el presupuesto), y despues alguien carga ese
 * mismo cobro en la factura. La factura copia su pago al presupuesto, y ahi quedaban
 * los dos.
 *
 * El control que habia buscaba un pago con **la misma referencia**, y no coincidian:
 * el cargado a mano decia "Efectivo" y el de la factura viene con una referencia
 * automatica. Asi que entraba como pago nuevo.
 *
 * El panel contable elige la fuente mas completa entre la factura y el presupuesto en
 * vez de sumar las dos —eso ya estaba bien pensado—, pero con el pago repetido adentro
 * del presupuesto esa fuente venia inflada: **el dueno veia el doble de lo cobrado**.
 *
 * Vive aca, y no en el archivo de acciones, por un motivo concreto: ese archivo es de
 * servidor y **cada cosa que exporta tiene que ser una funcion asincronica**. Una
 * funcion comun exportada ahi rompe la compilacion, y eso no lo avisa el revisor de
 * tipos: lo descubris cuando ya no podes publicar.
 */

/** Un pago que llega copiado desde una factura, no cargado a mano. */
export function esEspejoDeFactura(referencia?: string): boolean {
  return !!referencia && referencia.startsWith('AK_SYNC:');
}

function mismoDia(unaFecha?: string, otraFecha?: string): boolean {
  if (!unaFecha || !otraFecha) return false;
  return unaFecha.slice(0, 10) === otraFecha.slice(0, 10);
}

/**
 * Busca el pago cargado a mano que es el mismo que esta copia de la factura.
 *
 * Devuelve la posicion en la lista, o -1 si no hay gemelo. Se compara por importe y
 * por dia, y se ignoran los que ya son copias: asi, si el cliente pago dos veces el
 * mismo importe el mismo dia, cada copia se lleva un gemelo distinto y no se pierde
 * ningun cobro.
 */
export function buscarGemeloCargadoAMano(
  pagos: PagoCliente[],
  pago: { monto: number; fecha?: string },
): number {
  return pagos.findIndex((existente) =>
    existente.estadoPago !== 'rechazado'
    && !esEspejoDeFactura(existente.referencia)
    && roundMoney(existente.monto) === roundMoney(pago.monto)
    && mismoDia(existente.fecha, pago.fecha)
  );
}
