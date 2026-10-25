import type { Presupuesto } from '@/types/presupuesto';
import { recalcularCostoItem } from '@/lib/calculations';
import { normalizePresupuestoFinancials } from '@/lib/budget/financial-guardrails';

/**
 * La cuenta del presupuesto a partir de sus renglones y sus invitados: la misma que hace el guardado
 * normal (`guardarPresupuestoSinTurno`). Existe para que las aprobaciones del portal no sumen a mano
 * al total y dejen los renglones diciendo otra cosa (Codex 204, orden 211, B2 y B3).
 */
export function cuentaDelPresupuesto(presupuesto: Presupuesto) {
  const adultos = presupuesto.invitadosAdultos || 0;
  const adolescentes = presupuesto.invitadosAdolescentes || 0;
  const ninos = presupuesto.invitadosNinos || 0;
  const items = (presupuesto.itemsPresupuestados || []).map((item) => ({
    ...item,
    costoTotalItem: recalcularCostoItem(item, adultos, adolescentes, ninos),
  }));
  const subtotal = items.filter((item) => !item.esRegalo).reduce((sum, item) => sum + item.costoTotalItem, 0);
  let totalConDescuento = subtotal;
  if (presupuesto.descuentoTipo && presupuesto.descuentoValor) {
    const descuento = presupuesto.descuentoTipo === 'porcentaje'
      ? (subtotal * presupuesto.descuentoValor) / 100
      : presupuesto.descuentoValor;
    totalConDescuento = subtotal - descuento;
  }
  return { items, subtotal, totalConDescuento: Math.round(totalConDescuento) };
}

export function presupuestoRecalculado(presupuesto: Presupuesto): Presupuesto {
  const { items, subtotal, totalConDescuento } = cuentaDelPresupuesto(presupuesto);
  return normalizePresupuestoFinancials({
    ...presupuesto,
    itemsPresupuestados: items,
    costoTotalEstimado: subtotal,
    totalConDescuento,
  }, { preserveStoredTotal: false });
}
