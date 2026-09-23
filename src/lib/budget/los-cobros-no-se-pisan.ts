import type { PagoCliente, Presupuesto } from '@/types/presupuesto';
import { getBudgetPaymentSummary } from '@/lib/budget/financial-guardrails';

/**
 * LOS COBROS NO SE PISAN CON UNA LISTA VIEJA.
 *
 * Casi todo lo que guarda presupuestos guarda la LISTA ENTERA que leyo un rato antes
 * (crear uno, archivar otro, cambiar un item). Si mientras tanto otro servidor anoto un
 * cobro, esa lista vieja lo borraba: el cobro desaparecia sin que nadie se entere.
 *
 * La regla: cuando se guarda la lista entera, **los cobros de un presupuesto que ya
 * existe en la base se toman de la base**, no de la lista vieja. Los cobros cambian
 * solamente por el camino de cobros (`cambiarCobrosDelPresupuesto`, con transaccion),
 * o en un presupuesto nuevo. Y como el saldo depende de los cobros, se recalcula.
 */
export function conLosCobrosDeLaBase(
  entrante: Record<string, unknown>,
  enLaBase: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!enLaBase) return entrante;
  const cobrosDeLaBase = (enLaBase.pagosCliente as PagoCliente[] | undefined) ?? [];
  const resultado: Record<string, unknown> = { ...entrante, pagosCliente: cobrosDeLaBase };
  if (JSON.stringify(entrante.pagosCliente ?? []) !== JSON.stringify(cobrosDeLaBase)) {
    resultado.saldo = getBudgetPaymentSummary(
      resultado as unknown as Presupuesto,
      { includeAnnualAdjustment: true },
    ).balance;
  }
  return resultado;
}

/**
 * Lo mismo para las FACTURAS, con una diferencia: los pagos de una factura solo se
 * agregan (no hay pantalla que los borre). Asi que se juntan: los de la base, mas los
 * nuevos que trae la lista. Uno anotado por otro mientras tanto no se pierde, y uno
 * anotado por quien guarda tampoco.
 */
export function facturaConLosPagosDeLaBase(
  entrante: Record<string, unknown>,
  enLaBase: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!enLaBase) return entrante;
  type PagoFactura = { id?: string; amount?: number };
  const deLaBase = (enLaBase.payments as PagoFactura[] | undefined) ?? [];
  const entrantes = (entrante.payments as PagoFactura[] | undefined) ?? [];
  const idsDeLaBase = new Set(deLaBase.map((p) => p.id).filter(Boolean));
  const juntos = [...deLaBase, ...entrantes.filter((p) => !p.id || !idsDeLaBase.has(p.id))];
  if (juntos.length === entrantes.length) return entrante;
  const resultado: Record<string, unknown> = { ...entrante, payments: juntos };
  // Si con los pagos de la base la factura queda cubierta, queda pagada.
  const total = Number(entrante.totalAmount) || 0;
  const pagado = juntos.reduce((suma, p) => suma + (Number(p.amount) || 0), 0);
  if (total > 0 && pagado >= total - 1) resultado.status = 'Paid';
  return resultado;
}

/**
 * Colecciones de plata donde guardar la lista entera NO borra lo que falta en la lista.
 *
 * Una lista leida un rato antes no trae lo que otro creo mientras tanto; borrar "lo que
 * no esta" borraba ese presupuesto o esa factura recien creados. En estas dos, borrar
 * es siempre explicito (`forceDeleteDocFromFirestore`), nunca por omision.
 */
export const COLECCIONES_QUE_NO_SE_BORRAN_POR_OMISION = new Set(['presupuestos', 'facturas']);
